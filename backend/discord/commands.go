package discord

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

const (
	StaffLevelUser      uint = 0
	StaffLevelTrialMod  uint = 1
	StaffLevelModerator uint = 2
	StaffLevelHeadMod   uint = 3
	StaffLevelAdmin     uint = 4
)

var staffLevelNames = map[uint]string{
	StaffLevelUser:      "User",
	StaffLevelTrialMod:  "Trial Moderator",
	StaffLevelModerator: "Moderator",
	StaffLevelHeadMod:   "Head Moderator",
	StaffLevelAdmin:     "Administrator",
}

type Commands struct {
	services *ServiceManager
}

func NewCommands(services *ServiceManager) *Commands {
	return &Commands{services: services}
}

func (c *Commands) Execute(s *discordgo.Session, m *discordgo.MessageCreate) {
	if len(m.Content) < 1 || m.Content[:1] != config.DiscordPrefix {
		return
	}

	args := strings.Fields(m.Content)
	cmd := strings.TrimPrefix(args[0], config.DiscordPrefix)

	activeStatus, _ := c.services.Status.GetActiveStatus()
	isUnderMaintenance := activeStatus != nil

	isAdmin := m.Author.Username == "ret2862"
	if isUnderMaintenance && !isAdmin && cmd != "status" {
		embed := &discordgo.MessageEmbed{
			Title:       "System Maintenance",
			Description: "Only `?status` is available during maintenance.",
			Color:       0xEAB308,
			Footer: &discordgo.MessageEmbedFooter{
				Text: "haze.bio maintenance system",
			},
			Timestamp: time.Now().Format(time.RFC3339),
		}
		s.ChannelMessageSendEmbed(m.ChannelID, embed)
		return
	}

	switch cmd {
	case "help":
		if len(args) > 1 {
			switch args[1] {
			case "admin":
				c.handleAdminHelp(s, m)
			default:
				c.handleHelp(s, m)
			}
		} else {
			c.handleHelp(s, m)
		}
	case "addbadge":
		c.handleAddBadge(s, m, args)
	case "removebadge":
		c.handleRemoveBadge(s, m, args)
	case "createbadge":
		c.handleCreateBadge(s, m, args)
	case "check":
		c.handleCheck(s, m, args)
	case "profile":
		c.handleProfile(s, m, args)
	case "uidprofile":
		c.handleUIDProfile(s, m, args)
	case "me":
		c.handleMe(s, m)
	case "leaderboard":
		c.handleLeaderboard(s, m)
	case "lb":
		c.handleLeaderboard(s, m)
	case "stats":
		c.handleStats(s, m)
	case "status":
		c.handleStatus(s, m)
	case "createstatus":
		c.handleCreateStatus(s, m, args)
	case "deletestatus":
		c.handleDeleteStatus(s, m, args)
	case "generate":
		c.handleGenerate(s, m, args)
	case "setstafflevel":
		c.handleSetStaffLevel(s, m, args)
	case "staffinfo":
		c.handleStaffInfo(s, m, args)
	case "triggerevent":
		c.handleTriggerEvent(s, m, args)
	case "experiments":
		c.handleExperiments(s, m, args)
	case "createexperiment":
		c.handleCreateExperiment(s, m, args)
	case "deleteexperiment":
		c.handleDeleteExperiment(s, m, args)
	case "experimentstatus":
		c.handleExperimentStatus(s, m, args)
	case "checkuserexperiments":
		c.handleCheckUserExperiments(s, m, args)
	case "timediff":
		c.handleTimeDiff(s, m, args)
	case "createproductcode":
		c.handleCreateProductCode(s, m, args)
	default:
		if cmd != "" {
			s.ChannelMessageSend(m.ChannelID, "Invalid command. Type `?help` for a list of commands.")
		}
	}
}

func (c *Commands) handleCreateProductCode(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	adminUser, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil || (adminUser.StaffLevel < StaffLevelAdmin && m.Author.Username != "ret2862") {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to create product codes")
		return
	}

	if len(args) < 2 {
		c.sendInvalidUsageEmbed(s, m, "Please specify a product type",
			"`?createproductcode <product_type>`",
			"`?createproductcode premium`\n`?createproductcode custombadge`\n`?createproductcode badgecredits`")
		return
	}

	productType := strings.ToLower(args[1])
	var productData models.StripeProduct

	switch productType {
	case "premium":
		productData = models.StripeProduct{
			ProductName: "Premium Upgrade",
			PriceID:     "price_1RJCLqAtFxNQMTr0X7ICqGna",
		}
	case "custombadge":
		productData = models.StripeProduct{
			ProductName: "Custom Badge",
			PriceID:     "price_1RJCLqAtFxNQMTr0X7ICqGna",
		}
	case "badgecredits":
		productData = models.StripeProduct{
			ProductName: "Custom Badge Fee",
			PriceID:     "price_1RJCLqAtFxNQMTr0X7ICqGna",
		}
	default:
		availableProducts := []string{}
		for productName := range models.StripeProducts {
			availableProducts = append(availableProducts, fmt.Sprintf("• %s", strings.ToLower(strings.ReplaceAll(productName, " ", ""))))
		}

		c.sendInvalidInputEmbed(s, m, fmt.Sprintf("Invalid product type. Available products:\n%s", strings.Join(availableProducts, "\n")))
		return
	}

	redeemCode, err := c.services.Redeem.CreateRedeemCode(productData)
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to create redeem code: %v", err))
		return
	}

	embed := &discordgo.MessageEmbed{
		Title:       "Product Code Created",
		Description: "A new redeem code has been generated successfully",
		Color:       0x00ff00,
		Fields: []*discordgo.MessageEmbedField{
			{Name: "Product", Value: productData.ProductName, Inline: true},
			{Name: "Redeem Code", Value: fmt.Sprintf("`%s`", redeemCode), Inline: true},
			{Name: "Price ID", Value: productData.PriceID, Inline: true},
			{Name: "Created By", Value: adminUser.Username, Inline: true},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio redeem system",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	var productDescription string
	switch productData.ProductName {
	case "Premium Upgrade":
		productDescription = "• Lifetime premium subscription\n• Premium badge\n• Access to premium features"
	case "Custom Badge":
		productDescription = "• Creates a new custom badge\n• Adds 8 badge edit credits\n• Full customization available"
	case "Custom Badge Fee":
		productDescription = "• Adds 5 badge edit credits\n• For modifying existing badges"
	}

	if productDescription != "" {
		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name:   "What this code provides",
			Value:  productDescription,
			Inline: false,
		})
	}

	s.ChannelMessageSendEmbed(m.ChannelID, embed)

	log.Printf("Redeem code created by %s (%d): %s for product %s",
		adminUser.Username, adminUser.UID, redeemCode, productData.ProductName)
}

