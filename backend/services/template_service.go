package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"gorm.io/gorm"
)

type TemplateService struct {
	DB          *gorm.DB
	Client      *redis.Client
	UserService *UserService
}

func NewTemplateService(db *gorm.DB, client *redis.Client) *TemplateService {
	return &TemplateService{
		DB:          db,
		Client:      client,
		UserService: &UserService{DB: db, Client: client},
	}
}

const (
	RegularUserTemplateLimit = 2
	PremiumUserTemplateLimit = 5

	templateCachePrefix = "template:"
	templateCacheTTL    = 24 * time.Hour

	shareableTemplatesCacheKey = "shareable_templates"
	shareableTemplatesCacheTTL = 5 * time.Minute
)

/* Create a new template */
func (ts *TemplateService) CreateTemplate(template *models.Template) error {
	user, err := ts.UserService.GetUserByUIDNoCache(template.CreatorID)
	if err != nil {
		return err
	}

	var count int64
	ts.DB.Model(&models.Template{}).Where("creator_id = ?", template.CreatorID).Count(&count)

	limit := RegularUserTemplateLimit
	if user.HasActivePremiumSubscription() {
		limit = PremiumUserTemplateLimit
	}

	if count >= int64(limit) {
		return fmt.Errorf("template limit reached (%d/%d)", count, limit)
	}

	if len(template.Name) < 3 || len(template.Name) > 50 {
		return errors.New("template name must be between 3 and 50 characters")
	}

	var existingCount int64
	ts.DB.Model(&models.Template{}).
		Where("creator_id = ? AND name = ?", template.CreatorID, template.Name).
		Count(&existingCount)

	if existingCount > 0 {
		return errors.New("you already have a template with this name")
	}

	if len(template.Tags) > 5 {
		template.Tags = template.Tags[:5]
	}

	hasPremium, _ := ts.detectPremiumFeatures(template.TemplateData)
	template.PremiumRequired = hasPremium

	if err := ts.DB.Create(template).Error; err != nil {
		log.Println("Error creating template:", err)
		return err
	}

	ts.invalidateTemplateCache(template.ID)

	return nil
}

/* Get template by ID */
func (ts *TemplateService) GetTemplateByID(id uint) (*models.Template, error) {
	template := &models.Template{}

	err := ts.DB.Where("id = ?", id).First(template).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("template not found")
		}
		return nil, err
	}

	user, err := ts.UserService.GetUserByUID(template.CreatorID)
	if err == nil {
		template.CreatorUsername = user.Username

		profileService := &ProfileService{DB: ts.DB, Client: ts.Client, UserService: ts.UserService}
		userProfile, err := profileService.GetUserProfileByUID(template.CreatorID)
		if err == nil && userProfile.AvatarURL != "" {
			template.CreatorAvatar = userProfile.AvatarURL
		}
	}

	return template, nil
}

/* Get all templates by user ID */
func (ts *TemplateService) GetTemplatesByUserID(userID uint) ([]*models.Template, error) {
	var templates []*models.Template

	err := ts.DB.Where("creator_id = ?", userID).Order("created_at DESC").Find(&templates).Error
	if err != nil {
		return nil, err
	}

	return templates, nil
}

