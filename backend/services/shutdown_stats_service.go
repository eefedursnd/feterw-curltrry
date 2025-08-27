package services

import (
	"encoding/json"
	"log"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"gorm.io/gorm"
)

type ShutdownStatsService struct {
	DB     *gorm.DB
	Client *redis.Client
}

type ShutdownStats struct {
	// User Statistics
	TotalUsers          int64 `json:"total_users"`
	TotalPremiumUsers   int64 `json:"total_premium_users"`
	TotalDiscordLinked  int64 `json:"total_discord_linked"`
	TotalVerifiedEmails int64 `json:"total_verified_emails"`

	// Content Statistics
	TotalProfiles     int64 `json:"total_profiles"`
	TotalViews        int64 `json:"total_views"`
	TotalSocials      int64 `json:"total_socials"`
	TotalWidgets      int64 `json:"total_widgets"`
	TotalBadges       int64 `json:"total_badges"`
	TotalCustomBadges int64 `json:"total_custom_badges"`
	TotalUserBadges   int64 `json:"total_user_badges"`
	TotalTemplates    int64 `json:"total_templates"`

	// Platform Activity
	TotalApplications int64 `json:"total_applications"`
	TotalRedemptions  int64 `json:"total_redemptions"`
	TotalDataExports  int64 `json:"total_data_exports"`
	TotalPunishments  int64 `json:"total_punishments"`
	TotalReports      int64 `json:"total_reports"`

	TotalEvents       int64 `json:"total_events"`

	// Premium & Subscriptions
	TotalSubscriptions  int64   `json:"total_subscriptions"`
	TotalRevenue        float64 `json:"total_revenue"`
	LifetimeSubscribers int64   `json:"lifetime_subscribers"`
	MonthlySubscribers  int64   `json:"monthly_subscribers"`

	// Popular Content
	TopTemplates       []TemplateUsage `json:"top_templates"`
	TopSocialPlatforms []SocialUsage   `json:"top_social_platforms"`
	TopUsersByViews    []TopUserStats  `json:"top_users_by_views"`
	TopUsersByBadges   []TopUserStats  `json:"top_users_by_badges"`

	// Time-based Statistics
	UsersJoinedThisYear int64  `json:"users_joined_this_year"`
	ViewsThisYear       int64  `json:"views_this_year"`
	PeakMonth           string `json:"peak_month"`
	PeakMonthUsers      int64  `json:"peak_month_users"`

	// System Statistics
	TotalSessions         int64   `json:"total_sessions"`
	AverageViewsPerUser   float64 `json:"average_views_per_user"`
	AverageBadgesPerUser  float64 `json:"average_badges_per_user"`
	AverageSocialsPerUser float64 `json:"average_socials_per_user"`

	// Additional Metrics
	MostPopularBadge    string `json:"most_popular_badge"`
	MostUsedTemplate    string `json:"most_used_template"`
	MostPopularSocial   string `json:"most_popular_social"`
	TotalStaffMembers   int64  `json:"total_staff_members"`
	TotalModerationLogs int64  `json:"total_moderation_logs"`

	// Final Statistics
	GeneratedAt  time.Time `json:"generated_at"`
	ShutdownDate time.Time `json:"shutdown_date"`
}

type TemplateUsage struct {
	Template string `json:"template"`
	Count    int64  `json:"count"`
}

type SocialUsage struct {
	Platform string `json:"platform"`
	Count    int64  `json:"count"`
}

type TopUserStats struct {
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Value       int64  `json:"value"`
}

func NewShutdownStatsService(db *gorm.DB, client *redis.Client) *ShutdownStatsService {
	return &ShutdownStatsService{
		DB:     db,
		Client: client,
	}
}

