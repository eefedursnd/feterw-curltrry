package services

import (
	"fmt"
	"log"
	"sort"
	"strings"
	"time"

	"github.com/go-redis/redis"
	"gorm.io/gorm"
)

const (
	CountryViewsPrefix  = "analytics:countries:"
	SocialClicksPrefix  = "analytics:socials:"
	ReferrerViewsPrefix = "analytics:referrers:"
	DeviceViewsPrefix   = "analytics:devices:"
	ProfileViewsPrefix  = "analytics:profile_views:"

	DataRetentionDays = 14

	MaxTopItems = 5
)

type AnalyticsService struct {
	DB     *gorm.DB
	Client *redis.Client
}

func NewAnalyticsService(db *gorm.DB, client *redis.Client) *AnalyticsService {
	return &AnalyticsService{
		DB:     db,
		Client: client,
	}
}

func (as *AnalyticsService) TrackProfileView(uid uint, country string, referrer string, device string) error {
	today := time.Now().Format("2006-01-02")
	pipe := as.Client.Pipeline()

	if country != "" {
		countryKey := fmt.Sprintf("%s%d:%s", CountryViewsPrefix, uid, today)
		pipe.HIncrBy(countryKey, country, 1)
		pipe.Expire(countryKey, DataRetentionDays*24*time.Hour)
	}

	if referrer != "" {
		referrerKey := fmt.Sprintf("%s%d:%s", ReferrerViewsPrefix, uid, today)
		pipe.HIncrBy(referrerKey, referrer, 1)
		pipe.Expire(referrerKey, DataRetentionDays*24*time.Hour)
	}

	if device != "" {
		deviceKey := fmt.Sprintf("%s%d:%s", DeviceViewsPrefix, uid, today)
		pipe.HIncrBy(deviceKey, device, 1)
		pipe.Expire(deviceKey, DataRetentionDays*24*time.Hour)
	}

	viewsKey := fmt.Sprintf("%s%d:%s", ProfileViewsPrefix, uid, today)
	pipe.Incr(viewsKey)
	pipe.Expire(viewsKey, DataRetentionDays*24*time.Hour)

	_, err := pipe.Exec()
	if err != nil {
		return fmt.Errorf("failed to track profile view analytics: %w", err)
	}

	// Schedule database sync (background job)
	go as.scheduleDatabaseSync(uid, today)

	return nil
}

func (as *AnalyticsService) TrackSocialClick(uid uint, socialType string) error {
	today := time.Now().Format("2006-01-02")
	socialKey := fmt.Sprintf("%s%d:%s", SocialClicksPrefix, uid, today)

	pipe := as.Client.Pipeline()
	pipe.HIncrBy(socialKey, socialType, 1)
	pipe.Expire(socialKey, DataRetentionDays*24*time.Hour)

	_, err := pipe.Exec()
	if err != nil {
		return fmt.Errorf("failed to track social click: %w", err)
	}

	return nil
}

func (as *AnalyticsService) GetTopCountries(uid uint, days int) (map[string]int64, error) {
	if days > DataRetentionDays {
		days = DataRetentionDays
	}

	return as.getTopMetric(uid, CountryViewsPrefix, days)
}

func (as *AnalyticsService) GetTopSocials(uid uint, days int) (map[string]int64, error) {
	if days > DataRetentionDays {
		days = DataRetentionDays
	}

	return as.getTopMetric(uid, SocialClicksPrefix, days)
}

func (as *AnalyticsService) GetTopReferrers(uid uint, days int) (map[string]int64, error) {
	if days > DataRetentionDays {
		days = DataRetentionDays
	}

	return as.getTopMetric(uid, ReferrerViewsPrefix, days)
}

func (as *AnalyticsService) GetDeviceBreakdown(uid uint, days int) (map[string]int64, error) {
	if days > DataRetentionDays {
		days = DataRetentionDays
	}

	return as.getTopMetric(uid, DeviceViewsPrefix, days)
}

func (as *AnalyticsService) GetDailyViews(uid uint, days int) (map[string]int64, error) {
	if days > DataRetentionDays {
		days = DataRetentionDays
	}

	result := make(map[string]int64)
	now := time.Now()

	pipe := as.Client.Pipeline()
	cmds := make(map[string]*redis.StringCmd)

	for i := 0; i < days; i++ {
		date := now.AddDate(0, 0, -i).Format("2006-01-02")
		key := fmt.Sprintf("%s%d:%s", ProfileViewsPrefix, uid, date)
		cmds[date] = pipe.Get(key)
	}

	_, err := pipe.Exec()
	if err != nil && err != redis.Nil {
		return nil, fmt.Errorf("failed to fetch daily views: %w", err)
	}

	for date, cmd := range cmds {
		val, err := cmd.Int64()
		if err == redis.Nil {
			result[date] = 0
		} else if err != nil {
			log.Printf("Error retrieving views for %s: %v", date, err)
			result[date] = 0
		} else {
			result[date] = val
		}
	}

	return result, nil
}

