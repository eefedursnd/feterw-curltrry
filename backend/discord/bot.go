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
	experimentalService := services.NewExperimentalService(db.DB, redisClient)

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
		Experimental: experimentalService,
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

	channelID := "1363552022049067098"

	ordinal := getOrdinalSuffix(data.UID)

	profileURL := fmt.Sprintf("https://haze.bio/%s", data.Username)
	embed := &discordgo.MessageEmbed{
		URL:         profileURL,
		Title:       "New user registered!",
		Description: fmt.Sprintf("**%s** just registered and is our **%d%s** user! 🎉", data.Username, data.UID, ordinal),
		Color:       0x000000,
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio",
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
	channelID := "1363970290312544371"

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

	profileURL := fmt.Sprintf("https://haze.bio/%s", altData.Username)
	embed := &discordgo.MessageEmbed{
		URL:         profileURL,
		Title:       title,
		Description: description,
		Color:       0xFFA500,
		Fields:      fields,
		Footer: &discordgo.MessageEmbedFooter{
			Text: "haze.bio security",
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
}
