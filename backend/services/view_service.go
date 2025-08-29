package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"gorm.io/gorm"
)

type ViewService struct {
	DB               *gorm.DB
	Client           *redis.Client
	ProfileService   *ProfileService
	AnalyticsService *AnalyticsService
}

type IPValidationResponse struct {
	Status  string `json:"status"`
	Proxy   bool   `json:"proxy"`
	Hosting bool   `json:"hosting"`
}

func NewViewService(db *gorm.DB, client *redis.Client, profileService *ProfileService, analyticsService *AnalyticsService) *ViewService {
	return &ViewService{
		DB:               db,
		Client:           client,
		ProfileService:   profileService,
		AnalyticsService: analyticsService,
	}
}

func (vs *ViewService) initializeViewData() []map[string]interface{} {
	viewData := make([]map[string]interface{}, 0)
	timeStops := []int{18, 20, 22, 0, 2, 4, 6} // 6pm, 8pm, 10pm, 12am, 2am, 4am, 6am

	for _, hour := range timeStops {
		currentTime := time.Date(0, 1, 1, hour, 0, 0, 0, time.UTC)
		timeStr := currentTime.Format("3pm")

		viewData = append(viewData, map[string]interface{}{
			"time":  timeStr,
			"views": 0,
		})
	}
	return viewData
}

func (vs *ViewService) GetViewsData(uid uint) (models.View, error) {
	var view models.View
	err := vs.DB.Where("user_id = ?", uid).First(&view).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			initialViewData := vs.initializeViewData()
			jsonData, err := json.Marshal(initialViewData)
			if err != nil {
				return models.View{}, fmt.Errorf("failed to marshal initial view data: %w", err)
			}

			view.UserID = uid
			view.ViewsData = string(jsonData)

			if err := vs.DB.Create(&view).Error; err != nil {
				return models.View{}, fmt.Errorf("failed to save initial view data to database: %w", err)
			}
			return view, nil

		}
		return models.View{}, err
	}

	return view, nil
}