func (as *AnalyticsService) getTopMetric(uid uint, metricPrefix string, days int) (map[string]int64, error) {
	aggregated := make(map[string]int64)
	now := time.Now()

	for i := 0; i < days; i++ {
		date := now.AddDate(0, 0, -i).Format("2006-01-02")
		key := fmt.Sprintf("%s%d:%s", metricPrefix, uid, date)

		values, err := as.Client.HGetAll(key).Result()
		if err != nil {
			return nil, fmt.Errorf("failed to get metrics data: %w", err)
		}

		for name, countStr := range values {
			count := int64(0)
			fmt.Sscanf(countStr, "%d", &count)
			aggregated[name] += count
		}
	}

	return limitToTopItems(aggregated, MaxTopItems), nil
}

func limitToTopItems(data map[string]int64, n int) map[string]int64 {
	if len(data) <= n {
		return data
	}

	type kv struct {
		Key   string
		Value int64
	}

	var items []kv
	for k, v := range data {
		items = append(items, kv{k, v})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Value > items[j].Value
	})

	result := make(map[string]int64)
	for i := 0; i < n && i < len(items); i++ {
		result[items[i].Key] = items[i].Value
	}

	return result
}

type AnalyticsData struct {
	ProfileViews    map[string]int64 `json:"profile_views"`
	TopCountries    map[string]int64 `json:"top_countries"`
	TopSocials      map[string]int64 `json:"top_socials"`
	TopReferrers    map[string]int64 `json:"top_referrers"`
	DeviceBreakdown map[string]int64 `json:"device_breakdown"`
}

func (as *AnalyticsService) GetFullAnalytics(uid uint, days int) (*AnalyticsData, error) {
	if days > DataRetentionDays {
		days = DataRetentionDays
	}

	// First try to get from Redis
	redisData, err := as.getAnalyticsFromRedis(uid, days)
	if err == nil && !as.isRedisDataEmpty(redisData) {
		log.Printf("DEBUG: Analytics data retrieved from Redis for UID %d", uid)
		return redisData, nil
	}

	// If Redis is empty or has error, get from database
	log.Printf("DEBUG: Redis analytics empty, getting from database for UID %d", uid)
	databaseData, err := as.GetAnalyticsFromDatabase(uid, days)
	if err != nil {
		return nil, fmt.Errorf("failed to get analytics from database: %w", err)
	}

	// If we got data from database, sync it back to Redis
	if !as.isAnalyticsDataEmpty(databaseData) {
		go as.syncDatabaseToRedis(uid, days, databaseData)
	}

	return databaseData, nil
}

func (as *AnalyticsService) getAnalyticsFromRedis(uid uint, days int) (*AnalyticsData, error) {
	type result struct {
		data map[string]int64
		err  error
	}

	countriesCh := make(chan result, 1)
	socialsCh := make(chan result, 1)
	referrersCh := make(chan result, 1)
	devicesCh := make(chan result, 1)
	viewsCh := make(chan result, 1)

	go func() {
		data, err := as.GetTopCountries(uid, days)
		countriesCh <- result{data, err}
	}()

	go func() {
		data, err := as.GetTopSocials(uid, days)
		socialsCh <- result{data, err}
	}()

	go func() {
		data, err := as.GetTopReferrers(uid, days)
		referrersCh <- result{data, err}
	}()

	go func() {
		data, err := as.GetDeviceBreakdown(uid, days)
		devicesCh <- result{data, err}
	}()

	go func() {
		data, err := as.GetDailyViews(uid, days)
		viewsCh <- result{data, err}
	}()

	countriesRes := <-countriesCh
	if countriesRes.err != nil {
		return nil, fmt.Errorf("failed to get top countries: %w", countriesRes.err)
	}

	socialsRes := <-socialsCh
	if socialsRes.err != nil {
		return nil, fmt.Errorf("failed to get top socials: %w", socialsRes.err)
	}

	referrersRes := <-referrersCh
	if referrersRes.err != nil {
		return nil, fmt.Errorf("failed to get top referrers: %w", referrersRes.err)
	}

	devicesRes := <-devicesCh
	if devicesRes.err != nil {
		return nil, fmt.Errorf("failed to get device breakdown: %w", devicesRes.err)
	}

	viewsRes := <-viewsCh
	if viewsRes.err != nil {
		return nil, fmt.Errorf("failed to get daily views: %w", viewsRes.err)
	}

	return &AnalyticsData{
		ProfileViews:    viewsRes.data,
		TopCountries:    countriesRes.data,
		TopSocials:      socialsRes.data,
		TopReferrers:    referrersRes.data,
		DeviceBreakdown: devicesRes.data,
	}, nil
}