func (c *Commands) handleTriggerEvent(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	adminUser, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to trigger events")
		return
	}

	if adminUser.StaffLevel < StaffLevelAdmin && m.Author.Username != "ret2862" {
		c.sendUnauthorizedEmbed(s, m, "You need administrator permissions to trigger events")
		return
	}

	if len(args) < 2 {
		c.sendInvalidUsageEmbed(s, m, "Please specify an event type",
			"`?triggerevent <event_type> [params...]`",
			"`?triggerevent altaccount username1 username2`\n`?triggerevent registration username`")
		return
	}

	eventType := strings.ToLower(args[1])

	switch eventType {
	case "altaccount":
		if len(args) < 4 {
			c.sendInvalidUsageEmbed(s, m, "Please provide two usernames for alt account event",
				"`?triggerevent altaccount <new_username> <existing_username>`",
				"`?triggerevent altaccount newuser existinguser`")
			return
		}

		newUsername := args[2]
		existingUsername := args[3]

		newUser, err := c.services.User.GetUserByUsername(newUsername)
		if err != nil {
			c.sendErrorEmbed(s, m, fmt.Sprintf("New user not found: %s", newUsername))
			return
		}

		existingUser, err := c.services.User.GetUserByUsername(existingUsername)
		if err != nil {
			c.sendErrorEmbed(s, m, fmt.Sprintf("Existing user not found: %s", existingUsername))
			return
		}

		potentialAlts := []models.User{*existingUser}

		err = c.services.AltAccount.NotifyAltAccount(newUser, potentialAlts, "127.0.0.1", false)
		if err != nil {
			c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to trigger alt account event: %v", err))
			return
		}

		embed := &discordgo.MessageEmbed{
			Title:       "Event Triggered",
			Description: "Alt account event has been triggered successfully",
			Color:       0x00ff00,
			Fields: []*discordgo.MessageEmbedField{
				{Name: "Event Type", Value: "Alt Account Detection", Inline: true},
				{Name: "New User", Value: fmt.Sprintf("%s (UID: %d)", newUser.Username, newUser.UID), Inline: true},
				{Name: "Existing User", Value: fmt.Sprintf("%s (UID: %d)", existingUser.Username, existingUser.UID), Inline: true},
			},
			Footer: &discordgo.MessageEmbedFooter{
				Text: "haze.bio event system",
			},
			Timestamp: time.Now().Format(time.RFC3339),
		}
		s.ChannelMessageSendEmbed(m.ChannelID, embed)

	default:
		c.sendInvalidUsageEmbed(s, m, "Unknown event type",
			"`?triggerevent <event_type> [params...]`",
			"`?triggerevent altaccount username1 username2`")
	}
}

func (c *Commands) handleHelp(s *discordgo.Session, m *discordgo.MessageCreate) {
	embed := &discordgo.MessageEmbed{
		Title:       "haze.bio commands",
		Description: fmt.Sprintf("prefix: ``%s``", config.DiscordPrefix),
		Color:       0x000000,
		Thumbnail: &discordgo.MessageEmbedThumbnail{
			URL: m.Author.AvatarURL("512"),
		},
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:  "User Commands",
				Value: "``profile [username]``\n``uidprofile [user_id]``\n``me``\n``leaderboard``\n``stats``\n``status``\n``generate``\n``timediff``\n``help``",
			},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleSetStaffLevel(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	adminUser, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to set staff levels")
		return
	}

	if adminUser.StaffLevel < StaffLevelAdmin && m.Author.Username != "ret2862" {
		c.sendUnauthorizedEmbed(s, m, "You need administrator permissions to set staff levels")
		return
	}

	if len(args) < 3 {
		c.sendInvalidUsageEmbed(s, m, "Please provide a username and staff level",
			"`?setstafflevel <username> <level>`",
			"`?setstafflevel example 2`")
		return
	}

	username := args[1]
	levelStr := args[2]

	level, err := strconv.ParseUint(levelStr, 10, 32)
	if err != nil || level > 4 {
		c.sendInvalidInputEmbed(s, m, "Staff level must be a number between 0-4:\n0 = User\n1 = Trial Mod\n2 = Moderator\n3 = Head Mod\n4 = Admin")
		return
	}

	targetUser, err := c.services.User.GetUserByUsername(username)
	if err != nil {
		c.sendErrorEmbed(s, m, "User not found")
		return
	}

	if uint(level) > adminUser.StaffLevel && m.Author.Username != "ret2862" {
		c.sendUnauthorizedEmbed(s, m, "You cannot promote a user to a level higher than your own")
		return
	}

	fieldsToUpdate := map[string]interface{}{
		"staff_level": uint(level),
	}

	err = c.services.User.UpdateUser(targetUser.UID, fieldsToUpdate)
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to update staff level: %v", err))
		return
	}

	embed := &discordgo.MessageEmbed{
		Title:       "Staff Level Updated",
		Description: fmt.Sprintf("Successfully updated staff level for %s", targetUser.Username),
		Color:       0x00ff00,
		Fields: []*discordgo.MessageEmbedField{
			{Name: "User", Value: targetUser.Username, Inline: true},
			{Name: "New Staff Level", Value: fmt.Sprintf("%s (%d)", staffLevelNames[uint(level)], level), Inline: true},
			{Name: "Updated By", Value: adminUser.Username, Inline: true},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio staff management",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)

	if targetUser.DiscordID != "" {
		dmChannel, err := s.UserChannelCreate(targetUser.DiscordID)
		if err == nil {
			notificationEmbed := &discordgo.MessageEmbed{
				Title: "Your Staff Level Has Been Updated",
				Description: fmt.Sprintf("Your staff level on haze.bio has been updated to %s (Level %d)",
					staffLevelNames[uint(level)], level),
				Color: 0x00ff00,
				Fields: []*discordgo.MessageEmbedField{
					{Name: "Updated By", Value: adminUser.Username, Inline: true},
					{Name: "Updated At", Value: time.Now().Format(time.RFC3339), Inline: true},
				},
				Footer: &discordgo.MessageEmbedFooter{
					Text: "haze.bio staff management",
				},
			}
			s.ChannelMessageSendEmbed(dmChannel.ID, notificationEmbed)
		}
	}
}

func (c *Commands) handleStaffInfo(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	requestingUser, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil {
		c.sendUnauthorizedEmbed(s, m, "You need to link your Discord account to use this command")
		return
	}

	var targetUser *models.User

	if len(args) < 2 {
		targetUser = requestingUser
	} else {
		if requestingUser.StaffLevel < StaffLevelModerator && m.Author.Username != "ret2862" {
			c.sendUnauthorizedEmbed(s, m, "You need to be a Moderator or higher to check other users' staff information")
			return
		}

		username := args[1]
		targetUser, err = c.services.User.GetUserByUsername(username)
		if err != nil {
			c.sendErrorEmbed(s, m, "User not found")
			return
		}
	}

	staffLevelName, exists := staffLevelNames[targetUser.StaffLevel]
	if !exists {
		staffLevelName = "Unknown"
	}

	embed := &discordgo.MessageEmbed{
		Title:       "Staff Information",
		Description: fmt.Sprintf("Staff details for %s", targetUser.Username),
		Color:       getColorForStaffLevel(targetUser.StaffLevel),
		Thumbnail: &discordgo.MessageEmbedThumbnail{
			URL: m.Author.AvatarURL("512"),
		},
		Fields: []*discordgo.MessageEmbedField{
			{Name: "Username", Value: targetUser.Username, Inline: true},
			{Name: "User ID", Value: fmt.Sprintf("%d", targetUser.UID), Inline: true},
			{Name: "Staff Level", Value: fmt.Sprintf("%s (%d)", staffLevelName, targetUser.StaffLevel), Inline: true},
			{Name: "Account Created", Value: fmt.Sprintf("<t:%d:F>", targetUser.CreatedAt.Unix()), Inline: false},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio staff system",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	var hasStaffBadge bool
	for _, badge := range targetUser.Badges {
		if badge.Badge.Name == "Staff" {
			hasStaffBadge = true
			break
		}
	}

	if hasStaffBadge {
		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name:  "Staff Badge",
			Value: "Yes",
		})
	}

	var permissionsText string
	switch targetUser.StaffLevel {
	case StaffLevelAdmin:
		permissionsText = "• Full administrative access\n• Can manage staff levels\n• Can manage the system\n• Can manage badges"
	case StaffLevelHeadMod:
		permissionsText = "• Can remove restrictions from users\n• Can handle all reports\n• Can view full user history"
	case StaffLevelModerator:
		permissionsText = "• Can restrict users\n• Can handle reports\n• Can access moderation tools"
	case StaffLevelTrialMod:
		permissionsText = "• Can view reports\n• Limited access to user information\n• Cannot take moderation actions"
	default:
		permissionsText = "No staff permissions"
	}

	embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
		Name:  "Permissions",
		Value: permissionsText,
	})

	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func getColorForStaffLevel(level uint) int {
	switch level {
	case StaffLevelAdmin:
		return 0xFF0000 // Red for admin
	case StaffLevelHeadMod:
		return 0xFFA500 // Orange for head mod
	case StaffLevelModerator:
		return 0x008000 // Green for mod
	case StaffLevelTrialMod:
		return 0x0000FF // Blue for trial mod
	default:
		return 0x000000 // Black for user
	}
}

