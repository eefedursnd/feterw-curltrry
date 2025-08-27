package services

import (
	"errors"
	"fmt"
	"log"
	"net/url"
	"strings"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"gorm.io/gorm"
)

type SocialService struct {
	DB          *gorm.DB
	Client      *redis.Client
	UserService *UserService
}

func NewSocialService(db *gorm.DB, client *redis.Client) *SocialService {
	return &SocialService{
		DB:          db,
		Client:      client,
		UserService: &UserService{DB: db, Client: client},
	}
}

type SocialOrderUpdate struct {
	ID    uint `json:"id"`
	Order int  `json:"order"`
}

/* Create a new social link */
func (s *SocialService) CreateUserSocial(social *models.UserSocial) error {
	socialsMap := models.GetSocials()

	socialInfo, ok := socialsMap[social.Platform]
	if !ok || !socialInfo.Usable {
		return fmt.Errorf("social platform %s is not usable", social.Platform)
	}

	var count int64
	if social.Platform == "custom" {
		s.DB.Model(&models.UserSocial{}).Where("uid = ? AND platform = ?", social.UID, social.Platform).Count(&count)
		if count >= 5 {
			return errors.New("custom social limit reached")
		}
	} else {
		s.DB.Model(&models.UserSocial{}).Where("uid = ? AND platform = ?", social.UID, social.Platform).Count(&count)
		if count >= 2 {
			return errors.New("social limit reached for this platform")
		}

		if social.SocialType != models.SocialTypeCopyLink {
			if social.SocialType == models.SocialTypeCopyLink && (strings.HasPrefix(social.Link, "http://") || strings.HasPrefix(social.Link, "https://")) {
				return fmt.Errorf("copy text links should not include http:// or https:// prefixes")
			}

			parsedURL, err := url.ParseRequestURI(social.Link)
			if err != nil {
				return fmt.Errorf("invalid social link: %w", err)
			}

			baseURL, err := url.ParseRequestURI(socialInfo.URL)
			if err != nil {
				return fmt.Errorf("invalid base URL for social platform %s: %w", social.Platform, err)
			}

			if parsedURL.Scheme != baseURL.Scheme || parsedURL.Host != baseURL.Host {
				return fmt.Errorf("social link domain does not match the expected domain for %s", social.Platform)
			}
		}
	}

	if err := s.DB.Create(social).Error; err != nil {
		log.Println("Error creating user social:", err)
		return err
	}

	return nil
}

/* Get all social links for a user */
func (s *SocialService) GetUserSocials(uid uint) ([]*models.UserSocial, error) {
	socials := []*models.UserSocial{}

	err := s.DB.Where("uid = ?", uid).Order("sort ASC").Find(&socials).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []*models.UserSocial{}, nil
		}
		log.Println("Error getting user socials:", err)
		return nil, err
	}

	return socials, nil
}

/* Update a social link */
func (s *SocialService) UpdateUserSocial(social *models.UserSocial) error {
	var originalSocial models.UserSocial
	if err := s.DB.Where("id = ? AND uid = ?", social.ID, social.UID).First(&originalSocial).Error; err != nil {
		return err
	}

	err := s.DB.Model(social).Where("uid = ? AND id = ?", social.UID, social.ID).Omit("platform").Select("*").Updates(social).Error
	if err != nil {
		return err
	}

	return nil
}

/* Delete a social link */
func (s *SocialService) DeleteUserSocial(uid uint, socialID uint) error {
	if err := s.DB.Where("uid = ? AND id = ?", uid, socialID).Delete(&models.UserSocial{}).Error; err != nil {
		return err
	}

	return nil
}

/* Reorder social links */
func (s *SocialService) ReorderUserSocials(uid uint, updates []SocialOrderUpdate) error {
	tx := s.DB.Begin()
	for _, update := range updates {
		err := tx.Model(&models.UserSocial{}).
			Where("uid = ? AND id = ?", uid, update.ID).
			Update("sort", update.Order).Error
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	tx.Commit()
	return nil
}