/* Get shareable templates */
/* Get shareable templates */
func (ts *TemplateService) GetShareableTemplates() ([]*models.Template, error) {
	cacheKey := shareableTemplatesCacheKey
	cachedData, err := ts.Client.Get(cacheKey).Result()
	if err == nil {
		var templates []*models.Template
		if err := json.Unmarshal([]byte(cachedData), &templates); err == nil {
			return templates, nil
		}
		ts.Client.Del(cacheKey)
	}

	var bannedUserIDs []uint
	err = ts.DB.Model(&models.Punishment{}).
		Where("active = ? AND end_date > ?", true, time.Now()).
		Pluck("user_id", &bannedUserIDs).Error
	if err != nil {
		log.Printf("Error fetching banned users: %v", err)
	}

	bannedUsers := make(map[uint]bool)
	for _, uid := range bannedUserIDs {
		bannedUsers[uid] = true
	}

	var templates []*models.Template
	err = ts.DB.Where("shareable = ?", true).Order("uses DESC").Find(&templates).Error
	if err != nil {
		return nil, err
	}

	var filteredTemplates []*models.Template
	for _, template := range templates {
		if _, isBanned := bannedUsers[template.CreatorID]; isBanned {
			continue
		}

		user, err := ts.UserService.GetUserByUID(template.CreatorID)
		if err == nil {
			template.CreatorUsername = user.Username

			profileService := &ProfileService{DB: ts.DB, Client: ts.Client, UserService: ts.UserService}
			userProfile, err := profileService.GetUserProfileByUID(template.CreatorID)
			if err == nil && userProfile.AvatarURL != "" {
				template.CreatorAvatar = userProfile.AvatarURL
			}
		}

		filteredTemplates = append(filteredTemplates, template)
	}

	if data, err := json.Marshal(filteredTemplates); err == nil {
		ts.Client.Set(cacheKey, string(data), shareableTemplatesCacheTTL)
	}

	return filteredTemplates, nil
}

/* Update template */
func (ts *TemplateService) UpdateTemplate(template *models.Template, overwriteTemplateData bool) error {
	existingTemplate := &models.Template{}
	err := ts.DB.Where("id = ?", template.ID).First(existingTemplate).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("template not found")
		}
		return err
	}

	if existingTemplate.CreatorID != template.CreatorID {
		return errors.New("you don't have permission to update this template")
	}

	hasPremium, _ := ts.detectPremiumFeatures(existingTemplate.TemplateData)
	template.PremiumRequired = hasPremium

	if len(template.Tags) > 5 {
		template.Tags = template.Tags[:5]
	}

	updateData := map[string]interface{}{
		"name":             template.Name,
		"shareable":        template.Shareable,
		"premium_required": template.PremiumRequired,
		"tags":             template.Tags,
	}

	if overwriteTemplateData {
		updateData["template_data"] = template.TemplateData
	}

	err = ts.DB.Model(&models.Template{}).
		Where("id = ?", template.ID).
		Updates(updateData).Error

	if err != nil {
		return err
	}

	ts.invalidateTemplateCache(template.ID)
	if template.Shareable {
		ts.invalidateShareableTemplatesCache()
	}

	return nil
}

/* Delete template */
func (ts *TemplateService) DeleteTemplate(userID uint, templateID uint) error {
	template := &models.Template{}
	err := ts.DB.Where("id = ?", templateID).First(template).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("template not found")
		}
		return err
	}

	if template.CreatorID != userID {
		return errors.New("you don't have permission to delete this template")
	}

	if err := ts.DB.Where("id = ?", templateID).Delete(&models.Template{}).Error; err != nil {
		return err
	}

	ts.invalidateTemplateCache(templateID)

	return nil
}

/* Apply template to user */
func (ts *TemplateService) ApplyTemplate(userID uint, templateID uint, confirmPremium bool) error {
	template, err := ts.GetTemplateByID(templateID)
	if err != nil {
		return err
	}

	if template.CreatorID != userID && !template.Shareable {
		return errors.New("this template is not shareable")
	}

	profileService := &ProfileService{DB: ts.DB, Client: ts.Client, UserService: ts.UserService}
	userProfile, err := profileService.GetUserProfileByUID(userID)
	if err != nil {
		return err
	}

	user, err := ts.UserService.GetUserByUIDNoCache(userID)
	if err != nil {
		return err
	}

	var templateData map[string]interface{}
	err = json.Unmarshal([]byte(template.TemplateData), &templateData)
	if err != nil {
		return fmt.Errorf("invalid template data: %w", err)
	}

	hasPremiumFeatures, premiumFeatures := ts.detectPremiumFeatures(template.TemplateData)

	log.Printf("Detected premium features: %v", premiumFeatures)
	log.Printf("User premium status: %v", user.HasActivePremiumSubscription())

	if hasPremiumFeatures && !user.HasActivePremiumSubscription() {
		if confirmPremium {
			log.Println("Applying template without premium features for non-premium user")
			templateData = ts.stripPremiumFeatures(templateData)
		} else {
			return fmt.Errorf("template contains premium features that will not be applied: %v. Set confirmPremium=true to apply without these features", premiumFeatures)
		}
	}

	err = ts.applyTemplateToProfile(userProfile, templateData, user.HasActivePremiumSubscription())
	if err != nil {
		return err
	}

	err = profileService.UpdateUserProfile(userProfile)
	if err != nil {
		return err
	}

	redisKey := fmt.Sprintf("template:applied:%d", templateID)

	alreadyApplied, err := ts.Client.SIsMember(redisKey, userID).Result()
	if err != nil {
		return fmt.Errorf("failed to check Redis set: %w", err)
	}

	if !alreadyApplied {
		_, err = ts.Client.SAdd(redisKey, userID).Result()
		if err != nil {
			return fmt.Errorf("failed to add user to Redis set: %w", err)
		}

		ts.Client.Expire(redisKey, 30*time.Minute)

		err = ts.DB.Model(&models.Template{}).
			Where("id = ?", templateID).
			UpdateColumn("uses", gorm.Expr("uses + ?", 1)).Error

		if err != nil {
			return err
		}
	}

	ts.invalidateTemplateCache(templateID)

	return nil
}

