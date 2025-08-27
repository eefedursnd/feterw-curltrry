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
