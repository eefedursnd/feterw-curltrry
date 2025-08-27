package services

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/utils"
	"gorm.io/gorm"
)

type ProfileService struct {
	DB             *gorm.DB
	Client         *redis.Client
	UserService    *UserService
	DiscordService *DiscordService
	BotSession     *discordgo.Session
}

func NewProfileService(db *gorm.DB, client *redis.Client, botSession *discordgo.Session, discordService *DiscordService) *ProfileService {
	return &ProfileService{
		DB:             db,
		Client:         client,
		UserService:    &UserService{DB: db, Client: client},
		DiscordService: discordService,
		BotSession:     botSession,
	}
}

/* Create a new user profile */
func (ps *ProfileService) CreateUserProfile(uid uint) error {
	profileModel := &models.UserProfile{
		UID: uid,
	}

	if err := ps.DB.Create(&profileModel).Error; err != nil {
		log.Println("Error creating user profile:", err)
		return err
	}

	return nil
}

/* Revert premium features to default values */
func (ps *ProfileService) RevertPremiumFeatures(uid uint) error {
	profile, err := ps.GetUserProfileByUID(uid)
	if err != nil {
		return fmt.Errorf("failed to get user profile: %w", err)
	}

	log.Printf("Reverting premium features for user %d", uid)

	premiumFeatures := models.NewPremiumFeatures()

	// Track which features were changed for logging
	var revertedFeatures []string

	// Check and revert text font if it's premium
	if profile.TextFont != "" && premiumFeatures.IsFontPremium(profile.TextFont) {
		revertedFeatures = append(revertedFeatures, "Font: "+profile.TextFont)
		profile.TextFont = ""
	}

	// Check and revert username effects if it's premium
	if profile.UsernameEffects != "" && premiumFeatures.IsUsernameEffectPremium(profile.UsernameEffects) {
		revertedFeatures = append(revertedFeatures, "Username Effect: "+profile.UsernameEffects)
		profile.UsernameEffects = ""
	}

	// Check and revert cursor effects if it's premium
	if profile.CursorEffects != "" && premiumFeatures.IsCursorEffectPremium(profile.CursorEffects) {
		revertedFeatures = append(revertedFeatures, "Cursor Effect: "+profile.CursorEffects)
		profile.CursorEffects = ""
	}

	// Check and revert template if it's premium
	if profile.Template != "default" && premiumFeatures.IsTemplatePremium(profile.Template) {
		revertedFeatures = append(revertedFeatures, "Template: "+profile.Template)
		profile.Template = "default"
	}

	// Check and revert layout max width if it's premium
	if profile.LayoutMaxWidth != 776 && premiumFeatures.IsLayoutMaxWidthPremium() {
		revertedFeatures = append(revertedFeatures, "Custom Layout Width")
		profile.LayoutMaxWidth = 776
	}

	// Check and revert HTML in description if it's premium
	if utils.ContainsHTML(profile.Description) && premiumFeatures.IsAllowHTMLDescriptionPremium() {
		revertedFeatures = append(revertedFeatures, "HTML in Description")
		profile.Description = utils.StripHTML(profile.Description)
	}

	// Check and revert Discord avatar if it's premium
	if profile.ParallaxEffect && premiumFeatures.IsParallaxEffectPremium() {
		revertedFeatures = append(revertedFeatures, "Parallax Effect")
		profile.ParallaxEffect = false
	}

	// Update profile if there were changes
	if len(revertedFeatures) > 0 {
		log.Printf("Reverting premium features for user %d: %v", uid, revertedFeatures)

		err = ps.DB.Model(&models.UserProfile{}).Where("uid = ?", uid).Updates(map[string]interface{}{
			"text_font":        profile.TextFont,
			"username_effects": profile.UsernameEffects,
			"cursor_effects":   profile.CursorEffects,
			"template":         profile.Template,
			"layout_max_width": profile.LayoutMaxWidth,
			"description":      profile.Description,
		}).Error

		if err != nil {
			return fmt.Errorf("failed to update profile with reverted premium features: %w", err)
		}
	} else {
		log.Printf("No premium features to revert for user %d", uid)
	}

	return nil
}

func (ps *ProfileService) GetPublicProfile(identifier string) (*models.User, error) {
	var user models.User

	err := ps.DB.
		Omit("email", "password", "mfa_secret", "login_with_discord").
		Where("LOWER(username) = LOWER(?) OR LOWER(alias) = LOWER(?)", identifier, identifier).
		Preload("Profile").
		Preload("Socials").
		Preload("Widgets").
		Preload("Punishments", func(db *gorm.DB) *gorm.DB {
			return db.Where("active = ?", true).Omit("staff_id")
		}).
		Preload("Subscription", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, user_id, status")
		}).
		Preload("Badges.Badge").
		First(&user).Error

	if err != nil {
		return nil, err
	}

	if !user.HasActivePunishment() {
		user.Punishments = nil
	}

	user.HasPremium = user.HasActivePremiumSubscription()

	return &user, nil
}

