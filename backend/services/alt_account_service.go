package services

import (
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"gorm.io/gorm"
)

type AltAccountService struct {
	DB           *gorm.DB
	Client       *redis.Client
	EmailService *EmailService
	EventService *EventService
	UserService  *UserService
}

func NewAltAccountService(db *gorm.DB, client *redis.Client, eventService *EventService) *AltAccountService {
	service := &AltAccountService{
		DB:           db,
		Client:       client,
		EventService: eventService,
	}

	userService := &UserService{
		DB:     db,
		Client: client,
	}

	service.UserService = userService

	return service
}

func (s *AltAccountService) CheckForAltAccount(newUser *models.User, ipAddress string) error {
	ipKey := fmt.Sprintf("user:%d:ips", newUser.UID)
	if err := s.Client.SAdd(ipKey, ipAddress).Err(); err != nil {
		log.Printf("Error storing new user IP in Redis: %v", err)
	}

	currentIPKey := fmt.Sprintf("user:%d:current_ip", newUser.UID)
	if err := s.Client.Set(currentIPKey, ipAddress, 0).Err(); err != nil {
		log.Printf("Error storing new user current IP in Redis: %v", err)
	}

	ipToUserKey := fmt.Sprintf("ip:%s:users", ipAddress)
	if err := s.Client.SAdd(ipToUserKey, newUser.UID).Err(); err != nil {
		log.Printf("Error storing IP to user mapping in Redis: %v", err)
	}

	userIDs, err := s.Client.SMembers(ipToUserKey).Result()
	if err != nil {
		log.Printf("Error getting users with IP %s: %v", ipAddress, err)
		return err
	}

	var uidList []uint
	for _, uidStr := range userIDs {
		var uid uint
		fmt.Sscanf(uidStr, "%d", &uid)
		if uid > 0 && uid != newUser.UID {
			uidList = append(uidList, uid)
		}
	}

	if len(uidList) == 0 {
		return nil
	}

	var potentialAlts []models.User
	if err := s.DB.Where("uid IN ?", uidList).Find(&potentialAlts).Error; err != nil {
		log.Printf("Error finding potential alt accounts: %v", err)
		return err
	}

	if len(potentialAlts) > 0 {
		return s.NotifyAltAccount(newUser, potentialAlts, ipAddress, true)
	}

	return nil
}

func (s *AltAccountService) CheckForAltAccountOnLogin(user *models.User, ipAddress string) error {
	ipKey := fmt.Sprintf("user:%d:ips", user.UID)
	if err := s.Client.SAdd(ipKey, ipAddress).Err(); err != nil {
		log.Printf("Error storing user IP in Redis: %v", err)
	}

	currentIPKey := fmt.Sprintf("user:%d:current_ip", user.UID)

	oldIP, err := s.Client.Get(currentIPKey).Result()
	isNewIP := err == redis.Nil || (err == nil && oldIP != ipAddress)

	if err := s.Client.Set(currentIPKey, ipAddress, 0).Err(); err != nil {
		log.Printf("Error updating user current IP in Redis: %v", err)
	}

	ipToUserKey := fmt.Sprintf("ip:%s:users", ipAddress)
	if err := s.Client.SAdd(ipToUserKey, user.UID).Err(); err != nil {
		log.Printf("Error storing IP to user mapping in Redis: %v", err)
	}

	if !isNewIP {
		return nil
	}

	userIDs, err := s.Client.SMembers(ipToUserKey).Result()
	if err != nil {
		log.Printf("Error getting users with IP %s: %v", ipAddress, err)
		return err
	}

	var uidList []uint
	for _, uidStr := range userIDs {
		var uid uint
		fmt.Sscanf(uidStr, "%d", &uid)
		if uid > 0 && uid != user.UID {
			uidList = append(uidList, uid)
		}
	}

	if len(uidList) == 0 {
		return nil
	}

	alreadyNotified := true
	for _, uid := range uidList {
		key := fmt.Sprintf("alt_account:%d:%d", user.UID, uid)
		exists, err := s.Client.Exists(key).Result()
		if err != nil || exists == 0 {
			alreadyNotified = false
			break
		}
	}

	if alreadyNotified {
		return nil
	}

	var potentialAlts []models.User
	if err := s.DB.Where("uid IN ?", uidList).Find(&potentialAlts).Error; err != nil {
		log.Printf("Error finding potential alt accounts: %v", err)
		return err
	}

	if len(potentialAlts) > 0 {
		log.Printf("Found potential alt accounts for login: %v for user %s (UID: %d) with IP %s",
			uidList, user.Username, user.UID, ipAddress)
		return s.NotifyAltAccount(user, potentialAlts, ipAddress, false)
	}

	return nil
}