// GenerateShutdownStats generates comprehensive statistics for the shutdown screen
func (sss *ShutdownStatsService) GenerateShutdownStats() (*ShutdownStats, error) {
	log.Println("Generating comprehensive shutdown statistics...")

	stats := &ShutdownStats{
		GeneratedAt:  time.Now(),
		ShutdownDate: time.Date(2025, 8, 1, 0, 0, 0, 0, time.UTC),
	}

	// User Statistics
	if err := sss.getUserStats(stats); err != nil {
		log.Printf("Error getting user stats: %v", err)
		return nil, err
	}

	// Content Statistics
	if err := sss.getContentStats(stats); err != nil {
		log.Printf("Error getting content stats: %v", err)
		return nil, err
	}

	// Platform Activity
	if err := sss.getPlatformStats(stats); err != nil {
		log.Printf("Error getting platform stats: %v", err)
		return nil, err
	}

	// Premium & Revenue
	if err := sss.getPremiumStats(stats); err != nil {
		log.Printf("Error getting premium stats: %v", err)
		return nil, err
	}

	// Popular Content
	if err := sss.getPopularContent(stats); err != nil {
		log.Printf("Error getting popular content: %v", err)
		return nil, err
	}

	// Time-based Statistics
	if err := sss.getTimeBasedStats(stats); err != nil {
		log.Printf("Error getting time-based stats: %v", err)
		return nil, err
	}

	// System Statistics
	if err := sss.getSystemStats(stats); err != nil {
		log.Printf("Error getting system stats: %v", err)
		return nil, err
	}

	// Calculate derived statistics
	sss.calculateDerivedStats(stats)

	log.Println("Shutdown statistics generation completed successfully")
	return stats, nil
}

func (sss *ShutdownStatsService) getUserStats(stats *ShutdownStats) error {
	// Total users
	if err := sss.DB.Model(&models.User{}).Count(&stats.TotalUsers).Error; err != nil {
		return err
	}

	// Premium users (active subscriptions)
	if err := sss.DB.Model(&models.UserSubscription{}).
		Where("status = ?", "active").Count(&stats.TotalPremiumUsers).Error; err != nil {
		return err
	}

	// Discord linked users
	if err := sss.DB.Model(&models.User{}).
		Where("discord_id IS NOT NULL AND discord_id != ''").Count(&stats.TotalDiscordLinked).Error; err != nil {
		return err
	}

	// Verified emails
	if err := sss.DB.Model(&models.User{}).
		Where("email_verified = ?", true).Count(&stats.TotalVerifiedEmails).Error; err != nil {
		return err
	}

	// Staff members
	if err := sss.DB.Model(&models.User{}).
		Where("staff_level > ?", 0).Count(&stats.TotalStaffMembers).Error; err != nil {
		return err
	}

	return nil
}

func (sss *ShutdownStatsService) getContentStats(stats *ShutdownStats) error {
	// Profiles
	if err := sss.DB.Model(&models.UserProfile{}).Count(&stats.TotalProfiles).Error; err != nil {
		return err
	}

	// Total views
	if err := sss.DB.Model(&models.UserProfile{}).Select("COALESCE(SUM(views), 0)").Row().Scan(&stats.TotalViews); err != nil {
		return err
	}

	// Socials
	if err := sss.DB.Model(&models.UserSocial{}).Count(&stats.TotalSocials).Error; err != nil {
		return err
	}

	// Widgets
	if err := sss.DB.Model(&models.UserWidget{}).Count(&stats.TotalWidgets).Error; err != nil {
		return err
	}

	// Badges
	if err := sss.DB.Model(&models.Badge{}).Count(&stats.TotalBadges).Error; err != nil {
		return err
	}

	// Custom badges
	if err := sss.DB.Model(&models.Badge{}).
		Where("is_custom = ?", true).Count(&stats.TotalCustomBadges).Error; err != nil {
		return err
	}

	// User badges
	if err := sss.DB.Model(&models.UserBadge{}).Count(&stats.TotalUserBadges).Error; err != nil {
		return err
	}

	// Templates
	if err := sss.DB.Model(&models.Template{}).Count(&stats.TotalTemplates).Error; err != nil {
		return err
	}

	return nil
}

func (sss *ShutdownStatsService) getPlatformStats(stats *ShutdownStats) error {
	// Applications
	if err := sss.DB.Model(&models.Application{}).Count(&stats.TotalApplications).Error; err != nil {
		return err
	}

	// Data exports
	if err := sss.DB.Model(&models.DataExport{}).Count(&stats.TotalDataExports).Error; err != nil {
		return err
	}

	// Punishments
	if err := sss.DB.Model(&models.Punishment{}).Count(&stats.TotalPunishments).Error; err != nil {
		return err
	}

	// Reports
	if err := sss.DB.Model(&models.Report{}).Count(&stats.TotalReports).Error; err != nil {
		return err
	}

	// Redemptions
	if err := sss.DB.Model(&models.RedeemCode{}).
		Where("is_used = ?", true).Count(&stats.TotalRedemptions).Error; err != nil {
		return err
	}



	// Events
	if err := sss.DB.Model(&models.Event{}).Count(&stats.TotalEvents).Error; err != nil {
		return err
	}

	// Moderation logs
	if err := sss.DB.Model(&models.ModerationLog{}).Count(&stats.TotalModerationLogs).Error; err != nil {
		return err
	}

	return nil
}

