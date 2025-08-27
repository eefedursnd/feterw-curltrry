package services

import (
	"errors"
	"log"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/utils"
	"gorm.io/gorm"
)

type BadgeService struct {
	DB          *gorm.DB
	Client      *redis.Client
	UserService *UserService
}

func NewBadgeService(db *gorm.DB, client *redis.Client) *BadgeService {
	return &BadgeService{
		DB:          db,
		Client:      client,
		UserService: &UserService{DB: db, Client: client},
	}
}

type BadgeOrderUpdate struct {
	BadgeID uint `json:"badge_id"`
	Order   int  `json:"order"`
}

/* Create a new badge (for default badges) */
func (b *BadgeService) CreateBadge(badge *models.Badge) error {
	if err := b.DB.Create(badge).Error; err != nil {
		log.Println("Error creating badge:", err)
		return err
	}
	return nil
}

/* Edit Custom Badge name or mediaURL */
func (b *BadgeService) EditCustomBadge(uid uint, badgeID uint, newName, newMediaURL string) error {
	var badge models.Badge
	if err := b.DB.Where("id = ?", badgeID).First(&badge).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("Badge with id '%d' not found", badgeID)
			return errors.New("badge not found")
		}
		log.Println("Error retrieving badge:", err)
		return err
	}

	if !badge.IsCustom {
		return errors.New("badge is not a custom badge")
	}

	if newName != "" && newName != badge.Name {
		if utils.ContainsHTML(newName) {
			return errors.New("badge name cannot contain HTML")
		}

		var existingBadge models.Badge
		if err := b.DB.Where("LOWER(name) = ?", utils.ToLowerCase(newName)).First(&existingBadge).Error; err == nil {
			return errors.New("badge name already exists")
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Println("Error checking if badge exists:", err)
			return err
		}

		badge.Name = newName
	}

	if newMediaURL != "" && newMediaURL != badge.MediaURL {
		badge.MediaURL = newMediaURL
	}

	if err := b.DB.Where("id = ?", badgeID).Updates(&badge).Error; err != nil {
		log.Println("Error updating badge:", err)
		return err
	}

	if err := b.UserService.UseBadgeEditCredits(uid); err != nil {
		log.Println("Error using badge edit credits:", err)
		return err
	}

	return nil
}

/* Create a custom badge for a user */
func (b *BadgeService) CreateCustomBadge(uid uint, name string, mediaURL string) error {
	var existingBadge models.Badge
	if err := b.DB.Where("name = ?", name).First(&existingBadge).Error; err == nil {
		log.Printf("Badge with name %s already exists: %v", name, err)
		return errors.New("badge already exists")
	} else if err != gorm.ErrRecordNotFound {
		log.Println("Error checking for existing badge:", err)
		return err
	}

	badge := &models.Badge{
		Name:     name,
		MediaURL: mediaURL,
		IsCustom: true,
	}

	if err := b.DB.Create(&badge).Error; err != nil {
		log.Println("Error creating custom badge:", err)
		return err
	}

	err := b.AssignBadge(uid, name)
	if err != nil {
		log.Printf("Error assigning badge: %v", err)
		return err
	}

	err = b.HideUserBadge(uid, badge.ID, true)
	if err != nil {
		log.Printf("Error hiding badge: %v", err)
		return err
	}

	return nil
}

/* Assign a badge to a user */
func (b *BadgeService) AssignBadge(uid uint, badgeName string) error {
	var badge models.Badge
	if err := b.DB.Where("name = ?", badgeName).First(&badge).Error; err != nil {
		log.Printf("Badge with name %s not found: %v", badgeName, err)
		return errors.New("badge not found")
	}

	var existingUserBadge models.UserBadge
	if err := b.DB.Where("uid = ? AND badge_id = ?", uid, badge.ID).First(&existingUserBadge).Error; err == nil {
		log.Printf("User %d already has the badge %d", uid, badge.ID)
		return nil
	} else if err != gorm.ErrRecordNotFound {
		log.Printf("Error checking existing user badge: %v", err)
		return err
	}

	userBadge := &models.UserBadge{
		UID:     uid,
		BadgeID: badge.ID,
	}

	log.Println("Assigning badge to user:", userBadge)

	if err := b.DB.Create(userBadge).Error; err != nil {
		log.Println("Error assigning badge to user:", err)
		return err
	}

	return nil
}

