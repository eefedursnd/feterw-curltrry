package discord

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/db"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/services"
)

type Bot struct {
	Session      *discordgo.Session
	handler      *Handler
	services     *ServiceManager
	eventService *services.EventService
}

func NewBot(redisClient *redis.Client) (*Bot, error) {
	session, err := discordgo.New("Bot " + config.DiscordToken)
	if err != nil {
		return nil, err
	}
	session.StateEnabled = true

	session.Identify.Intents = discordgo.IntentsGuilds |
		discordgo.IntentsGuildMembers |
		discordgo.IntentsGuildPresences |
		discordgo.IntentsGuildMessages

	userService := services.NewUserService(db.DB, redisClient, session)
	discordService := services.NewDiscordService(db.DB, redisClient, userService, session)
	badgeService := services.NewBadgeService(db.DB, redisClient)
	punishService := services.NewPunishService(db.DB, redisClient)
	profileService := services.NewProfileService(db.DB, redisClient, session, discordService)
	redeemService := services.NewRedeemService(db.DB, redisClient)
	statusService := services.NewStatusService(db.DB)
	imageService := services.NewImageService()
	altAccountService := services.NewAltAccountService(db.DB, redisClient, userService.EventService)
	eventService := services.NewEventService(db.DB, redisClient, session)
	inviteService := services.NewInviteService(db.DB, redisClient)


	serviceManager := &ServiceManager{
		User:         userService,
		Discord:      discordService,
		Badge:        badgeService,
		Profile:      profileService,
		Punish:       punishService,
		Redeem:       redeemService,
		Status:       statusService,
		Image:        imageService,
		AltAccount:   altAccountService,
		Event:        eventService,
		Invite:       inviteService,
	}

	bot := &Bot{
		Session:      session,
		handler:      NewHandler(serviceManager),
		services:     serviceManager,
		eventService: eventService,
	}

	bot.registerHandlers()
	bot.registerEventHandlers()
	return bot, nil
}

func (b *Bot) Start() error {
	if err := b.Session.Open(); err != nil {
		return err
	}

	log.Println("Discord Bot is now running.")
	go b.handler.StartBoosterCheckCron(b.Session)
	go b.handler.StartBadgeRoleSync(b.Session)
	go b.handler.StartLinkedRoleSync(b.Session)

	return nil
}

func (b *Bot) registerEventHandlers() {
	b.eventService.Subscribe(models.EventUserRegistered, b.handleUserRegistration)

	b.eventService.Subscribe(models.EventAltAccountDetected, b.handlePotentialAltAccount)

	b.eventService.Subscribe(models.EventDiscordLinked, b.handleDiscordLinked)

	b.eventService.Subscribe(models.EventRedeemCodeUsed, b.handleRedeemCodeUsed)

	log.Println("Event handlers registered successfully")
}

func (b *Bot) handleUserRegistration(event *models.Event) error {
	var data struct {
		UID      uint   `json:"uid"`
		Username string `json:"username"`
	}

	bytes, _ := json.Marshal(event.Data)
	if err := json.Unmarshal(bytes, &data); err != nil {
		return fmt.Errorf("error unmarshaling registration data: %w", err)
	}

	channelID := "1401929667165945889"

	ordinal := getOrdinalSuffix(data.UID)

	profileURL := fmt.Sprintf("https://cutz.lol/%s", data.Username)
	embed := &discordgo.MessageEmbed{
		URL:         profileURL,
		Title:       "New user registered!",
		Description: fmt.Sprintf("**%s** just registered and is our **%d%s** user! <:5609purpleverified:1408558248285700156>", data.Username, data.UID, ordinal),
		Color:       0x000000,
		Footer: &discordgo.MessageEmbedFooter{
			Text: "cutz.lol",
		},
	}

	_, err := b.Session.ChannelMessageSendEmbed(channelID, embed)
	if err != nil {
		return fmt.Errorf("error sending registration notification: %w", err)
	}

	return nil
}