/* Apply template data to user profile */
func (ts *TemplateService) applyTemplateToProfile(profile *models.UserProfile, templateData map[string]interface{}, isPremium bool) error {
	premiumFeatures := models.NewPremiumFeatures()

	var skippedFeatures []string

	// Images
	if avatarURL, exists := templateData["avatar_url"].(string); exists {
		profile.AvatarURL = avatarURL
	}

	if backgroundURL, exists := templateData["background_url"].(string); exists {
		profile.BackgroundURL = backgroundURL
	}

	if audioURL, exists := templateData["audio_url"].(string); exists {
		profile.AudioURL = audioURL
	}

	if cursorURL, exists := templateData["cursor_url"].(string); exists {
		profile.CursorURL = cursorURL
	}

	if bannerURL, exists := templateData["banner_url"].(string); exists {
		profile.BannerURL = bannerURL
	}

	// Colors
	if bgColor, exists := templateData["background_color"].(string); exists {
		profile.BackgroundColor = bgColor
	}

	if textColor, exists := templateData["text_color"].(string); exists {
		profile.TextColor = textColor
	}

	if accentColor, exists := templateData["accent_color"].(string); exists {
		profile.AccentColor = accentColor
	}

	if iconColor, exists := templateData["icon_color"].(string); exists {
		profile.IconColor = iconColor
	}

	if badgeColor, exists := templateData["badge_color"].(string); exists {
		profile.BadgeColor = badgeColor
	}

	// Gradient colors
	if gradientFrom, exists := templateData["gradient_from_color"].(string); exists {
		profile.GradientFromColor = gradientFrom
	}

	if gradientTo, exists := templateData["gradient_to_color"].(string); exists {
		profile.GradientToColor = gradientTo
	}

	if pageTransition, exists := templateData["page_transition"].(string); exists {
		profile.PageTransition = pageTransition
	}

	if duration, exists := templateData["page_transition_duration"].(float64); exists {
		profile.PageTransitionDuration = float32(duration)
	}

	// Visibility settings
	if monoIcons, exists := templateData["monochrome_icons"].(bool); exists {
		profile.MonochromeIcons = monoIcons
	}

	if monoBadges, exists := templateData["monochrome_badges"].(bool); exists {
		profile.MonochromeBadges = monoBadges
	}

	if hideJoinedDate, exists := templateData["hide_joined_date"].(bool); exists {
		profile.HideJoinedDate = hideJoinedDate
	}

	if hideViewsCount, exists := templateData["hide_views_count"].(bool); exists {
		profile.HideViewsCount = hideViewsCount
	}

	// Card settings
	if cardOpacity, exists := templateData["card_opacity"].(float64); exists {
		profile.CardOpacity = float32(cardOpacity)
	}

	if cardBlur, exists := templateData["card_blur"].(float64); exists {
		profile.CardBlur = float32(cardBlur)
	}

	if cardBorderRadius, exists := templateData["card_border_radius"].(float64); exists {
		profile.CardBorderRadius = float32(cardBorderRadius)
	}

	// Effect settings
	if parallaxEffect, exists := templateData["parallax_effect"].(bool); exists {
		profile.ParallaxEffect = parallaxEffect
	}

	if glowUsername, exists := templateData["glow_username"].(bool); exists {
		profile.GlowUsername = glowUsername
	}

	if glowBadges, exists := templateData["glow_badges"].(bool); exists {
		profile.GlowBadges = glowBadges
	}

	if glowSocials, exists := templateData["glow_socials"].(bool); exists {
		profile.GlowSocials = glowSocials
	}

	if showWidgetsOutside, exists := templateData["show_widgets_outside"].(bool); exists {
		profile.ShowWidgetsOutside = showWidgetsOutside
	}

	if backgroundEffects, exists := templateData["background_effects"].(string); exists {
		profile.BackgroundEffects = backgroundEffects
	}

	if cursorEffects, exists := templateData["cursor_effects"].(string); exists {
		profile.CursorEffects = cursorEffects
	}

	if templateName, exists := templateData["template"].(string); exists {
		profile.Template = templateName
	}

	if viewsAnimation, exists := templateData["views_animation"].(bool); exists {
		profile.ViewsAnimation = viewsAnimation
	}

	if showWidgetsOutside, exists := templateData["show_widgets_outside"].(bool); exists {
		profile.ShowWidgetsOutside = showWidgetsOutside
	}

	// Text Font (premium)
	if font, exists := templateData["text_font"].(string); exists && font != "" {
		if !premiumFeatures.IsFontPremium(font) || isPremium {
			profile.TextFont = font
		} else {
			skippedFeatures = append(skippedFeatures, "Premium Font: "+font)
		}
	}

	// Template (premium)
	if templateName, exists := templateData["template"].(string); exists && templateName != "" {
		if !premiumFeatures.IsTemplatePremium(templateName) || isPremium {
			profile.Template = templateName
		} else {
			skippedFeatures = append(skippedFeatures, "Premium Template: "+templateName)
		}
	}

	// Cursor Effects (premium)
	if cursorEffect, exists := templateData["cursor_effects"].(string); exists && cursorEffect != "" {
		if !premiumFeatures.IsCursorEffectPremium(cursorEffect) || isPremium {
			profile.CursorEffects = cursorEffect
		} else {
			skippedFeatures = append(skippedFeatures, "Cursor Effect: "+cursorEffect)
		}
	}

	// Username Effects (premium)
	if effect, exists := templateData["username_effects"].(string); exists && effect != "" {
		if !premiumFeatures.IsUsernameEffectPremium(effect) || isPremium {
			profile.UsernameEffects = effect
		} else {
			skippedFeatures = append(skippedFeatures, "Username Effect: "+effect)
		}
	}

	// Layout Max Width (premium)
	if layoutWidth, exists := templateData["layout_max_width"].(float64); exists {
		if !premiumFeatures.IsLayoutMaxWidthPremium() || isPremium {
			profile.LayoutMaxWidth = uint(layoutWidth)
		} else {
			skippedFeatures = append(skippedFeatures, "Custom Layout Width")
		}
	}

	if len(skippedFeatures) > 0 {
		log.Printf("Skipped premium features for user without premium: %v", skippedFeatures)
	}

	return nil
}