/* Remove a badge from a user */
func (b *BadgeService) RemoveBadge(uid uint, badgeName string) error {
	var badge models.Badge
	if err := b.DB.Where("name = ?", badgeName).First(&badge).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("Badge with name %s not found", badgeName)
			return errors.New("badge not found")
		}
		log.Println("Error checking if badge exists:", err)
		return err
	}

	var userBadge models.UserBadge
	if err := b.DB.Where("uid = ? AND badge_id = ?", uid, badge.ID).First(&userBadge).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("User %d does not have badge %s", uid, badgeName)
			return errors.New("user does not have this badge")
		}
		log.Println("Error checking if user has badge:", err)
		return err
	}

	if err := b.DB.Where("uid = ? AND badge_id = ?", uid, badge.ID).Delete(&models.UserBadge{}).Error; err != nil {
		log.Println("Error removing badge from user:", err)
		return err
	}

	return nil
}

/* Delete a badge */
func (b *BadgeService) DeleteBadge(badgeName string) error {
	var badge models.Badge
	if err := b.DB.Where("name = ?", badgeName).First(&badge).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("Badge with name %s not found", badgeName)
			return errors.New("badge not found")
		}
		log.Println("Error checking if badge exists:", err)
		return err
	}

	if err := b.DB.Where("name = ?", badgeName).Delete(&models.Badge{}).Error; err != nil {
		log.Println("Error deleting badge:", err)
		return err
	}

	if err := b.DB.Where("badge_id = ?", badge.ID).Delete(&models.UserBadge{}).Error; err != nil {
		log.Println("Error deleting user badges for badge:", err)
		return err
	}

	return nil
}

/* Get all badges */
func (b *BadgeService) GetBadges() ([]*models.Badge, error) {
	badges := []*models.Badge{}
	err := b.DB.Find(&badges).Error
	if err != nil {
		log.Println("Error getting badges:", err)
		return nil, err
	}
	return badges, nil
}

func (b *BadgeService) GetBadge(name string) (*models.Badge, error) {
	badge := &models.Badge{}
	err := b.DB.Where("name = ?", name).First(badge).Error
	if err != nil {
		log.Println("Error getting badge:", err)
		return nil, err
	}
	return badge, nil
}

/* Get all badges for a user */
func (b *BadgeService) GetUserBadges(uid uint) ([]*models.UserBadge, error) {
	var userBadges []*models.UserBadge

	err := b.DB.Where("uid = ?", uid).Preload("Badge").Find(&userBadges).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []*models.UserBadge{}, nil
		}
		log.Println("Error getting user badges:", err)
		return nil, err
	}

	return userBadges, nil
}

/* Reorder user badges */
func (b *BadgeService) ReorderUserBadges(uid uint, updates []BadgeOrderUpdate) error {
	tx := b.DB.Begin()
	for _, update := range updates {
		err := tx.Model(&models.UserBadge{}).
			Select("*").
			Where("uid = ? AND badge_id = ?", uid, update.BadgeID).
			Update("sort", update.Order).Error
		if err != nil {
			tx.Rollback()
			log.Println("Error updating user badge sort:", err)
			return err
		}
	}

	tx.Commit()
	return nil
}

/* Hide user badge */
func (b *BadgeService) HideUserBadge(uid uint, badgeID uint, hidden bool) error {
	userBadge := &models.UserBadge{}
	err := b.DB.Where("uid = ? AND badge_id = ?", uid, badgeID).First(userBadge).Error
	if err != nil {
		log.Printf("Error fetching user badge for UID %d and badge %d: %v", uid, badgeID, err)
		return err
	}

	userBadge.Hidden = hidden
	err = b.DB.Model(userBadge).Update("hidden", hidden).Error
	if err != nil {
		log.Printf("Error updating hidden status for badge %d: %v", badgeID, err)
		return err
	}

	return nil
}