func (ps *ProfileService) GetPublicProfileByUID(uid uint) (*models.User, error) {
	var user models.User

	err := ps.DB.
		Omit("email", "password", "mfa_secret", "login_with_discord").
		Where("uid = ?", uid).
		Preload("Profile").
		Preload("Socials").
		Preload("Widgets").
		Preload("Punishments", func(db *gorm.DB) *gorm.DB {
			return db.Where("active = ?", true).Omit("staff_id")
		}).
		Preload("Subscription", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, user_id, status")
		}).
		Preload("Badges.Badge").
		First(&user).Error

	if err != nil {
		return nil, err
	}

	if !user.HasActivePunishment() {
		user.Punishments = nil
	}

	user.HasPremium = user.HasActivePremiumSubscription()

	return &user, nil
}

/* Get user profile by UID */
func (ps *ProfileService) GetUserProfileByUID(uid uint) (*models.UserProfile, error) {
	profile := &models.UserProfile{}

	err := ps.DB.Where("uid = ?", uid).First(profile).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("profile not found")
		}
		return nil, err
	}

	return profile, nil
}

/* Update user profile by fields */
func (ps *ProfileService) UpdateUserProfileFields(uid uint, fields map[string]interface{}) (map[string]interface{}, error) {
	user, err := ps.UserService.GetUserByUIDNoCache(uid)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	existingProfile, err := ps.GetUserProfileByUID(uid)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing profile: %w", err)
	}

	premiumFeatures := models.NewPremiumFeatures()

	if usernameEffects, ok := fields["username_effects"].(string); ok && usernameEffects != existingProfile.UsernameEffects {
		if usernameEffects != "" && premiumFeatures.IsUsernameEffectPremium(usernameEffects) && !user.HasActivePremiumSubscription() {
			return nil, errors.New("updating to this username effect requires premium")
		}
	}

	if textFont, ok := fields["text_font"].(string); ok && textFont != existingProfile.TextFont {
		if textFont != "" && premiumFeatures.IsFontPremium(textFont) && !user.HasActivePremiumSubscription() {
			return nil, errors.New("updating to this font requires premium")
		}
	}

	if template, ok := fields["template"].(string); ok && template != existingProfile.Template {
		if template != "" && premiumFeatures.IsTemplatePremium(template) && !user.HasActivePremiumSubscription() {
			return nil, errors.New("updating to this template requires premium")
		}
	}

	if cursorEffects, ok := fields["cursor_effects"].(string); ok && cursorEffects != existingProfile.CursorEffects {
		if cursorEffects != "" && premiumFeatures.IsCursorEffectPremium(cursorEffects) && !user.HasActivePremiumSubscription() {
			return nil, errors.New("updating to this cursor effect requires premium")
		}
	}

	if layoutMaxWidth, ok := fields["layout_max_width"].(uint); ok && layoutMaxWidth != existingProfile.LayoutMaxWidth {
		if layoutMaxWidth != 776 && premiumFeatures.IsLayoutMaxWidthPremium() && !user.HasActivePremiumSubscription() {
			return nil, errors.New("updating layout max width requires premium")
		}
	}

	if parallaxEffect, ok := fields["parallax_effect"].(bool); ok && parallaxEffect != existingProfile.ParallaxEffect {
		if parallaxEffect && premiumFeatures.IsParallaxEffectPremium() && !user.HasActivePremiumSubscription() {
			return nil, errors.New("enabling parallax effect requires premium")
		}
	}

	if description, ok := fields["description"].(string); ok && description != existingProfile.Description {
		if premiumFeatures.IsAllowHTMLDescriptionPremium() && !user.HasActivePremiumSubscription() {
			if utils.ContainsHTML(existingProfile.Description) {
				return nil, errors.New("downgrading description requires premium")
			}
			if utils.ContainsHTML(description) {
				return nil, errors.New("updating to HTML description requires premium")
			}
		}
	}

	if useDiscordAvatar, ok := fields["use_discord_avatar"].(bool); ok && useDiscordAvatar != existingProfile.UseDiscordAvatar {
		if user.DiscordID == "" {
			return nil, errors.New("user has not linked discord account")
		}

		if useDiscordAvatar {
			log.Println("using discord id " + user.DiscordID)
			member, err := ps.BotSession.GuildMember(config.DiscordGuildID, user.DiscordID)
			if err != nil {
				return nil, err
			}

			log.Println(member.User.AvatarURL("512"))
			fields["avatar_url"] = member.User.AvatarURL("512")
		}
	}

	if useDiscordDecoration, ok := fields["use_discord_decoration"].(bool); ok && useDiscordDecoration != existingProfile.UseDiscordDecoration {
		if user.DiscordID == "" {
			return nil, errors.New("user has not linked discord account")
		}

		if useDiscordDecoration {
			log.Println("using discord decoration for " + user.DiscordID)
			decorationURL, err := ps.DiscordService.GetUserDecorationURL(user.UID)
			if err != nil {
				if strings.Contains(err.Error(), "user has no avatar decoration") {
					fields["use_discord_decoration"] = false
					return nil, errors.New("user has no avatar decoration on Discord")
				}
				return nil, err
			}

			fields["decoration_url"] = decorationURL
		}
	}

	delete(fields, "uid")
	delete(fields, "views")

	err = ps.DB.Model(&models.UserProfile{}).Where("uid = ?", uid).Updates(fields).Error
	if err != nil {
		return nil, err
	}

	updatedProfile, err := ps.GetUserProfileByUID(uid)
	if err != nil {
		return nil, err
	}

	updatedFields := make(map[string]interface{})

	for key := range fields {
		updatedValue := utils.GetFieldValueByName(updatedProfile, key)
		originalValue := utils.GetFieldValueByName(existingProfile, key)

		if updatedValue != originalValue {
			updatedFields[key] = updatedValue
		}
	}

	return updatedFields, nil
}