func (sss *ShutdownStatsService) getPremiumStats(stats *ShutdownStats) error {
	// Total subscriptions
	if err := sss.DB.Model(&models.UserSubscription{}).Count(&stats.TotalSubscriptions).Error; err != nil {
		return err
	}

	// Lifetime vs Monthly subscribers
	if err := sss.DB.Model(&models.UserSubscription{}).
		Where("subscription_type = ? AND status = ?", "lifetime", "active").
		Count(&stats.LifetimeSubscribers).Error; err != nil {
		return err
	}

	if err := sss.DB.Model(&models.UserSubscription{}).
		Where("subscription_type = ? AND status = ?", "monthly", "active").
		Count(&stats.MonthlySubscribers).Error; err != nil {
		return err
	}

	// Calculate revenue (simplified calculation)
	stats.TotalRevenue = float64(stats.LifetimeSubscribers)*4.99 + float64(stats.MonthlySubscribers)*2.99

	return nil
}

func (sss *ShutdownStatsService) getPopularContent(stats *ShutdownStats) error {
	// Top templates
	var templateResults []struct {
		Template string
		Count    int64
	}

	if err := sss.DB.Model(&models.UserProfile{}).
		Select("template, COUNT(*) as count").
		Where("template IS NOT NULL AND template != '' AND template != 'default'").
		Group("template").
		Order("count DESC").
		Limit(10).
		Scan(&templateResults).Error; err != nil {
		return err
	}

	for _, result := range templateResults {
		stats.TopTemplates = append(stats.TopTemplates, TemplateUsage{
			Template: result.Template,
			Count:    result.Count,
		})
	}

	// Top social platforms
	var socialResults []struct {
		Platform string
		Count    int64
	}

	if err := sss.DB.Model(&models.UserSocial{}).
		Select("platform, COUNT(*) as count").
		Group("platform").
		Order("count DESC").
		Limit(10).
		Scan(&socialResults).Error; err != nil {
		return err
	}

	for _, result := range socialResults {
		stats.TopSocialPlatforms = append(stats.TopSocialPlatforms, SocialUsage{
			Platform: result.Platform,
			Count:    result.Count,
		})
	}

	// Top users by views
	var userViewResults []struct {
		Username    string
		DisplayName string
		Views       int64
	}

	if err := sss.DB.Table("users").
		Select("users.username, users.display_name, user_profiles.views").
		Joins("JOIN user_profiles ON users.uid = user_profiles.uid").
		Order("user_profiles.views DESC").
		Limit(10).
		Scan(&userViewResults).Error; err != nil {
		return err
	}

	for _, result := range userViewResults {
		stats.TopUsersByViews = append(stats.TopUsersByViews, TopUserStats{
			Username:    result.Username,
			DisplayName: result.DisplayName,
			Value:       result.Views,
		})
	}

	// Top users by badges
	var userBadgeResults []struct {
		Username    string
		DisplayName string
		BadgeCount  int64
	}

	if err := sss.DB.Table("users").
		Select("users.username, users.display_name, COUNT(user_badges.id) as badge_count").
		Joins("LEFT JOIN user_badges ON users.uid = user_badges.uid").
		Group("users.uid, users.username, users.display_name").
		Order("badge_count DESC").
		Limit(10).
		Scan(&userBadgeResults).Error; err != nil {
		return err
	}

	for _, result := range userBadgeResults {
		stats.TopUsersByBadges = append(stats.TopUsersByBadges, TopUserStats{
			Username:    result.Username,
			DisplayName: result.DisplayName,
			Value:       result.BadgeCount,
		})
	}

	return nil
}