func (b *Bot) handlePotentialAltAccount(event *models.Event) error {
	if event.Type == models.EventAltAccountDetected {
		var altData models.AltAccountData
		bytes, _ := json.Marshal(event.Data)
		if err := json.Unmarshal(bytes, &altData); err != nil {
			return fmt.Errorf("error unmarshaling alt account data: %w", err)
		}

		return b.processAltAccountAlert(altData, event.CreatedAt)
	}

	if event.Type == models.EventUserRegistered || event.Type == models.EventUserLoggedIn {
		data := event.Data
		altAccounts, hasAlts := data["alt_accounts"]
		if !hasAlts || altAccounts == nil {
			return nil
		}

		altData := models.AltAccountData{
			UID:             uint(data["uid"].(float64)),
			Username:        data["username"].(string),
			IPAddress:       data["ip_address"].(string),
			DetectionSource: string(event.Type),
			DetectionTime:   event.CreatedAt,
		}

		if alts, ok := altAccounts.([]interface{}); ok {
			for _, alt := range alts {
				if altMap, ok := alt.(map[string]interface{}); ok {
					instance := models.AltAccountInstance{
						UID:      uint(altMap["uid"].(float64)),
						Username: altMap["username"].(string),
					}

					if reason, ok := altMap["match_reason"].(string); ok {
						instance.MatchReason = reason
					}

					altData.AltAccounts = append(altData.AltAccounts, instance)
				}
			}
		}

		return b.processAltAccountAlert(altData, event.CreatedAt)
	}

	return nil
}

func (b *Bot) processAltAccountAlert(altData models.AltAccountData, timestamp time.Time) error {
	channelID := "1401929667165945889"

	altUsernamesFormatted := make([]string, 0, len(altData.AltAccounts))

	for _, alt := range altData.AltAccounts {
		altText := fmt.Sprintf("**%s** (UID: %d)", alt.Username, alt.UID)
		if alt.MatchReason != "" {
			altText += fmt.Sprintf(" - *%s*", alt.MatchReason)
		}
		altUsernamesFormatted = append(altUsernamesFormatted, altText)
	}

	fields := []*discordgo.MessageEmbedField{
		{
			Name:   "User",
			Value:  fmt.Sprintf("**%s** (UID: %d)", altData.Username, altData.UID),
			Inline: true,
		},
		{
			Name:   "Shared IP",
			Value:  fmt.Sprintf("`%s`", altData.IPAddress),
			Inline: true,
		},
		{
			Name:   "Detection Time",
			Value:  fmt.Sprintf("<t:%d:R>", timestamp.Unix()),
			Inline: true,
		},
	}

	if len(altUsernamesFormatted) > 0 {
		fields = append(fields, &discordgo.MessageEmbedField{
			Name:   "Potential Alt Accounts",
			Value:  strings.Join(altUsernamesFormatted, "\n"),
			Inline: false,
		})
	}

	if altData.Notes != "" {
		fields = append(fields, &discordgo.MessageEmbedField{
			Name:   "Notes",
			Value:  altData.Notes,
			Inline: false,
		})
	}

	if altData.Confidence > 0 {
		confidenceEmoji := "🟨"
		if altData.Confidence >= 0.8 {
			confidenceEmoji = "🟥"
		} else if altData.Confidence < 0.5 {
			confidenceEmoji = "🟩"
		}

		fields = append(fields, &discordgo.MessageEmbedField{
			Name:   "Confidence",
			Value:  fmt.Sprintf("%s %.0f%%", confidenceEmoji, altData.Confidence*100),
			Inline: true,
		})
	}

	title := "Potential Alt Account Detected"
	description := "A potential alt account has been detected during "

	isNewRegistration := altData.DetectionSource == string(models.EventUserRegistered)
	if isNewRegistration {
		description += "registration."
		title = "⚠️ " + title + " (New Registration)"
	} else if altData.DetectionSource == string(models.EventUserLoggedIn) {
		description += "login with a new IP."
		title = "🔍 " + title + " (Login)"
	} else {
		description += altData.DetectionSource + "."
		title = "🔎 " + title
	}

	profileURL := fmt.Sprintf("https://cutz.lol/%s", altData.Username)
	embed := &discordgo.MessageEmbed{
		URL:         profileURL,
		Title:       title,
		Description: description,
		Color:       0xFFA500,
		Fields:      fields,
		Footer: &discordgo.MessageEmbedFooter{
			Text: "cutz.lol security",
		},
		Timestamp: timestamp.Format(time.RFC3339),
	}

	_, err := b.Session.ChannelMessageSendEmbed(channelID, embed)
	if err != nil {
		return fmt.Errorf("error sending alt account notification: %w", err)
	}

	return nil
}

func getOrdinalSuffix(num uint) string {
	if num%100 >= 11 && num%100 <= 13 {
		return "th"
	}

	switch num % 10 {
	case 1:
		return "st"
	case 2:
		return "nd"
	case 3:
		return "rd"
	default:
		return "th"
	}
}