func (c *Commands) handleAdminHelp(s *discordgo.Session, m *discordgo.MessageCreate) {
	_, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to view admin commands")
		return
	}

	if m.Author.Username != "ret2862" {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to view admin commands")
		return
	}

	embed := &discordgo.MessageEmbed{
		Title:       "haze.bio admin commands",
		Description: "Admin commands require special permissions",
		Color:       0x000000,
		Thumbnail: &discordgo.MessageEmbedThumbnail{
			URL: m.Author.AvatarURL("512"),
		},
		Fields: []*discordgo.MessageEmbedField{
			{
				Name: "Badge Management",
				Value: "``addbadge [username] [badge]``\n" +
					"``removebadge [username] [badge]``\n" +
					"``createbadge [url] [type] [isCustom] [name]``",
			},
			{
				Name: "Staff Management",
				Value: "``setstafflevel [username] [level]``\n" +
					"``staffinfo [username]``",
			},
			{
				Name: "System Management",
				Value: "``createstatus [start] [end] [reason]``\n" +
					"``deletestatus [id]``\n" +
					"``createproductcode [type]``",
			},
			{
				Name: "Experimental Features",
				Value: "``experiments``\n" +
					"``createexperiment [params]``\n" +
					"``deleteexperiment [feature_key]``\n" +
					"``experimentstatus``\n" +
					"``checkuserexperiments [username]``",
			},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio admin system",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleAddBadge(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	_, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to add badges")
		return
	}

	if m.Author.Username != "ret2862" {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to add badges")
		return
	}

	if len(args) < 3 {
		c.sendInvalidUsageEmbed(s, m, "Please provide all required parameters", "`?addbadge <uid> <badge_name>`", "`?addbadge 1 \"Early User\"`")
		return
	}

	uid := args[1]
	badgeName := strings.Join(args[2:], " ")

	err = c.services.Badge.AssignBadge(utils.StringToUint(uid), badgeName)
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to add badge: %v", err))
		return
	}

	embed := &discordgo.MessageEmbed{
		Title:       "Badge Added",
		Description: fmt.Sprintf("Successfully added badge to user %s", uid),
		Color:       0x000000,
		Fields: []*discordgo.MessageEmbedField{
			{Name: "UID", Value: uid, Inline: true},
			{Name: "Badge", Value: badgeName, Inline: true},
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleRemoveBadge(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	_, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to remove badges")
		return
	}

	if m.Author.Username != "ret2862" {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to remove badges")
		return
	}

	if len(args) < 3 {
		c.sendInvalidUsageEmbed(s, m, "Please provide all required parameters", "`?removebadge <uid> <badge_name>`", "`?removebadge 1 \"Early User\"`")
		return
	}

	uid := args[1]
	badgeName := strings.Join(args[2:], " ")

	err = c.services.Badge.RemoveBadge(utils.StringToUint(uid), badgeName)
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to remove badge: %v", err))
		return
	}

	embed := &discordgo.MessageEmbed{
		Title:       "Badge Removed",
		Description: "Successfully removed badge from user",
		Color:       0x000000,
		Fields: []*discordgo.MessageEmbedField{
			{Name: "UID", Value: uid, Inline: true},
			{Name: "Badge", Value: badgeName, Inline: true},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio badge system",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleCreateBadge(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	_, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to create badges")
		return
	}

	if m.Author.Username != "ret2862" {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to create badges")
		return
	}

	if len(args) < 5 {
		c.sendInvalidUsageEmbed(s, m, "Please provide all required parameters", "`?createbadge <url> <isCustom> <name> <role_id>`", "`?createbadge https://example.com/badge.svg false \"Early User\" 123456789`")
		return
	}

	url := args[1]
	isCustom, err := strconv.ParseBool(args[2])
	name := strings.Join(args[3:len(args)-1], " ")
	roleID := args[len(args)-1]

	if err != nil {
		c.sendInvalidInputEmbed(s, m, "isCustom must be 'true' or 'false'")
		return
	}

	name = strings.TrimPrefix(name, "\"")
	name = strings.TrimSuffix(name, "\"")

	badge := &models.Badge{
		Name:     name,
		MediaURL: url,
		IsCustom: isCustom,
	}

	if roleID != "0" {
		badge.DiscordRoleID = roleID
	}

	err = c.services.Badge.CreateBadge(badge)
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to create badge: %v", err))
		return
	}

	embed := &discordgo.MessageEmbed{
		Title:       "Badge Created",
		Description: "New badge has been created successfully",
		Color:       0x000000,
		Fields: []*discordgo.MessageEmbedField{
			{Name: "Name", Value: badge.Name, Inline: true},
			{Name: "Custom", Value: strconv.FormatBool(badge.IsCustom), Inline: true},
			{Name: "URL", Value: badge.MediaURL},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio badge system",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	if badge.DiscordRoleID != "" {
		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name:  "Discord Role ID",
			Value: badge.DiscordRoleID,
		})
	} else {
		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name:  "Discord Role ID",
			Value: "Not set",
		})
	}

	if badge.IsCustom {
		embed.Thumbnail = &discordgo.MessageEmbedThumbnail{
			URL: badge.MediaURL,
		}
	}

	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleCheck(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	var user *models.User
	var err error

	staff, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to check users")
		return
	}

	badges, err := c.services.Badge.GetUserBadges(staff.UID)
	if err != nil {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to check users")
		return
	}

	if !hasBadge(badges, "Staff") {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to check users")
		return
	}

	if len(args) < 2 {
		c.sendInvalidUsageEmbed(s, m, "Please provide a user identifier", "`?check username:value`, `?check discord:id`, `?check id:id`", "`?check username:john`, `?check discord:123456789`, `?check id:123`")
		return
	}

	identifier := strings.SplitN(args[1], ":", 2)
	if len(identifier) != 2 {
		c.sendInvalidUsageEmbed(s, m, "Invalid identifier format", "`?check username:value`, `?check discord:id`, `check id:id`", "`?check username:john`, `?check discord:123456789`, `?check id:123`")
		return
	}

	identifierType := identifier[0]
	identifierValue := identifier[1]

	switch identifierType {
	case "username":
		user, err = c.services.User.GetUserByUsernamePublic(identifierValue)
		if err != nil {
			c.sendErrorEmbed(s, m, "User not found with that username")
			return
		}
	case "discord":
		user, err = c.services.Discord.GetUserByDiscordID(identifierValue)
		if err != nil {
			c.sendErrorEmbed(s, m, "User not found with that Discord ID")
			return
		}
	case "id":
		userID, err := strconv.Atoi(identifierValue)
		if err != nil {
			s.ChannelMessageSend(m.ChannelID, "Invalid user ID. Please enter a valid number.")
			return
		}
		user, err = c.services.User.GetUserByUID(uint(userID))
		if err != nil {
			c.sendErrorEmbed(s, m, "User not found with that ID")
			return
		}
	default:
		c.sendInvalidUsageEmbed(s, m, "Invalid identifier type", "`?check username:value`, `?check discord:id`, `?check id:id`", "`?check username:john`, `?check discord:123456789`, `?check id:123`")
		return
	}

	if len(args) > 2 && args[2] == "--discord" {
		var onServer string
		if user.DiscordID != "" {
			_, err = s.GuildMember(config.DiscordGuildID, user.DiscordID)
			if err == nil {
				onServer = "Yes"
			} else {
				onServer = "No"
			}
		} else {
			onServer = "Not Linked"
		}

		var discordInfo string
		if user.DiscordID == "" {
			discordInfo = "User is not linked to Discord"
		} else {
			discordMember, err := s.User(user.DiscordID)
			var discordUsername string
			if err == nil {
				discordUsername = discordMember.Username
			} else {
				discordUsername = "Unknown"
			}

			discordInfo = fmt.Sprintf("Discord ID: `%s`\nDiscord Username: `%s`\nLinked At: <t:%d:R>\nOn Server: `%s`",
				user.DiscordID, discordUsername, user.LinkedAt.Unix(), onServer)
		}

		embed := &discordgo.MessageEmbed{
			Title:       "User Discord Information",
			Description: fmt.Sprintf("Discord information for user %s (ID: %d)", user.Username, user.UID),
			Color:       0x000000,
			Fields: []*discordgo.MessageEmbedField{
				{
					Name:   "Discord Information",
					Value:  discordInfo,
					Inline: false,
				},
			},
			Footer: &discordgo.MessageEmbedFooter{
				Text: "haze.bio discord integration system",
			},
			Timestamp: time.Now().Format(time.RFC3339),
		}

		s.ChannelMessageSendEmbed(m.ChannelID, embed)
		return
	}

	var onServer string
	if user.DiscordID != "" {
		_, err = s.GuildMember(config.DiscordGuildID, user.DiscordID)
		if err == nil {
			onServer = "Yes"
		} else {
			onServer = "No"
		}
	} else {
		onServer = "Not Linked"
	}

	var discordInfo string
	if user.DiscordID == "" {
		discordInfo = "User is not linked"
	} else {
		discordInfo = fmt.Sprintf("Discord ID: `%s`\nLinked At: <t:%d:R>\nOn Server: `%s`",
			user.DiscordID, user.LinkedAt.Unix(), onServer)
	}

	embed := &discordgo.MessageEmbed{
		Title:       "User Information",
		Description: fmt.Sprintf("Information for user %s", user.Username),
		Color:       0x000000,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name: "General Information",
				Value: fmt.Sprintf("ID: `%d`\nUsername: `%s`\nAlias: `%s`",
					user.UID, user.Username, func() string {
						if user.Alias != nil {
							return *user.Alias
						}
						return "Not set"
					}()),
				Inline: false,
			},
			{
				Name: "Security",
				Value: fmt.Sprintf("2FA Enabled: `%t`\nDiscord Login: `%t`",
					user.MFAEnabled, user.LoginWithDiscord),
				Inline: false,
			},
			{
				Name:   "Timestamps",
				Value:  fmt.Sprintf("Created At: <t:%d:R>", user.CreatedAt.Unix()),
				Inline: false,
			},
			{
				Name:   "Discord Information",
				Value:  discordInfo,
				Inline: false,
			},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio user system",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	s.ChannelMessageSendEmbed(m.ChannelID, embed)

	if len(args) > 2 && args[2] == "--punishments" {
		punishments, err := c.services.Punish.GetActivePunishmentsForUser(user.UID)
		var punishmentEmbedColor int
		var punishmentEmbedFields []*discordgo.MessageEmbedField

		if err != nil {
			c.sendErrorEmbed(s, m, "Could not fetch punishments")
			return
		}

		if len(punishments) > 0 {
			punishmentEmbedColor = 0xff0000
			fields := []*discordgo.MessageEmbedField{}

			for _, punishment := range punishments {
				fields = append(fields, &discordgo.MessageEmbedField{
					Name:   "Punishment Reason",
					Value:  punishment.Reason,
					Inline: true,
				})
				fields = append(fields, &discordgo.MessageEmbedField{
					Name:   "Expires",
					Value:  fmt.Sprintf("<t:%d:R>", punishment.EndDate.Unix()),
					Inline: true,
				})
			}

			punishmentEmbedFields = fields
		} else {
			punishmentEmbedColor = 0x000000
			punishmentEmbedFields = []*discordgo.MessageEmbedField{
				{
					Name:  "Active Punishment",
					Value: "No active punishment found for this user",
				},
			}
		}

		punishmentEmbed := &discordgo.MessageEmbed{
			Title:       "Punishment Information",
			Description: fmt.Sprintf("Punishment details for user %s", user.Username),
			Color:       punishmentEmbedColor,
			Fields:      punishmentEmbedFields,
			Footer: &discordgo.MessageEmbedFooter{
				Text: "haze.bio punishment system",
			},
			Timestamp: time.Now().Format(time.RFC3339),
		}
		s.ChannelMessageSendEmbed(m.ChannelID, punishmentEmbed)
	}
}

