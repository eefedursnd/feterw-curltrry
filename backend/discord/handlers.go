package discord

import (
	"log"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/models"
)

type Handler struct {
	services *ServiceManager
	commands *Commands
}

func NewHandler(services *ServiceManager) *Handler {
	return &Handler{
		services: services,
		commands: NewCommands(services),
	}
}

func (h *Handler) HandleMessage(s *discordgo.Session, m *discordgo.MessageCreate) {
	if m == nil || m.Author == nil || s == nil || s.State == nil || s.State.User == nil {
		log.Printf("Warning: Received incomplete message event")
		return
	}

	if m.Author.ID == s.State.User.ID {
		return
	}

	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in HandleMessage: %v", r)
		}
	}()

	h.commands.Execute(s, m)
}

func (h *Handler) StartBoosterCheckCron(s *discordgo.Session) {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		h.checkBoosterBadges(s)
	}
}

func (h *Handler) StartBadgeRoleSync(s *discordgo.Session) {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			h.syncBadgesWithRoles(s)
		}
	}()
}

func (h *Handler) StartLinkedRoleSync(s *discordgo.Session) {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			h.syncLinkedRoleWithUsers(s)
		}
	}()
}

func (h *Handler) checkBoosterBadges(s *discordgo.Session) {
	members, err := s.GuildMembers(config.DiscordGuildID, "", 1000)
	if err != nil {
		return
	}

	for _, member := range members {
		discordUser, err := h.services.Discord.GetUserByDiscordID(member.User.ID)
		if err != nil {
			continue
		}

		user, err := h.services.User.GetUserByUID(discordUser.UID)
		if err != nil {
			continue
		}

		badges, err := h.services.Badge.GetUserBadges(user.UID)
		if err != nil {
			log.Printf("Error getting user badges: %v", err)
			continue
		}

		if member.PremiumSince != nil {
			hasBoosterBadge := hasBadge(badges, "Booster")
			if !hasBoosterBadge {
				err := h.services.Badge.AssignBadge(user.UID, "Booster")
				if err != nil {
					log.Printf("Error adding booster badge to user %s: %v\n", member.User.Username, err)
					continue
				}

				if err := h.services.User.AddBadgeEditCredits(user.UID, 3); err != nil {
					log.Printf("Error adding badge edit credits to user %s: %v\n", member.User.Username, err)
					continue
				}
			}
		} else {
			hasBoosterBadge := hasBadge(badges, "Booster")
			if hasBoosterBadge {
				err := h.services.Badge.RemoveBadge(user.UID, "Booster")
				if err != nil {
					log.Printf("Error removing booster badge from user %s: %v\n", member.User.Username, err)
					continue
				}
			}
		}
	}
}

func (h *Handler) syncBadgesWithRoles(s *discordgo.Session) {
	discordUsers, err := h.services.User.GetDiscordLinkedUsers()
	if err != nil {
		return
	}

	for _, discordUser := range discordUsers {
		if discordUser.DiscordID == "" {
			continue
		}

		user, err := h.services.User.GetUserByUID(discordUser.UID)
		if err != nil {
			continue
		}

		member, err := s.GuildMember(config.DiscordGuildID, discordUser.DiscordID)
		if err != nil {
			continue
		}

		badges, err := h.services.Badge.GetUserBadges(user.UID)
		if err != nil {
			log.Printf("Error getting user badges: %v", err)
			continue
		}

		currentRoles := make(map[string]bool)
		for _, roleID := range member.Roles {
			currentRoles[roleID] = true
		}

		for _, badge := range badges {
			foundBadge, _ := h.services.Badge.GetBadge(badge.Badge.Name)
			if foundBadge.DiscordRoleID == "" {
				continue
			}

			if !currentRoles[foundBadge.DiscordRoleID] {
				err := s.GuildMemberRoleAdd(config.DiscordGuildID, discordUser.DiscordID, foundBadge.DiscordRoleID)
				if err != nil {
					log.Printf("Error adding role %s to user %s: %v\n", foundBadge.DiscordRoleID, user.Username, err)
					continue
				}
			}
		}

		for _, role := range member.Roles {
			hasBadgeWithRole := false
			for _, badge := range badges {
				foundBadge, _ := h.services.Badge.GetBadge(badge.Badge.Name)
				if foundBadge.DiscordRoleID == role {
					hasBadgeWithRole = true
					break
				}
			}

			if !hasBadgeWithRole {
				isBadgeRole := false
				allBadges, _ := h.services.Badge.GetBadges()
				for _, badge := range allBadges {
					if badge.DiscordRoleID == role {
						isBadgeRole = true
						break
					}
				}

				if isBadgeRole {
					err := s.GuildMemberRoleRemove(config.DiscordGuildID, discordUser.DiscordID, role)
					if err != nil {
						log.Printf("Error removing role %s from user %s: %v\n", role, user.Username, err)
						continue
					}
				}
			}
		}
	}
}

func (h *Handler) syncLinkedRoleWithUsers(s *discordgo.Session) {
	if config.DiscordLinkedRoleID == "" {
		return
	}

	discordUsers, err := h.services.User.GetDiscordLinkedUsers()
	if err != nil {
		log.Printf("Error getting discord linked users: %v", err)
		return
	}

	linkedDiscordIDs := make(map[string]bool)
	for _, discordUser := range discordUsers {
		if discordUser.DiscordID != "" {
			linkedDiscordIDs[discordUser.DiscordID] = true
		}
	}

	members, err := s.GuildMembers(config.DiscordGuildID, "", 1000)
	if err != nil {
		log.Printf("Error getting guild members: %v", err)
		return
	}

	for _, member := range members {
		if member.User.ID == s.State.User.ID {
			continue
		}

		isLinked := linkedDiscordIDs[member.User.ID]

		hasLinkedRole := false
		for _, roleID := range member.Roles {
			if roleID == config.DiscordLinkedRoleID {
				hasLinkedRole = true
				break
			}
		}

		if isLinked && !hasLinkedRole {
			err := s.GuildMemberRoleAdd(config.DiscordGuildID, member.User.ID, config.DiscordLinkedRoleID)
			if err != nil {
				log.Printf("Error adding linked role to user %s: %v\n", member.User.Username, err)
			} else {
				log.Printf("Added linked role to user %s\n", member.User.Username)
			}
		}

		if !isLinked && hasLinkedRole {
			err := s.GuildMemberRoleRemove(config.DiscordGuildID, member.User.ID, config.DiscordLinkedRoleID)
			if err != nil {
				log.Printf("Error removing linked role from user %s: %v\n", member.User.Username, err)
			} else {
				log.Printf("Removed linked role from user %s\n", member.User.Username)
			}
		}
	}
}

func hasBadge(badges []*models.UserBadge, badgeName string) bool {
	for _, badge := range badges {
		if badge.Badge.Name == badgeName {
			return true
		}
	}
	return false
}