func (ts *TemplateService) detectPremiumFeatures(templateData string) (bool, []string) {
	var data map[string]interface{}
	err := json.Unmarshal([]byte(templateData), &data)
	prettyJSON, _ := json.MarshalIndent(data, "", "  ")
	log.Printf("Template data: %s", prettyJSON)
	if err != nil {
		log.Printf("Error parsing template data: %v", err)
		return false, nil
	}

	premiumFeatures := models.NewPremiumFeatures()
	var detectedPremiumFeatures []string

	if font, exists := data["text_font"].(string); exists && font != "" {
		if premiumFeatures.IsFontPremium(font) {
			detectedPremiumFeatures = append(detectedPremiumFeatures, "Font: "+font)
			log.Println("Detected premium feature: Font " + font)
		}
	}

	if effect, exists := data["username_effects"].(string); exists && effect != "" {
		if premiumFeatures.IsUsernameEffectPremium(effect) {
			detectedPremiumFeatures = append(detectedPremiumFeatures, "Username Effect: "+effect)
			log.Println("Detected premium feature: Username Effect: " + effect)
		}
	}

	if width, exists := data["layout_max_width"].(float64); exists {
		if premiumFeatures.IsLayoutMaxWidthPremium() && uint(width) != 776 {
			detectedPremiumFeatures = append(detectedPremiumFeatures, "Custom Layout Width")
			log.Println("Detected premium feature: Custom Layout Width")
		}
	}

	if templateName, exists := data["template"].(string); exists && templateName != "" {
		if templateName != "default" {
			detectedPremiumFeatures = append(detectedPremiumFeatures, "Premium Template: "+templateName)
			log.Println("Detected premium feature: Template " + templateName)
		}
	}

	if cursorEffect, exists := data["cursor_effects"].(string); exists && cursorEffect != "" {
		if premiumFeatures.IsCursorEffectPremium(cursorEffect) {
			detectedPremiumFeatures = append(detectedPremiumFeatures, "Cursor Effect: "+cursorEffect)
			log.Println("Detected premium feature: Cursor Effect " + cursorEffect)
		}
	}

	if parallaxEffect, exists := data["parallax_effect"].(bool); exists && parallaxEffect {
		if premiumFeatures.IsParallaxEffectPremium() {
			detectedPremiumFeatures = append(detectedPremiumFeatures, "Parallax Effect")
			log.Println("Detected premium feature: Parallax Effect")
		}
	}

	if len(detectedPremiumFeatures) > 0 {
		log.Printf("Detected premium features: %v", detectedPremiumFeatures)
	} else {
		log.Println("No premium features detected")
	}

	return len(detectedPremiumFeatures) > 0, detectedPremiumFeatures
}

