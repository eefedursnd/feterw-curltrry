package services

import (
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/utils"
	"gorm.io/gorm"
)

type SessionService struct {
	DB     *gorm.DB
	Client *redis.Client
}

func NewSessionService(db *gorm.DB, client *redis.Client) *SessionService {
	return &SessionService{
		DB:     db,
		Client: client,
	}
}

func (ss *SessionService) CreateSession(uid uint, sessionToken string, userAgent string, ipAddress string, location string) error {
	sessionModel := &models.UserSession{
		UserID:       uid,
		SessionToken: sessionToken,
		UserAgent:    userAgent,
		IPAddress:    ipAddress,
		Location:     utils.GetCountryName(location),
		ExpiresAt:    time.Now().Add(time.Hour * 24),
	}

	if err := ss.DB.Create(&sessionModel).Error; err != nil {
		log.Println("Error creating user session:", err)
		return err
	}

	utils.ActiveSessions.Inc()

	ipKey := fmt.Sprintf("user:%d:ips", uid)
	if err := ss.Client.SAdd(ipKey, ipAddress).Err(); err != nil {
		log.Printf("Error storing user IP in Redis: %v", err)
	}

	currentIPKey := fmt.Sprintf("user:%d:current_ip", uid)
	if err := ss.Client.Set(currentIPKey, ipAddress, 0).Err(); err != nil {
		log.Printf("Error storing user current IP in Redis: %v", err)
	}

	ipToUserKey := fmt.Sprintf("ip:%s:users", ipAddress)
	if err := ss.Client.SAdd(ipToUserKey, uid).Err(); err != nil {
		log.Printf("Error storing IP to user mapping in Redis: %v", err)
	}

	return nil
}

func (ss *SessionService) DeleteSession(uid uint, sessionToken string) error {
	if err := ss.DB.Where("user_id = ? AND session_token = ?", uid, sessionToken).Delete(&models.UserSession{}).Error; err != nil {
		log.Println("Error deleting user session:", err)
		return err
	}

	utils.ActiveSessions.Dec()

	return nil
}

func (ss *SessionService) GetSession(sessionToken string) (*models.UserSession, error) {
	var session models.UserSession

	if err := ss.DB.Where("session_token = ?", sessionToken).First(&session).Error; err != nil {
		log.Println("Error getting user session:", err)
		return nil, err
	}

	return &session, nil
}

func (ss *SessionService) GetAllSessions(uid uint, currentSessionToken string) ([]models.UserSession, error) {
	var sessions []models.UserSession

	if err := ss.DB.Where("user_id = ?", uid).Order("created_at DESC").Find(&sessions).Error; err != nil {
		log.Println("Error getting user sessions:", err)
		return nil, err
	}

	for i := range sessions {
		if sessions[i].SessionToken == currentSessionToken {
			sessions[i].CurrentSession = true
		} else {
			sessions[i].CurrentSession = false
		}
	}

	return sessions, nil
}

func (ss *SessionService) LogoutAllSessions(uid uint, currentSessionToken string) error {
	if err := ss.DB.Where("user_id = ? AND session_token != ?", uid, currentSessionToken).Delete(&models.UserSession{}).Error; err != nil {
		log.Println("Error deleting user sessions:", err)
		return err
	}

	return nil
}