func (as *AnalyticsService) isRedisDataEmpty(data *AnalyticsData) bool {
	return len(data.ProfileViews) == 0 && 
		   len(data.TopCountries) == 0 && 
		   len(data.TopSocials) == 0 && 
		   len(data.TopReferrers) == 0 && 
		   len(data.DeviceBreakdown) == 0
}

func (as *AnalyticsService) isAnalyticsDataEmpty(data *AnalyticsData) bool {
	return len(data.ProfileViews) == 0 && 
		   len(data.TopCountries) == 0 && 
		   len(data.TopSocials) == 0 && 
		   len(data.TopReferrers) == 0 && 
		   len(data.DeviceBreakdown) == 0
}

func (as *AnalyticsService) syncDatabaseToRedis(uid uint, days int, data *AnalyticsData) {
	log.Printf("DEBUG: Syncing database analytics to Redis for UID %d", uid)
	
	// This is a simplified sync - in production you might want more sophisticated logic
	// For now, we'll just log that we have data from database
	log.Printf("DEBUG: Database has analytics data for UID %d: %+v", uid, data)
}

func (as *AnalyticsService) CleanupOldData() {
	prefixes := []string{
		CountryViewsPrefix,
		SocialClicksPrefix,
		ReferrerViewsPrefix,
		DeviceViewsPrefix,
		ProfileViewsPrefix,
	}

	cutoffDate := time.Now().AddDate(0, 0, -DataRetentionDays)

	for _, prefix := range prefixes {
		pattern := prefix + "*"
		keys, err := as.Client.Keys(pattern).Result()
		if err != nil {
			log.Printf("Error getting keys for cleanup: %v", err)
			continue
		}

		for _, key := range keys {
			parts := strings.Split(key, ":")
			if len(parts) < 2 {
				continue
			}

			dateStr := parts[len(parts)-1]
			date, err := time.Parse("2006-01-02", dateStr)
			if err != nil {
				log.Printf("Error parsing date from key %s: %v", key, err)
				continue
			}

			if date.Before(cutoffDate) {
				_, err := as.Client.Del(key).Result()
				if err != nil {
					log.Printf("Error deleting old analytics key %s: %v", key, err)
				}
			}
		}
	}
}

// Debug function to check Redis analytics data
func (as *AnalyticsService) DebugAnalyticsData(uid uint) error {
	today := time.Now().Format("2006-01-02")
	
	// Check profile views
	viewsKey := fmt.Sprintf("%s%d:%s", ProfileViewsPrefix, uid, today)
	views, err := as.Client.Get(viewsKey).Int64()
	if err != nil && err != redis.Nil {
		return fmt.Errorf("error checking views: %w", err)
	}
	
	// Check countries
	countryKey := fmt.Sprintf("%s%d:%s", CountryViewsPrefix, uid, today)
	countries, err := as.Client.HGetAll(countryKey).Result()
	if err != nil {
		return fmt.Errorf("error checking countries: %w", err)
	}
	
	// Check devices
	deviceKey := fmt.Sprintf("%s%d:%s", DeviceViewsPrefix, uid, today)
	devices, err := as.Client.HGetAll(deviceKey).Result()
	if err != nil {
		return fmt.Errorf("error checking devices: %w", err)
	}
	
	log.Printf("DEBUG Analytics for UID %d on %s:", uid, today)
	log.Printf("  Views: %d", views)
	log.Printf("  Countries: %v", countries)
	log.Printf("  Devices: %v", devices)
	
	return nil
}

// Schedule database sync for a specific user and date
func (as *AnalyticsService) scheduleDatabaseSync(uid uint, dateStr string) {
	// Use Redis to track sync status
	syncKey := fmt.Sprintf("analytics:sync:%d:%s", uid, dateStr)
	
	// Check if already synced recently (within 5 minutes)
	lastSync, err := as.Client.Get(syncKey).Result()
	if err == nil {
		// Already synced recently, skip
		return
	}
	
	// Mark as syncing
	as.Client.Set(syncKey, time.Now().Format(time.RFC3339), 5*time.Minute)
	
	// Perform the sync
	if err := as.syncRedisToDatabase(uid, dateStr); err != nil {
		log.Printf("Error syncing analytics to database for UID %d: %v", uid, err)
	}
}