func (vs *ViewService) IncrementViewCount(uid uint, sessionID string, headers map[string]string, ip string) error {
	isInvalidIP, err := vs.isProxyOrHostingIP(ip)
	if err != nil {
		log.Printf("Warning: Failed to check if IP is proxy/hosting: %v", err)
		return errors.New("failed to check IP")
	}

	if isInvalidIP {
		log.Printf("Skipping view count for user %d: IP %s is proxy or hosting", uid, sessionID)
		return nil
	}

	cacheKey := fmt.Sprintf("view:%d:%s", uid, sessionID)

	exists, err := vs.Client.Exists(cacheKey).Result()
	if err != nil {
		return fmt.Errorf("failed to check cache: %w", err)
	}

	if exists == 1 {
		return nil
	}

	ipRateLimitKey := fmt.Sprintf("ratelimit:%s", sessionID)
	viewCount, err := vs.Client.Get(ipRateLimitKey).Int()
	if err != nil && err != redis.Nil {
		return fmt.Errorf("failed to check rate limit: %w", err)
	}

	const rateLimit = 10
	if viewCount >= rateLimit {
		return fmt.Errorf("rate limit exceeded")
	}

	_, err = vs.Client.Incr(ipRateLimitKey).Result()
	if err != nil {
		return fmt.Errorf("failed to increment rate limit: %w", err)
	}
	if viewCount == 0 {
		vs.Client.Expire(ipRateLimitKey, 10*time.Minute)
	}

	uidIPKey := fmt.Sprintf("uid_ip_ratelimit:%d", uid)
	ipExists, err := vs.Client.SIsMember(uidIPKey, sessionID).Result()
	if err != nil {
		return fmt.Errorf("failed to check IP in UID rate limit: %w", err)
	}

	const ipRateLimit = 10
	if !ipExists {
		cardinality, err := vs.Client.SCard(uidIPKey).Result()
		if err != nil {
			return fmt.Errorf("failed to get cardinality of IP set: %w", err)
		}

		if cardinality >= ipRateLimit {
			return fmt.Errorf("IP rate limit exceeded for UID %d", uid)
		}

		pipe := vs.Client.Pipeline()
		pipe.SAdd(uidIPKey, sessionID)
		pipe.Expire(uidIPKey, 5*time.Minute)
		_, err = pipe.Exec()

		if err != nil {
			return fmt.Errorf("failed to add IP to UID rate limit: %w", err)
		}
	}

	var view models.View
	viewsDataStr, err := vs.GetViewsData(uid)
	if err != nil {
		return err
	}

	var viewsData []map[string]interface{}
	if err := json.Unmarshal([]byte(viewsDataStr.ViewsData), &viewsData); err != nil {
		return fmt.Errorf("failed to unmarshal views data: %w", err)
	}

	now := time.Now()
	hour := now.Hour()
	timeSlotIndex := -1
	for i := 18; i <= 24; i += 2 {
		if hour >= i || hour < 6 {
			timeSlotIndex = (i - 18) / 2
			break
		}
	}
	if hour >= 0 && hour < 4 {
		timeSlotIndex = (hour + 6) / 2
	}

	if timeSlotIndex != -1 && timeSlotIndex < len(viewsData) {
		timeSlot := viewsData[timeSlotIndex]
		views, ok := timeSlot["views"].(float64)
		if ok {
			timeSlot["views"] = views + 1
		} else {
			timeSlot["views"] = 1
		}
		viewsData[timeSlotIndex] = timeSlot
	}

	updatedViewsData, err := json.Marshal(viewsData)
	if err != nil {
		return fmt.Errorf("failed to marshal updated views data: %w", err)
	}

	result := vs.DB.Model(&view).Where("user_id = ?", uid).Update("views_data", string(updatedViewsData))
	if result.Error != nil {
		return result.Error
	}

	if err := vs.ProfileService.AddViewsToProfile(uid, 1); err != nil {
		return err
	}

	err = vs.Client.Set(cacheKey, true, 0).Err()
	if err != nil {
		return fmt.Errorf("failed to set cache: %w", err)
	}

	country := headers["CF-IPCountry"]
	referrer := headers["Referer"]
	userAgent := headers["User-Agent"]
	device := detectDeviceType(userAgent)

	if vs.AnalyticsService != nil {
		log.Printf("DEBUG: Tracking analytics for UID %d - Country: %s, Referrer: %s, Device: %s", uid, country, referrer, device)
		err = vs.AnalyticsService.TrackProfileView(uid, country, referrer, device)
		if err != nil {
			log.Printf("Error tracking analytics: %v", err)
		} else {
			log.Printf("DEBUG: Analytics tracking successful for UID %d", uid)
		}
	} else {
		log.Printf("DEBUG: AnalyticsService is nil for UID %d", uid)
	}

	log.Println("Incremented view count for user:", uid)
	return nil
}

func (vs *ViewService) isProxyOrHostingIP(ip string) (bool, error) {
	cacheKey := fmt.Sprintf("ip:check:%s", ip)

	cachedResult, err := vs.Client.Get(cacheKey).Result()
	if err == nil {
		return cachedResult == "true", nil
	} else if err != redis.Nil {
		return false, fmt.Errorf("failed to check IP cache: %w", err)
	}

	url := fmt.Sprintf("http://ip-api.com/json/%s?fields=status,message,proxy,hosting", ip)

	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	resp, err := client.Get(url)
	if err != nil {
		return false, fmt.Errorf("failed to query IP validation API: %w", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return false, fmt.Errorf("failed to read IP validation response: %w", err)
	}

	var result IPValidationResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return false, fmt.Errorf("failed to parse IP validation response: %w", err)
	}

	log.Println("IP validation response:", result)

	isInvalid := result.Status == "success" && (result.Proxy || result.Hosting)

	if err := vs.Client.Set(cacheKey, fmt.Sprintf("%t", isInvalid), time.Hour).Err(); err != nil {
		log.Printf("Warning: Failed to cache IP validation result: %v", err)
	}

	return isInvalid, nil
}

func detectDeviceType(userAgent string) string {
	userAgent = strings.ToLower(userAgent)

	if strings.Contains(userAgent, "mobile") ||
		strings.Contains(userAgent, "android") ||
		strings.Contains(userAgent, "iphone") {
		return "mobile"
	} else if strings.Contains(userAgent, "tablet") ||
		strings.Contains(userAgent, "ipad") {
		return "tablet"
	} else {
		return "desktop"
	}
}