func (sss *ShutdownStatsService) getTimeBasedStats(stats *ShutdownStats) error {
	// Users joined this year (2025)
	yearStart := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	if err := sss.DB.Model(&models.User{}).
		Where("created_at >= ?", yearStart).
		Count(&stats.UsersJoinedThisYear).Error; err != nil {
		return err
	}

	// Views this year (simplified - just get total since we don't have time-based view tracking)
	stats.ViewsThisYear = stats.TotalViews

	// Find peak month for user registrations
	var monthlyResults []struct {
		Month string
		Count int64
	}

	if err := sss.DB.Model(&models.User{}).
		Select("DATE_TRUNC('month', created_at) as month, COUNT(*) as count").
		Where("created_at >= ?", yearStart).
		Group("DATE_TRUNC('month', created_at)").
		Order("count DESC").
		Limit(1).
		Scan(&monthlyResults).Error; err != nil {
		return err
	}

	if len(monthlyResults) > 0 {
		stats.PeakMonth = monthlyResults[0].Month
		stats.PeakMonthUsers = monthlyResults[0].Count
	}

	return nil
}

func (sss *ShutdownStatsService) getSystemStats(stats *ShutdownStats) error {
	// Sessions
	if err := sss.DB.Model(&models.UserSession{}).Count(&stats.TotalSessions).Error; err != nil {
		return err
	}

	// Most popular badge
	var badgeResult struct {
		Name  string
		Count int64
	}

	if err := sss.DB.Table("badges").
		Select("badges.name, COUNT(user_badges.id) as count").
		Joins("JOIN user_badges ON badges.id = user_badges.badge_id").
		Group("badges.id, badges.name").
		Order("count DESC").
		Limit(1).
		Scan(&badgeResult).Error; err != nil {
		return err
	}

	stats.MostPopularBadge = badgeResult.Name

	// Most used template
	if len(stats.TopTemplates) > 0 {
		stats.MostUsedTemplate = stats.TopTemplates[0].Template
	}

	// Most popular social platform
	if len(stats.TopSocialPlatforms) > 0 {
		stats.MostPopularSocial = stats.TopSocialPlatforms[0].Platform
	}

	return nil
}

func (sss *ShutdownStatsService) calculateDerivedStats(stats *ShutdownStats) {
	// Average views per user
	if stats.TotalUsers > 0 {
		stats.AverageViewsPerUser = float64(stats.TotalViews) / float64(stats.TotalUsers)
	}

	// Average badges per user
	if stats.TotalUsers > 0 {
		stats.AverageBadgesPerUser = float64(stats.TotalUserBadges) / float64(stats.TotalUsers)
	}

	// Average socials per user
	if stats.TotalUsers > 0 {
		stats.AverageSocialsPerUser = float64(stats.TotalSocials) / float64(stats.TotalUsers)
	}
}

// CacheShutdownStats caches the shutdown stats for quick retrieval
func (sss *ShutdownStatsService) CacheShutdownStats(stats *ShutdownStats) error {
	cacheKey := "shutdown:stats"

	jsonData, err := json.Marshal(stats)
	if err != nil {
		return err
	}

	// Cache for 24 hours
	return sss.Client.Set(cacheKey, string(jsonData), 24*time.Hour).Err()
}

// GetCachedShutdownStats retrieves cached shutdown stats
func (sss *ShutdownStatsService) GetCachedShutdownStats() (*ShutdownStats, error) {
	cacheKey := "shutdown:stats"

	val, err := sss.Client.Get(cacheKey).Result()
	if err != nil {
		return nil, err
	}

	var stats ShutdownStats
	if err := json.Unmarshal([]byte(val), &stats); err != nil {
		return nil, err
	}

	return &stats, nil
}

// GetOrGenerateShutdownStats gets cached stats or generates new ones
func (sss *ShutdownStatsService) GetOrGenerateShutdownStats() (*ShutdownStats, error) {
	// Try to get cached stats first
	stats, err := sss.GetCachedShutdownStats()
	if err == nil {
		return stats, nil
	}

	// Generate new stats if cache miss
	stats, err = sss.GenerateShutdownStats()
	if err != nil {
		return nil, err
	}

	// Cache the new stats
	if err := sss.CacheShutdownStats(stats); err != nil {
		log.Printf("Error caching shutdown stats: %v", err)
	}

	return stats, nil
}