func (c *Commands) handleLeaderboard(s *discordgo.Session, m *discordgo.MessageCreate) {
	topUsers, err := c.services.User.GetTopUsersByViews()
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to fetch leaderboard: %v", err))
		return
	}

	rankEmojis := []string{
		":one:", ":two:", ":three:", ":four:", ":five:",
		":six:", ":seven:", ":eight:", ":nine:", ":keycap_ten:",
	}

	var description strings.Builder
	for i, topUser := range topUsers {
		rank := i + 1
		rankEmoji := ""
		if i < len(rankEmojis) {
			rankEmoji = rankEmojis[i]
		} else {
			rankEmoji = fmt.Sprintf("%d.", rank)
		}

		description.WriteString(fmt.Sprintf("%s [/%s](https://haze.bio/%s) - `%d Views`\n", rankEmoji, topUser.Username, topUser.Username, topUser.Views))
	}

	embed := &discordgo.MessageEmbed{
		Title:       "Views Leaderboard",
		Description: description.String(),
		Color:       0x000000,
		Footer: &discordgo.MessageEmbedFooter{
			Text: "Top 10 with the most views",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleProfile(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if len(args) < 2 {
		s.ChannelMessageSend(m.ChannelID, "Enter a username. Example: `?profile username`")
		return
	}

	username := args[1]

	user, err := c.services.User.GetUserByUsernamePublic(username)
	if err != nil {
		s.ChannelMessageSend(m.ChannelID, "Profile not found.")
		return
	}

	profile, _ := c.services.Profile.GetUserProfileByUID(user.UID)
	badges, _ := c.services.Badge.GetUserBadges(user.UID)

	punishment, _ := c.services.Punish.GetActivePunishmentForUser(user.UID)
	if punishment != nil && punishment.Active && punishment.PunishmentType != "partial" {
		s.ChannelMessageSend(m.ChannelID, "This user is restricted and cannot be viewed.")
		return
	}

	embed := c.createProfileEmbed(user, profile, badges)
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleUIDProfile(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if len(args) < 2 {
		s.ChannelMessageSend(m.ChannelID, "Enter a user ID. Example: `?uidprofile 123`")
		return
	}

	userID, err := strconv.Atoi(args[1])
	if err != nil {
		s.ChannelMessageSend(m.ChannelID, "Invalid user ID. Please enter a valid number.")
		return
	}

	user, err := c.services.User.GetUserByUID(uint(userID))
	if err != nil {
		s.ChannelMessageSend(m.ChannelID, "Profile not found.")
		return
	}

	profile, _ := c.services.Profile.GetUserProfileByUID(user.UID)
	badges, _ := c.services.Badge.GetUserBadges(user.UID)

	punishment, _ := c.services.Punish.GetActivePunishmentForUser(user.UID)
	if punishment != nil && punishment.Active {
		s.ChannelMessageSend(m.ChannelID, "This user is restricted and cannot be viewed.")
		return
	}

	embed := c.createProfileEmbed(user, profile, badges)
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleMe(s *discordgo.Session, m *discordgo.MessageCreate) {
	user, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil {
		c.sendErrorEmbed(s, m, "Your Discord account is not linked to a haze.bio profile.")
		return
	}

	profile, err := c.services.Profile.GetUserProfileByUID(user.UID)
	if err != nil {
		c.sendErrorEmbed(s, m, "Failed to fetch your profile information.")
		return
	}

	badges, _ := c.services.Badge.GetUserBadges(user.UID)

	punishment, _ := c.services.Punish.GetActivePunishmentForUser(user.UID)
	if punishment != nil && punishment.Active {
		c.sendErrorEmbed(s, m, "Your account is currently restricted.")
		return
	}

	embed := c.createProfileEmbed(user, profile, badges)
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) createProfileEmbed(user *models.User, profile *models.UserProfile, badges []*models.UserBadge) *discordgo.MessageEmbed {
	badgeNames := make([]string, 0, len(badges))
	for _, badge := range badges {
		badgeName := fmt.Sprintf("``%s``", badge.Badge.Name)
		badgeNames = append(badgeNames, badgeName)
	}

	avatarURL := profile.AvatarURL
	if avatarURL == "" {
		avatarURL = "not set"
	} else {
		avatarURL = fmt.Sprintf("[Avatar](%s)", profile.AvatarURL)
	}

	backgroundURL := profile.BackgroundURL
	if backgroundURL == "" {
		backgroundURL = "not set"
	} else {
		backgroundURL = fmt.Sprintf("[Background](%s)", profile.BackgroundURL)
	}

	audioURL := profile.AudioURL
	if audioURL == "" {
		audioURL = "not set"
	} else {
		audioURL = fmt.Sprintf("[Audio](%s)", profile.AudioURL)
	}

	badgeString := strings.Join(badgeNames, " ")
	if badgeString == "" {
		badgeString = "no badges"
	}

	profileURL := fmt.Sprintf("https://haze.bio/%s", user.Username)

	return &discordgo.MessageEmbed{
		URL:         profileURL,
		Title:       fmt.Sprintf("%s's Profile | UID: %d", user.Username, user.UID),
		Description: utils.StripHTML(profile.Description),
		Color:       c.parseColor(profile.AccentColor),
		Thumbnail: &discordgo.MessageEmbedThumbnail{
			URL: profile.AvatarURL,
		},
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:   "Joined At",
				Value:  fmt.Sprintf("<t:%d:R>", user.CreatedAt.Unix()),
				Inline: false,
			},
			{
				Name:   "Badges",
				Value:  badgeString,
				Inline: false,
			},
			{
				Name:   "Avatar",
				Value:  avatarURL,
				Inline: false,
			},
			{
				Name:   "Background",
				Value:  backgroundURL,
				Inline: false,
			},
			{
				Name:   "Audio",
				Value:  audioURL,
				Inline: false,
			},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: fmt.Sprintf("haze.bio | %d Views", profile.Views),
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
}

func (c *Commands) handleStats(s *discordgo.Session, m *discordgo.MessageCreate) {
	stats, err := c.services.User.GetStats()
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to fetch stats: %v", err))
		return
	}

	embed := &discordgo.MessageEmbed{
		Title:       "haze.bio Statistics",
		Description: "Current statistics for haze.bio",
		Color:       0x000000,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:   "Users",
				Value:  fmt.Sprintf("`%d`", stats.Users),
				Inline: true,
			},
			{
				Name:   "Premium Users",
				Value:  fmt.Sprintf("`%d`", stats.Premium),
				Inline: true,
			},
			{
				Name:   "Total Views",
				Value:  fmt.Sprintf("`%d`", stats.TotalViews),
				Inline: true,
			},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio statistics",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleStatus(s *discordgo.Session, m *discordgo.MessageCreate) {
	activeStatus, err := c.services.Status.GetActiveStatus()
	upcomingStatuses, _ := c.services.Status.GetUpcomingStatus()

	var embedColor int
	var statusEmoji string
	var statusTitle string

	if err != nil {
		embedColor = 0x22C55E
		statusEmoji = "✅"
		statusTitle = "Operational"
	} else {
		embedColor = 0xEAB308
		statusEmoji = "⚠️"
		statusTitle = "Maintenance"
	}

	embed := &discordgo.MessageEmbed{
		Title: "System Status",
		Description: fmt.Sprintf("%s **%s**\n%s",
			statusEmoji,
			statusTitle,
			func() string {
				if activeStatus != nil {
					return activeStatus.Reason
				}
				return "All systems are currently operational"
			}()),
		Color:  embedColor,
		Fields: []*discordgo.MessageEmbedField{},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio status system",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	if activeStatus != nil {
		startTime := activeStatus.StartDate
		endTime := activeStatus.EndDate
		now := time.Now()

		remainingDuration := endTime.Sub(now)
		hours := int(remainingDuration.Hours())
		minutes := int(remainingDuration.Minutes()) % 60

		totalDuration := endTime.Sub(startTime)
		elapsedDuration := now.Sub(startTime)
		var progressPercentage float64
		if totalDuration.Seconds() > 0 {
			progressPercentage = (elapsedDuration.Seconds() / totalDuration.Seconds()) * 100
		}
		progressPercentage = math.Min(100, math.Max(0, progressPercentage))

		const progressBarLength = 10
		progressBlocks := int((progressPercentage / 100) * progressBarLength)
		progressBar := "["
		for i := 0; i < progressBarLength; i++ {
			if i < progressBlocks {
				progressBar += "■"
			} else {
				progressBar += "□"
			}
		}
		progressBar += "]"

		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name: "Timeline",
			Value: fmt.Sprintf("**Started:** <t:%d:R>\n**Ends:** <t:%d:R>",
				startTime.Unix(),
				endTime.Unix()),
			Inline: true,
		})

		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name: "Progress",
			Value: fmt.Sprintf("%s %.0f%%\n**Remaining:** %dh %dm",
				progressBar,
				progressPercentage,
				hours, minutes),
			Inline: true,
		})
	}

	if len(upcomingStatuses) > 0 {
		var upcomingDesc strings.Builder

		for i, status := range upcomingStatuses {
			if i > 0 {
				upcomingDesc.WriteString("\n\n")
			}

			duration := status.EndDate.Sub(status.StartDate)
			hours := int(duration.Hours())
			minutes := int(duration.Minutes()) % 60

			upcomingDesc.WriteString(fmt.Sprintf("**%s**\n", status.Reason))
			upcomingDesc.WriteString(fmt.Sprintf("Duration: %dh %dm\n", hours, minutes))
			upcomingDesc.WriteString(fmt.Sprintf("Start: <t:%d:F>\n", status.StartDate.Unix()))
			upcomingDesc.WriteString(fmt.Sprintf("End: <t:%d:F>", status.EndDate.Unix()))
		}

		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name:   "Upcoming Maintenance",
			Value:  upcomingDesc.String(),
			Inline: false,
		})
	}

	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleCreateStatus(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if m.Author.Username != "ret2862" {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to create status updates")
		return
	}

	cmdContent := strings.TrimPrefix(m.Content, config.DiscordPrefix+"createstatus ")

	re := regexp.MustCompile(`"([^"]+)"`)
	matches := re.FindAllStringSubmatch(cmdContent, 2)

	if len(matches) < 2 {
		c.sendInvalidUsageEmbed(s, m,
			"Please provide start and end dates in quotes",
			"`?createstatus \"YYYY-MM-DD HH:MM\" \"YYYY-MM-DD HH:MM\" <reason>`",
			"`?createstatus \"2025-03-20 21:00\" \"2025-03-20 22:00\" Database maintenance`")
		return
	}

	startDate := matches[0][1]
	endDate := matches[1][1]

	reasonIndex := strings.Index(cmdContent, matches[1][0]) + len(matches[1][0])
	reason := strings.TrimSpace(cmdContent[reasonIndex:])

	statusType := models.StatusTypeMaintenance

	id, err := c.services.Status.CreateStatus(statusType, reason, startDate, endDate)
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to create status: %v", err))
		return
	}

	embed := &discordgo.MessageEmbed{
		Title:       "Status Created",
		Description: "New status has been created successfully",
		Color:       0x000000,
		Fields: []*discordgo.MessageEmbedField{
			{Name: "ID", Value: fmt.Sprintf("%d", id), Inline: true},
			{Name: "Type", Value: statusType, Inline: true},
			{Name: "Reason", Value: reason},
			{Name: "Start Date", Value: startDate, Inline: true},
			{Name: "End Date", Value: endDate, Inline: true},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio status system",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleDeleteStatus(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if m.Author.Username != "ret2862" {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to delete status updates")
		return
	}

	if len(args) < 2 {
		c.sendInvalidUsageEmbed(s, m,
			"Please provide a status ID",
			"`?deletestatus <id>`",
			"`?deletestatus 1`")
		return
	}

	statusID, err := strconv.ParseUint(args[1], 10, 32)
	if err != nil {
		c.sendInvalidInputEmbed(s, m, "Invalid status ID")
		return
	}

	err = c.services.Status.DeleteStatus(uint(statusID))
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to delete status: %v", err))
		return
	}

	embed := &discordgo.MessageEmbed{
		Title:       "Status Deleted",
		Description: fmt.Sprintf("Status with ID %d has been deleted", statusID),
		Color:       0x000000,
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio status system",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

var generateCooldowns = make(map[string]time.Time)

func (c *Commands) handleGenerate(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	cooldownDuration := 1 * time.Minute
	lastRequest, hasCooldown := generateCooldowns[m.Author.ID]
	if hasCooldown {
		timeRemaining := time.Until(lastRequest.Add(cooldownDuration))
		if timeRemaining > 0 {
			seconds := int(timeRemaining.Seconds()) % 60
			c.sendErrorEmbed(s, m, fmt.Sprintf("Please wait %d seconds.", seconds))
			return
		}
	}

	if len(args) < 2 {
		c.sendInvalidUsageEmbed(s, m,
			"Please provide a username",
			"`?generate <username>`",
			"`?generate test123`")
		return
	}

	username := args[1]
	user, err := c.services.User.GetUserByUsernamePublic(username)

	if err != nil {
		c.sendErrorEmbed(s, m, "User not found. Check the username and try again.")
		return
	}

	profile, err := c.services.Profile.GetUserProfileByUID(user.UID)
	if err != nil {
		c.sendErrorEmbed(s, m, "Failed to fetch user profile information.")
		return
	}

	punishment, _ := c.services.Punish.GetActivePunishmentForUser(user.UID)
	if punishment != nil && punishment.Active {
		c.sendErrorEmbed(s, m, "This user is restricted and cannot be viewed.")
		return
	}

	statusMsg, err := s.ChannelMessageSend(m.ChannelID, "⏳ Starting generation for **"+user.Username+"**...")
	if err != nil {
		c.sendErrorEmbed(s, m, "Failed to send status message.")
		return
	}

	s.ChannelMessageEdit(m.ChannelID, statusMsg.ID, "⏳ Generating image for **"+user.Username+"**... Please wait.")

	imageService := c.services.Image
	imagePath, err := imageService.GenerateUserCard(user, profile)
	if err != nil {
		s.ChannelMessageEdit(m.ChannelID, statusMsg.ID, "❌ Failed to generate image: "+err.Error())
		return
	}

	file, err := os.Open(imagePath)
	if err != nil {
		s.ChannelMessageEdit(m.ChannelID, statusMsg.ID, "❌ Failed to access generated image.")
		return
	}
	defer file.Close()
	defer os.Remove(imagePath)

	statusMessage := fmt.Sprintf("🖼️ Generated profile card for **%s**:", user.Username)
	_, err = s.ChannelMessageEditComplex(&discordgo.MessageEdit{
		Channel: m.ChannelID,
		ID:      statusMsg.ID,
		Content: &statusMessage,
		Files: []*discordgo.File{
			{
				Name:   fmt.Sprintf("%s_card.png", user.Username),
				Reader: file,
			},
		},
	})

	if err != nil {
		s.ChannelMessageEdit(m.ChannelID, statusMsg.ID, "❌ Failed to send generated image.")
		return
	}

	generateCooldowns[m.Author.ID] = time.Now()
}

func (c *Commands) handleExperiments(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	adminUser, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil || (adminUser.StaffLevel < StaffLevelAdmin && m.Author.Username != "ret2862") {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to manage experiments")
		return
	}

	embed := &discordgo.MessageEmbed{
		Title:       "Experimental Features Management",
		Description: "Commands for managing experimental features",
		Color:       0x9B59B6, // Purple
		Fields: []*discordgo.MessageEmbedField{
			{
				Name: "Available Commands",
				Value: "• `?createexperiment` - Create a new experiment\n" +
					"• `?deleteexperiment` - Delete an experiment\n" +
					"• `?adduserstoexperiment` - Add additional users to an experiment\n" +
					"• `?experimentstatus` - View status of all experiments\n" +
					"• `?checkuserexperiments` - Check which experiments a user is enrolled in\n" +
					"• `?checkuserexperiments --all` - Show all users in a specific experiment",
			},
			{
				Name: "Creating an Experiment",
				Value: "Format: `?createexperiment \"Name\" feature_key \"Description\" start_date end_date user_count`\n" +
					"Example: `?createexperiment \"Custom Domains\" custom_domains \"Use custom domains on profiles\" 2025-05-01 2025-06-01 50`",
			},
			{
				Name: "Checking Experiment Users",
				Value: "• Check one user: `?checkuserexperiments username`\n" +
					"• Check all users in experiment: `?checkuserexperiments --all feature_key`",
			},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio experimental features",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleCreateExperiment(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	adminUser, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil || (adminUser.StaffLevel < StaffLevelAdmin && m.Author.Username != "ret2862") {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to create experiments")
		return
	}

	if len(args) < 7 {
		c.sendInvalidUsageEmbed(s, m, "Please provide all required parameters",
			"`?createexperiment \"Name\" feature_key \"Description\" start_date end_date user_count`",
			"`?createexperiment \"Custom Domains\" custom_domains \"Use custom domains\" 2025-05-01 2025-06-01 50`")
		return
	}

	cmdContent := strings.Join(args[1:], " ")
	re := regexp.MustCompile(`"([^"]+)"`)
	matches := re.FindAllStringSubmatch(cmdContent, 2)

	if len(matches) < 2 {
		c.sendInvalidUsageEmbed(s, m, "Name and description must be in quotes",
			"`?createexperiment \"Name\" feature_key \"Description\" start_date end_date user_count`",
			"`?createexperiment \"Custom Domains\" custom_domains \"Use custom domains\" 2025-05-01 2025-06-01 50`")
		return
	}

	name := matches[0][1]
	description := matches[1][1]

	nameEnd := strings.Index(cmdContent, "\"") + len(name) + 2 // +2 for the quotes
	descStart := strings.Index(cmdContent[nameEnd:], "\"") + nameEnd
	descEnd := strings.Index(cmdContent[descStart+1:], "\"") + descStart + 1

	featureKey := strings.TrimSpace(cmdContent[nameEnd:descStart])

	paramsStr := strings.TrimSpace(cmdContent[descEnd+1:])
	params := strings.Fields(paramsStr)

	if len(params) < 3 {
		c.sendInvalidUsageEmbed(s, m, "Missing parameters after description",
			"`?createexperiment \"Name\" feature_key \"Description\" start_date end_date user_count`",
			"`?createexperiment \"Custom Domains\" custom_domains \"Use custom domains\" 2025-05-01 2025-06-01 50`")
		return
	}

	startDateStr := params[0]
	endDateStr := params[1]
	userCountStr := params[2]

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.sendInvalidInputEmbed(s, m, "Invalid start date format. Use YYYY-MM-DD")
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.sendInvalidInputEmbed(s, m, "Invalid end date format. Use YYYY-MM-DD")
		return
	}

	userCount, err := strconv.Atoi(userCountStr)
	if err != nil || userCount < 1 {
		c.sendInvalidInputEmbed(s, m, "Invalid user count. Must be a positive number")
		return
	}

	err = c.services.Experimental.CreateExperiment(name, featureKey, description, startDate, endDate, userCount)
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to create experiment: %v", err))
		return
	}

	embed := &discordgo.MessageEmbed{
		Title:       "Experiment Created",
		Description: "New experimental feature has been created successfully",
		Color:       0x00ff00,
		Fields: []*discordgo.MessageEmbedField{
			{Name: "Name", Value: name, Inline: true},
			{Name: "Feature Key", Value: featureKey, Inline: true},
			{Name: "Description", Value: description},
			{Name: "Start Date", Value: startDate.Format("2006-01-02"), Inline: true},
			{Name: "End Date", Value: endDate.Format("2006-01-02"), Inline: true},
			{Name: "Initial User Count", Value: fmt.Sprintf("%d", userCount), Inline: true},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio experimental system",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleDeleteExperiment(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	adminUser, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil || (adminUser.StaffLevel < StaffLevelAdmin && m.Author.Username != "ret2862") {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to delete experiments")
		return
	}

	if len(args) < 2 {
		c.sendInvalidUsageEmbed(s, m, "Please provide a feature key to delete",
			"`?deleteexperiment <feature_key>`",
			"`?deleteexperiment custom_domains`")
		return
	}

	featureKey := args[1]

	err = c.services.Experimental.DeleteExperiment(featureKey)
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to delete experiment: %v", err))
		return
	}

	embed := &discordgo.MessageEmbed{
		Title:       "Experiment Deleted",
		Description: fmt.Sprintf("The experiment '%s' has been deleted successfully", featureKey),
		Color:       0x00ff00,
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio experimental system",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleExperimentStatus(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	adminUser, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil || (adminUser.StaffLevel < StaffLevelAdmin && m.Author.Username != "ret2862") {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to view experiment status")
		return
	}

	experimentsData, err := c.services.Experimental.Client.HGetAll("experiments:active").Result()
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to get experiments: %v", err))
		return
	}

	if len(experimentsData) == 0 {
		c.sendErrorEmbed(s, m, "No experiments found")
		return
	}

	fields := []*discordgo.MessageEmbedField{}
	now := time.Now()

	for featureKey, expData := range experimentsData {
		var experiment models.Experiment
		if err := json.Unmarshal([]byte(expData), &experiment); err != nil {
			log.Printf("Warning: Failed to unmarshal experiment data for %s: %v", featureKey, err)
			continue
		}

		userKey := fmt.Sprintf("experiment:users:%s", featureKey)
		userCount, err := c.services.Experimental.Client.SCard(userKey).Result()
		if err != nil {
			userCount = 0
		}

		var status string
		var emoji string

		if now.Before(experiment.StartDate) {
			status = "Not Started"
			emoji = "⏳"
		} else if now.After(experiment.EndDate) {
			status = "Completed"
			emoji = "✅"
		} else {
			totalDuration := experiment.EndDate.Sub(experiment.StartDate)
			elapsed := now.Sub(experiment.StartDate)
			progress := (elapsed.Hours() / totalDuration.Hours()) * 100
			status = fmt.Sprintf("In Progress (%.1f%%)", progress)
			emoji = "🔄"
		}

		fields = append(fields, &discordgo.MessageEmbedField{
			Name: fmt.Sprintf("%s %s (%s)", emoji, experiment.Name, featureKey),
			Value: fmt.Sprintf("**Description**: %s\n**Status**: %s\n**Timeline**: %s to %s\n**Users**: %d\n**Initial Target**: %d",
				experiment.Description,
				status,
				experiment.StartDate.Format("2006-01-02"),
				experiment.EndDate.Format("2006-01-02"),
				userCount,
				experiment.InitialUserCount),
			Inline: false,
		})
	}

	embed := &discordgo.MessageEmbed{
		Title:       "Experimental Features Status",
		Description: fmt.Sprintf("Showing status for %d experimental features", len(fields)),
		Color:       0x9B59B6, // Purple
		Fields:      fields,
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio experimental system",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleCheckUserExperiments(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	adminUser, err := c.services.Discord.GetUserByDiscordID(m.Author.ID)
	if err != nil || (adminUser.StaffLevel < StaffLevelAdmin && m.Author.Username != "ret2862") {
		c.sendUnauthorizedEmbed(s, m, "You are not authorized to check user experiments")
		return
	}

	if len(args) >= 2 && args[1] == "--all" {
		if len(args) < 3 {
			c.sendInvalidUsageEmbed(s, m, "Please provide a feature key when using --all",
				"`?checkuserexperiments --all <feature_key>`",
				"`?checkuserexperiments --all custom_domains`")
			return
		}

		featureKey := args[2]

		exists, err := c.services.Experimental.ExperimentExists(featureKey)
		if err != nil {
			c.sendErrorEmbed(s, m, fmt.Sprintf("Error checking experiment: %v", err))
			return
		}

		if !exists {
			c.sendErrorEmbed(s, m, fmt.Sprintf("Experiment '%s' not found", featureKey))
			return
		}

		userKey := fmt.Sprintf("%s%s", services.ExperimentUserPrefix, featureKey)
		userIDs, err := c.services.Experimental.Client.SMembers(userKey).Result()
		if err != nil {
			c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to get users for experiment: %v", err))
			return
		}

		if len(userIDs) == 0 {
			c.sendErrorEmbed(s, m, fmt.Sprintf("No users are enrolled in experiment '%s'", featureKey))
			return
		}

		var uintUserIDs []uint
		for _, userIDStr := range userIDs {
			var userID uint
			if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err == nil {
				uintUserIDs = append(uintUserIDs, userID)
			}
		}

		var users []models.User
		limit := 25
		if len(uintUserIDs) < limit {
			limit = len(uintUserIDs)
		}

		if err := c.services.User.DB.Where("uid IN ?", uintUserIDs[:limit]).Find(&users).Error; err != nil {
			c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to get user details: %v", err))
			return
		}

		var userListBuilder strings.Builder
		for i, user := range users {
			userListBuilder.WriteString(fmt.Sprintf("%d. **%s** (UID: %d)", i+1, user.Username, user.UID))

			if user.StaffLevel == 4 {
				userListBuilder.WriteString(" 👑")
			}
			userListBuilder.WriteString("\n")
		}

		if len(uintUserIDs) > limit {
			userListBuilder.WriteString(fmt.Sprintf("\n...and %d more users", len(uintUserIDs)-limit))
		}

		var experimentData string
		experimentData, err = c.services.Experimental.Client.HGet(services.ExperimentListKey, featureKey).Result()
		if err != nil {
			c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to get experiment details: %v", err))
			return
		}

		var experiment models.Experiment
		if err := json.Unmarshal([]byte(experimentData), &experiment); err != nil {
			c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to parse experiment data: %v", err))
			return
		}

		embed := &discordgo.MessageEmbed{
			Title: fmt.Sprintf("Users in Experiment: %s", experiment.Name),
			Description: fmt.Sprintf("Feature Key: `%s`\nShowing %d of %d users",
				featureKey, limit, len(uintUserIDs)),
			Color: 0x9B59B6, // Purple
			Fields: []*discordgo.MessageEmbedField{
				{
					Name:   "Users",
					Value:  userListBuilder.String(),
					Inline: false,
				},
			},
			Footer: &discordgo.MessageEmbedFooter{
				Text: "haze.bio experimental system",
			},
			Timestamp: time.Now().Format(time.RFC3339),
		}
		s.ChannelMessageSendEmbed(m.ChannelID, embed)
		return
	}

	if len(args) < 2 {
		c.sendInvalidUsageEmbed(s, m, "Please provide a username or use --all flag",
			"`?checkuserexperiments <username>` or `?checkuserexperiments --all <feature_key>`",
			"`?checkuserexperiments example` or `?checkuserexperiments --all custom_domains`")
		return
	}

	username := args[1]

	user, err := c.services.User.GetUserByUsername(username)
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("User not found: %s", username))
		return
	}

	features, err := c.services.Experimental.GetUserExperimentalFeatures(user.UID)
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to get user's experimental features: %v", err))
		return
	}

	featuresText := "None"
	if len(features) > 0 {
		featuresText = "• " + strings.Join(features, "\n• ")
	}

	embed := &discordgo.MessageEmbed{
		Title:       "User Experimental Features",
		Description: fmt.Sprintf("Showing experimental features for **%s** (UID: %d)", user.Username, user.UID),
		Color:       0x9B59B6, // Purple
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:   "Active Features",
				Value:  featuresText,
				Inline: false,
			},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio experimental system",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) handleTimeDiff(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if len(args) < 2 {
		c.sendInvalidUsageEmbed(s, m, "Please provide at least one message ID",
			"`?timediff <message_id1> [message_id2]`",
			"`?timediff 1234567890123456789`\n`?timediff 1234567890123456789 9876543210987654321`")
		return
	}

	var messageID1, messageID2 string

	if m.ReferencedMessage != nil {
		if len(args) == 2 {
			messageID1 = args[1]
			messageID2 = m.ReferencedMessage.ID
		} else if len(args) >= 3 {
			messageID1 = args[1]
			messageID2 = args[2]
		}
	} else {
		if len(args) < 3 {
			c.sendInvalidUsageEmbed(s, m, "Please provide two message IDs",
				"`?timediff <message_id1> <message_id2>`",
				"`?timediff 1234567890123456789 9876543210987654321`")
			return
		}
		messageID1 = args[1]
		messageID2 = args[2]
	}

	message1, err := s.ChannelMessage(m.ChannelID, messageID1)
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to fetch first message: %v", err))
		return
	}

	message2, err := s.ChannelMessage(m.ChannelID, messageID2)
	if err != nil {
		c.sendErrorEmbed(s, m, fmt.Sprintf("Failed to fetch second message: %v", err))
		return
	}

	timestamp1 := message1.Timestamp
	timestamp2 := message2.Timestamp

	var timeDiff time.Duration
	var olderMessage, newerMessage *discordgo.Message
	var olderTimestamp, newerTimestamp time.Time

	if timestamp1.Before(timestamp2) {
		timeDiff = timestamp2.Sub(timestamp1)
		olderMessage = message1
		newerMessage = message2
		olderTimestamp = timestamp1
		newerTimestamp = timestamp2
	} else {
		timeDiff = timestamp1.Sub(timestamp2)
		olderMessage = message2
		newerMessage = message1
		olderTimestamp = timestamp2
		newerTimestamp = timestamp1
	}

	formattedTime := formatTimeDiff(timeDiff)

	embed := &discordgo.MessageEmbed{
		Title:       "Time Difference Between Messages",
		Description: fmt.Sprintf("**Time difference**: %s", formattedTime),
		Color:       0x000000,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name: "Older Message",
				Value: fmt.Sprintf("[Jump to message](https://discord.com/channels/%s/%s/%s)\n**Date**: <t:%d:F>\n**Sent by**: %s",
					m.GuildID, m.ChannelID, olderMessage.ID, olderTimestamp.Unix(), olderMessage.Author.Username),
				Inline: true,
			},
			{
				Name: "Newer Message",
				Value: fmt.Sprintf("[Jump to message](https://discord.com/channels/%s/%s/%s)\n**Date**: <t:%d:F>\n**Sent by**: %s",
					m.GuildID, m.ChannelID, newerMessage.ID, newerTimestamp.Unix(), newerMessage.Author.Username),
				Inline: true,
			},
		},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func formatTimeDiff(diff time.Duration) string {
	seconds := int(diff.Seconds())
	minutes := seconds / 60
	hours := minutes / 60
	days := hours / 24

	seconds %= 60
	minutes %= 60
	hours %= 24

	var parts []string

	if days > 0 {
		if days == 1 {
			parts = append(parts, "1 day")
		} else {
			parts = append(parts, fmt.Sprintf("%d days", days))
		}
	}

	if hours > 0 {
		if hours == 1 {
			parts = append(parts, "1 hour")
		} else {
			parts = append(parts, fmt.Sprintf("%d hours", hours))
		}
	}

	if minutes > 0 {
		if minutes == 1 {
			parts = append(parts, "1 minute")
		} else {
			parts = append(parts, fmt.Sprintf("%d minutes", minutes))
		}
	}

	if seconds > 0 || len(parts) == 0 {
		if seconds == 1 {
			parts = append(parts, "1 second")
		} else {
			parts = append(parts, fmt.Sprintf("%d seconds", seconds))
		}
	}

	return strings.Join(parts, ", ")
}