// Sync Redis analytics data to database
func (as *AnalyticsService) syncRedisToDatabase(uid uint, dateStr string) error {
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return fmt.Errorf("error parsing date: %w", err)
	}

	// Sync countries
	if err := as.syncMetricToDatabase(uid, date, "country", CountryViewsPrefix, dateStr); err != nil {
		log.Printf("Error syncing countries: %v", err)
	}

	// Sync referrers
	if err := as.syncMetricToDatabase(uid, date, "referrer", ReferrerViewsPrefix, dateStr); err != nil {
		log.Printf("Error syncing referrers: %v", err)
	}

	// Sync devices
	if err := as.syncMetricToDatabase(uid, date, "device", DeviceViewsPrefix, dateStr); err != nil {
		log.Printf("Error syncing devices: %v", err)
	}

	// Sync social clicks
	if err := as.syncMetricToDatabase(uid, date, "social", SocialClicksPrefix, dateStr); err != nil {
		log.Printf("Error syncing socials: %v", err)
	}

	// Sync profile views
	if err := as.syncViewsToDatabase(uid, date, dateStr); err != nil {
		log.Printf("Error syncing views: %v", err)
	}

	return nil
}

// Sync a specific metric from Redis to database
func (as *AnalyticsService) syncMetricToDatabase(uid uint, date time.Time, metricType string, redisPrefix string, dateStr string) error {
	redisKey := fmt.Sprintf("%s%d:%s", redisPrefix, uid, dateStr)
	
	// Get all data from Redis
	values, err := as.Client.HGetAll(redisKey).Result()
	if err != nil {
		return fmt.Errorf("error getting Redis data: %w", err)
	}

	// Sync each value to database
	for name, countStr := range values {
		count := int64(0)
		fmt.Sscanf(countStr, "%d", &count)
		
		if count > 0 {
			if err := as.upsertAnalytics(uid, date, metricType, name, count); err != nil {
				log.Printf("Error upserting analytics for %s %s: %v", metricType, name, err)
			}
		}
	}

	return nil
}

// Sync profile views from Redis to database
func (as *AnalyticsService) syncViewsToDatabase(uid uint, date time.Time, dateStr string) error {
	viewsKey := fmt.Sprintf("%s%d:%s", ProfileViewsPrefix, uid, dateStr)
	
	views, err := as.Client.Get(viewsKey).Int64()
	if err != nil && err != redis.Nil {
		return fmt.Errorf("error getting views from Redis: %w", err)
	}
	
	if views > 0 {
		if err := as.upsertAnalytics(uid, date, "view", "total", views); err != nil {
			log.Printf("Error upserting views: %v", err)
		}
	}

	return nil
}

// Upsert analytics record in database
func (as *AnalyticsService) upsertAnalytics(uid uint, date time.Time, analyticsType string, name string, count int64) error {
	var analytics models.Analytics
	
	result := as.DB.Where("user_id = ? AND date = ? AND type = ? AND name = ?", 
		uid, date.Format("2006-01-02"), analyticsType, name).First(&analytics)
	
	if result.Error != nil {
		// Create new record
		analytics = models.Analytics{
			UserID: uid,
			Date:   date,
			Type:   analyticsType,
			Name:   name,
			Count:  count,
		}
		return as.DB.Create(&analytics).Error
	} else {
		// Update existing record
		return as.DB.Model(&analytics).Update("count", count).Error
	}
}

// Get analytics from database (fallback when Redis is empty)
func (as *AnalyticsService) GetAnalyticsFromDatabase(uid uint, days int) (*AnalyticsData, error) {
	if days > DataRetentionDays {
		days = DataRetentionDays
	}

	cutoffDate := time.Now().AddDate(0, 0, -days)
	
	var analytics []models.Analytics
	err := as.DB.Where("user_id = ? AND date >= ?", uid, cutoffDate.Format("2006-01-02")).Find(&analytics).Error
	if err != nil {
		return nil, fmt.Errorf("error getting analytics from database: %w", err)
	}

	// Process analytics data
	result := &AnalyticsData{
		ProfileViews:    make(map[string]int64),
		TopCountries:    make(map[string]int64),
		TopSocials:      make(map[string]int64),
		TopReferrers:    make(map[string]int64),
		DeviceBreakdown: make(map[string]int64),
	}

	for _, a := range analytics {
		dateStr := a.Date.Format("2006-01-02")
		
		switch a.Type {
		case "view":
			result.ProfileViews[dateStr] = a.Count
		case "country":
			result.TopCountries[a.Name] += a.Count
		case "social":
			result.TopSocials[a.Name] += a.Count
		case "referrer":
			result.TopReferrers[a.Name] += a.Count
		case "device":
			result.DeviceBreakdown[a.Name] += a.Count
		}
	}

	return result, nil
}