func (ps *ProfileService) AddViewsToProfile(uid uint, views int) error {
	var user models.User
	if err := ps.DB.Where("uid = ?", uid).First(&user).Error; err == nil {
		utils.ProfileViews.WithLabelValues(user.Username, fmt.Sprint(uid)).Add(float64(views))

		currentDate := time.Now().Format("2006-01-02")
		utils.DailyProfileViews.WithLabelValues(user.Username, fmt.Sprint(uid), currentDate).Add(float64(views))
	}

	profile := &models.UserProfile{}
	err := ps.DB.Model(profile).Where("uid = ?", uid).Update("views", gorm.Expr("views + ?", views)).Error
	if err != nil {
		return err
	}
	return nil
}

/* Update user profile */
func (ps *ProfileService) UpdateUserProfile(profile *models.UserProfile) error {
	user, err := ps.UserService.GetUserByUIDNoCache(profile.UID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	premiumFeatures := models.NewPremiumFeatures()

	existingProfile, err := ps.GetUserProfileByUID(profile.UID)
	if err != nil {
		return fmt.Errorf("failed to get existing profile: %w", err)
	}

	if profile.UsernameEffects != existingProfile.UsernameEffects {
		if profile.UsernameEffects != "" && premiumFeatures.IsUsernameEffectPremium(profile.UsernameEffects) && !user.HasActivePremiumSubscription() {
			return errors.New("updating to this username effect requires premium")
		}
	}

	if profile.TextFont != existingProfile.TextFont {
		if profile.TextFont != "" && premiumFeatures.IsFontPremium(profile.TextFont) && !user.HasActivePremiumSubscription() {
			return errors.New("updating to this font requires premium")
		}
	}

	if profile.Template != existingProfile.Template {
		if profile.Template != "" && premiumFeatures.IsTemplatePremium(profile.Template) && !user.HasActivePremiumSubscription() {
			return errors.New("updating to this template requires premium")
		}
	}

	if profile.CursorEffects != existingProfile.CursorEffects {
		if profile.CursorEffects != "" && premiumFeatures.IsCursorEffectPremium(profile.CursorEffects) && !user.HasActivePremiumSubscription() {
			return errors.New("updating to this cursor effect requires premium")
		}
	}

	if profile.LayoutMaxWidth != existingProfile.LayoutMaxWidth {
		if profile.LayoutMaxWidth != 776 && premiumFeatures.IsLayoutMaxWidthPremium() && !user.HasActivePremiumSubscription() {
			return errors.New("updating layout max width requires premium")
		}
	}

	if profile.Description != existingProfile.Description {
		if premiumFeatures.IsAllowHTMLDescriptionPremium() && !user.HasActivePremiumSubscription() {
			if utils.ContainsHTML(existingProfile.Description) {
				return errors.New("downgrading description requires premium")
			}
			if utils.ContainsHTML(profile.Description) {
				return errors.New("updating to HTML description requires premium")
			}
		}
	}

	err = ps.DB.Model(profile).Where("uid = ?", profile.UID).Select("*").Updates(profile).Error
	if err != nil {
		return err
	}

	return nil
}

/* Delete user profile by UID */
func (ps *ProfileService) DeleteUserProfileByUID(uid uint) error {
	if err := ps.DB.Where("uid = ?", uid).Delete(&models.UserProfile{}).Error; err != nil {
		return err
	}

	return nil
}