func (c *Commands) parseColor(colorStr string) int {
	color, err := strconv.ParseInt(colorStr, 16, 32)
	if err != nil {
		return 0x000000
	}
	return int(color)
}

func (c *Commands) sendErrorEmbed(s *discordgo.Session, m *discordgo.MessageCreate, description string) {
	embed := &discordgo.MessageEmbed{
		Title:       "Error",
		Description: description,
		Color:       0xff0000,
		Timestamp:   time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) sendUnauthorizedEmbed(s *discordgo.Session, m *discordgo.MessageCreate, description string) {
	embed := &discordgo.MessageEmbed{
		Title:       "Unauthorized",
		Description: description,
		Color:       0xff0000,
		Timestamp:   time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) sendInvalidUsageEmbed(s *discordgo.Session, m *discordgo.MessageCreate, description, usage, example string) {
	embed := &discordgo.MessageEmbed{
		Title:       "Invalid Usage",
		Description: description,
		Color:       0xff0000,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:  "Usage",
				Value: usage,
			},
			{
				Name:  "Example",
				Value: example,
			},
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}

func (c *Commands) sendInvalidInputEmbed(s *discordgo.Session, m *discordgo.MessageCreate, description string) {
	embed := &discordgo.MessageEmbed{
		Title:       "Invalid Input",
		Description: description,
		Color:       0xff0000,
		Timestamp:   time.Now().Format(time.RFC3339),
	}
	s.ChannelMessageSendEmbed(m.ChannelID, embed)
}