func (ts *TemplateService) stripPremiumFeatures(templateData map[string]interface{}) map[string]interface{} {
	premiumFeatures := models.NewPremiumFeatures()
	result := make(map[string]interface{})

	for key, value := range templateData {
		switch key {
		case "text_font":
			font, ok := value.(string)
			if !ok || !premiumFeatures.IsFontPremium(font) {
				result[key] = value
			} else {
				result[key] = ""
			}
		case "username_effects":
			effect, ok := value.(string)
			if !ok || !premiumFeatures.IsUsernameEffectPremium(effect) {
				result[key] = value
			} else {
				result[key] = ""
			}
		case "layout_max_width":
			if !premiumFeatures.IsLayoutMaxWidthPremium() {
				result[key] = value
			} else {
				result[key] = float64(776)
			}
		case "template":
			templateName, ok := value.(string)
			if !ok || templateName == "default" {
				result[key] = value
			} else {
				result[key] = "default"
			}
		case "cursor_effects":
			cursorEffect, ok := value.(string)
			if !ok || !premiumFeatures.IsCursorEffectPremium(cursorEffect) {
				result[key] = value
			} else {
				result[key] = ""
			}
		case "parallax_effect":
			if !premiumFeatures.IsParallaxEffectPremium() {
				result[key] = value
			} else {
				result[key] = false
			}
		default:
			result[key] = value
		}
	}

	return result
}