func (b *Bot) registerHandlers() {
	b.Session.AddHandler(b.handler.HandleMessage)
	b.Session.AddHandler(func(s *discordgo.Session, p *discordgo.PresenceUpdate) {
		err := s.State.PresenceAdd(config.DiscordGuildID, &p.Presence)
		if err != nil {
			log.Println("PresenceAdd failed:", err)
		}
	})
	b.Session.AddHandler(b.handleGuildMemberUpdate)
}

func (b *Bot) handleDiscordLinked(event *models.Event) error {
	var data models.DiscordLinkedData

	bytes, _ := json.Marshal(event.Data)
	if err := json.Unmarshal(bytes, &data); err != nil {
		return fmt.Errorf("error unmarshaling discord linked data: %w", err)
	}

	channelID := "1401929667165945889"

	profileURL := fmt.Sprintf("https://cutz.lol/%s", data.Username)
	embed := &discordgo.MessageEmbed{
		URL:         profileURL,
		Title:       "Discord Account Linked!",
		Description: fmt.Sprintf("🔗 **%s** just linked their Discord account!", data.Username),
		Color:       0x22d3d3,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:   "Discord ID",
				Value:  fmt.Sprintf("`%s`", data.DiscordID),
				Inline: true,
			},
			{
				Name:   "Discord Username",
				Value:  fmt.Sprintf("`%s`", data.DiscordUsername),
				Inline: true,
			},
			{
				Name:   "Linked At",
				Value:  fmt.Sprintf("<t:%d:R>", data.LinkedAt.Unix()),
				Inline: true,
			},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "cutz.lol discord integration",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	_, err := b.Session.ChannelMessageSendEmbed(channelID, embed)
	if err != nil {
		return fmt.Errorf("error sending discord linked notification: %w", err)
	}

	return nil
}

func (b *Bot) handleRedeemCodeUsed(event *models.Event) error {
	var data models.RedeemCodeData

	bytes, _ := json.Marshal(event.Data)
	if err := json.Unmarshal(bytes, &data); err != nil {
		return fmt.Errorf("error unmarshaling redeem code data: %w", err)
	}

	channelID := "1401929667165945889"

	profileURL := fmt.Sprintf("https://cutz.lol/%s", data.Username)
	embed := &discordgo.MessageEmbed{
		URL:         profileURL,
		Title:       "Premium Code Redeemed! 💎",
		Description: fmt.Sprintf("**%s** just redeemed a **%s** code! <:1443purpleverifed:1408558279235338260>", data.Username, data.ProductName),
		Color:       0x8B5CF6,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:   "User",
				Value:  data.Username,
				Inline: true,
			},
			{
				Name:   "Product",
				Value:  data.ProductName,
				Inline: true,
			},
			{
				Name:   "Code",
				Value:  fmt.Sprintf("`%s`", data.Code),
				Inline: true,
			},
			{
				Name:   "Profile",
				Value:  fmt.Sprintf("[View Profile](%s)", profileURL),
				Inline: true,
			},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "cutz.lol Premium Redemption",
		},
		Timestamp: data.RedeemedAt.Format(time.RFC3339),
	}

	_, err := b.Session.ChannelMessageSendEmbed(channelID, embed)
	if err != nil {
		return fmt.Errorf("error sending redeem code notification: %w", err)
	}

	return nil
}

func (b *Bot) handleGuildMemberUpdate(s *discordgo.Session, m *discordgo.GuildMemberUpdate) {
	// Check if the member just got boosted
	if m.PremiumSince != nil && m.PremiumSince.After(time.Now().Add(-time.Minute)) {
		// This is a new boost (within the last minute)
		log.Printf("New boost detected for user: %s (%s)", m.User.Username, m.User.ID)
		
		// Send boost notification
		channelID := "1401929667165945889"
		
		embed := &discordgo.MessageEmbed{
			Title:       "Thank you for boosting! ❤️",
			Description: fmt.Sprintf("**%s** just boosted the server! Thank you for your support! <:1443purpleverifed:1408558279235338260>", m.User.Username),
			Color:       0x8B5CF6, // Purple color
			Fields: []*discordgo.MessageEmbedField{
				{
					Name:   "User",
					Value:  fmt.Sprintf("<@%s>", m.User.ID),
					Inline: true,
				},
				{
					Name:   "Boosted At",
					Value:  fmt.Sprintf("<t:%d:R>", m.PremiumSince.Unix()),
					Inline: true,
				},
			},
			Footer: &discordgo.MessageEmbedFooter{
				Text: "cutz.lol Discord Server",
			},
			Timestamp: time.Now().Format(time.RFC3339),
		}
		
		_, err := s.ChannelMessageSendEmbed(channelID, embed)
		if err != nil {
			log.Printf("Error sending boost notification: %v", err)
		}
	}
}