func (s *AltAccountService) NotifyAltAccount(user *models.User, potentialAlts []models.User, ipAddress string, isNewRegistration bool) error {
	potentialAltUsernames := make([]string, 0, len(potentialAlts))
	potentialAltUIDs := make([]uint, 0, len(potentialAlts))

	for _, altUser := range potentialAlts {
		potentialAltUsernames = append(potentialAltUsernames, altUser.Username)
		potentialAltUIDs = append(potentialAltUIDs, altUser.UID)

		keyNew := fmt.Sprintf("alt_account:%d:%d", user.UID, altUser.UID)
		keyAlt := fmt.Sprintf("alt_account:%d:%d", altUser.UID, user.UID)

		s.Client.Set(keyNew, time.Now().Format(time.RFC3339), 0)
		s.Client.Set(keyAlt, time.Now().Format(time.RFC3339), 0)

		setKeyNew := fmt.Sprintf("alt_accounts:%d", user.UID)
		setKeyAlt := fmt.Sprintf("alt_accounts:%d", altUser.UID)

		s.Client.SAdd(setKeyNew, altUser.UID)
		s.Client.SAdd(setKeyAlt, user.UID)
	}

	log.Printf("Potential alt account detected: User %s (UID: %d) shares IP %s with existing users %v (UIDs: %v)",
		user.Username, user.UID, ipAddress, potentialAltUsernames, potentialAltUIDs)

	if s.EventService != nil {
		altAccountInstances := make([]models.AltAccountInstance, 0, len(potentialAlts))
		for _, alt := range potentialAlts {
			instance := models.AltAccountInstance{
				UID:         alt.UID,
				Username:    alt.Username,
				MatchReason: "ip_match",
			}
			altAccountInstances = append(altAccountInstances, instance)
		}

		confidence := 0.5
		if len(potentialAlts) > 3 {
			confidence = 0.9
		} else if len(potentialAlts) > 1 {
			confidence = 0.7
		}

		detectionSource := "login"
		if isNewRegistration {
			detectionSource = "registration"
			confidence += 0.1
		}

		altData := models.AltAccountData{
			UID:             user.UID,
			Username:        user.Username,
			IPAddress:       ipAddress,
			AltAccounts:     altAccountInstances,
			DetectionSource: detectionSource,
			DetectionTime:   time.Now(),
			Confidence:      confidence,
			Notes:           fmt.Sprintf("Detected during %s with shared IP address", detectionSource),
		}

		_, err := s.EventService.Publish(models.EventAltAccountDetected, altData)
		if err != nil {
			log.Printf("Error publishing alt account event: %v", err)
		}
	}

	return nil
}

func (s *AltAccountService) GetAltAccounts(uid uint) ([]models.User, error) {
	var altAccounts []models.User

	setKey := fmt.Sprintf("alt_accounts:%d", uid)
	altUIDs, err := s.Client.SMembers(setKey).Result()
	if err != nil {
		return altAccounts, nil
	}

	if len(altUIDs) == 0 {
		return altAccounts, nil
	}

	var uintUIDs []uint
	for _, strUID := range altUIDs {
		var intUID uint
		fmt.Sscanf(strUID, "%d", &intUID)
		if intUID > 0 {
			uintUIDs = append(uintUIDs, intUID)
		}
	}

	if err := s.DB.Where("uid IN ?", uintUIDs).Find(&altAccounts).Error; err != nil {
		log.Printf("Error finding alt accounts for user %d: %v", uid, err)
		return nil, err
	}

	return altAccounts, nil
}

func (s *AltAccountService) CheckEmailForAltAccounts(user *models.User) error {
	if user.Email == nil || *user.Email == "" {
		return nil
	}

	var existingUsers []models.User
	if err := s.DB.Where("email = ? AND uid != ?", *user.Email, user.UID).Find(&existingUsers).Error; err != nil {
		log.Printf("Error checking for email alt accounts: %v", err)
		return err
	}

	if len(existingUsers) == 0 {
		return nil
	}

	altAccountInstances := make([]models.AltAccountInstance, 0, len(existingUsers))
	for _, alt := range existingUsers {
		instance := models.AltAccountInstance{
			UID:         alt.UID,
			Username:    alt.Username,
			MatchReason: "email_match",
		}
		altAccountInstances = append(altAccountInstances, instance)
	}

	if s.EventService != nil {
		altData := models.AltAccountData{
			UID:             user.UID,
			Username:        user.Username,
			AltAccounts:     altAccountInstances,
			DetectionSource: "email_verification",
			DetectionTime:   time.Now(),
			Confidence:      0.95,
			Notes:           "Multiple accounts sharing the same email address",
		}

		_, err := s.EventService.Publish(models.EventAltAccountDetected, altData)
		if err != nil {
			log.Printf("Error publishing alt account email event: %v", err)
		}
	}

	for _, alt := range existingUsers {
		keyNew := fmt.Sprintf("alt_account:%d:%d", user.UID, alt.UID)
		keyAlt := fmt.Sprintf("alt_account:%d:%d", alt.UID, user.UID)

		s.Client.Set(keyNew, time.Now().Format(time.RFC3339), 0)
		s.Client.Set(keyAlt, time.Now().Format(time.RFC3339), 0)

		setKeyNew := fmt.Sprintf("alt_accounts:%d", user.UID)
		setKeyAlt := fmt.Sprintf("alt_accounts:%d", alt.UID)

		s.Client.SAdd(setKeyNew, alt.UID)
		s.Client.SAdd(setKeyAlt, user.UID)
	}

	return nil
}