/* Check if user has premium features applied that would be lost */
func (ts *TemplateService) CheckPremiumFeatureLoss(userID uint, templateID uint) (bool, []string, error) {
	user, err := ts.UserService.GetUserByUIDNoCache(userID)
	if err != nil {
		return false, nil, err
	}

	if !user.HasActivePremiumSubscription() {
		return false, nil, nil
	}

	profileService := &ProfileService{DB: ts.DB, Client: ts.Client, UserService: ts.UserService}
	userProfile, err := profileService.GetUserProfileByUID(userID)
	if err != nil {
		return false, nil, err
	}

	template, err := ts.GetTemplateByID(templateID)
	if err != nil {
		return false, nil, err
	}

	var templateData map[string]interface{}
	err = json.Unmarshal([]byte(template.TemplateData), &templateData)
	if err != nil {
		return false, nil, fmt.Errorf("invalid template data: %w", err)
	}

	premiumFeatures := models.NewPremiumFeatures()
	var lostFeatures []string

	if userProfile.TextFont != "" && premiumFeatures.IsFontPremium(userProfile.TextFont) {
		if font, exists := templateData["text_font"].(string); !exists || font != userProfile.TextFont {
			lostFeatures = append(lostFeatures, "Custom Font: "+userProfile.TextFont)
		}
	}

	if userProfile.UsernameEffects != "" && premiumFeatures.IsUsernameEffectPremium(userProfile.UsernameEffects) {
		if effect, exists := templateData["username_effects"].(string); !exists || effect != userProfile.UsernameEffects {
			lostFeatures = append(lostFeatures, "Username Effect: "+userProfile.UsernameEffects)
		}
	}

	if userProfile.Template != "default" && premiumFeatures.IsTemplatePremium(userProfile.Template) {
		if templateName, exists := templateData["template"].(string); !exists || templateName != userProfile.Template {
			lostFeatures = append(lostFeatures, "Template: "+userProfile.Template)
		}
	}

	if userProfile.CursorEffects != "" && premiumFeatures.IsCursorEffectPremium(userProfile.CursorEffects) {
		if effect, exists := templateData["cursor_effects"].(string); !exists || effect != userProfile.CursorEffects {
			lostFeatures = append(lostFeatures, "Cursor Effect: "+userProfile.CursorEffects)
		}
	}

	if userProfile.LayoutMaxWidth != 776 && premiumFeatures.IsLayoutMaxWidthPremium() {
		if width, exists := templateData["layout_max_width"].(float64); !exists || uint(width) != userProfile.LayoutMaxWidth {
			lostFeatures = append(lostFeatures, "Custom Layout Width")
		}
	}

	return len(lostFeatures) > 0, lostFeatures, nil
}

/* Get template stats */
func (ts *TemplateService) GetTemplateStats() (map[string]interface{}, error) {
	var totalTemplates int64
	ts.DB.Model(&models.Template{}).Count(&totalTemplates)

	var totalShareableTemplates int64
	ts.DB.Model(&models.Template{}).Where("shareable = ?", true).Count(&totalShareableTemplates)

	var totalPremiumTemplates int64
	ts.DB.Model(&models.Template{}).Where("premium_required = ?", true).Count(&totalPremiumTemplates)

	var totalUses int64
	ts.DB.Model(&models.Template{}).Select("SUM(uses)").Row().Scan(&totalUses)

	var popularTemplate models.Template
	err := ts.DB.Order("uses DESC").First(&popularTemplate).Error

	stats := map[string]interface{}{
		"totalCount":          totalTemplates,
		"shareableCount":      totalShareableTemplates,
		"premiumCount":        totalPremiumTemplates,
		"totalUses":           totalUses,
		"mostPopularTemplate": nil,
	}

	if err == nil {
		stats["mostPopularTemplate"] = map[string]interface{}{
			"id":    popularTemplate.ID,
			"name":  popularTemplate.Name,
			"uses":  popularTemplate.Uses,
			"owner": popularTemplate.CreatorID,
		}
	}

	return stats, nil
}

/* Helper to invalidate template cache */
func (ts *TemplateService) invalidateTemplateCache(templateID uint) {
	cacheKey := fmt.Sprintf("%s%d", templateCachePrefix, templateID)
	ts.Client.Del(cacheKey)
}

/* Helper to invalidate shareable templates cache */
func (ts *TemplateService) invalidateShareableTemplatesCache() {
	ts.Client.Del(shareableTemplatesCacheKey)
}

/* Extract premium features from a template */
func (ts *TemplateService) ExtractPremiumFeatures(templateID uint) (bool, []string, error) {
	template, err := ts.GetTemplateByID(templateID)
	if err != nil {
		return false, nil, err
	}

	hasPremium, premiumFeatures := ts.detectPremiumFeatures(template.TemplateData)
	return hasPremium, premiumFeatures, nil
}
