package services

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/utils"
	"gorm.io/gorm"
)

type InviteService struct {
	DB     *gorm.DB
	Client *redis.Client
}

func NewInviteService(db *gorm.DB, client *redis.Client) *InviteService {
	return &InviteService{
		DB:     db,
		Client: client,
	}
}

// CreateInviteCode creates a new invite code
func (is *InviteService) CreateInviteCode(createdBy uint, maxUses int, expiresInHours int) (*models.InviteCode, error) {
	code := utils.GenerateRandomString(8) // 8 character code

	// Ensure code is unique
	for {
		var existingCode models.InviteCode
		if err := is.DB.Where("code = ?", code).First(&existingCode).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				break // Code is unique
			}
			return nil, fmt.Errorf("error checking code uniqueness: %w", err)
		}
		code = utils.GenerateRandomString(8) // Generate new code if duplicate
	}

	var expiresAt *time.Time
	if expiresInHours > 0 {
		expiration := time.Now().Add(time.Duration(expiresInHours) * time.Hour)
		expiresAt = &expiration
	}

	inviteCode := &models.InviteCode{
		Code:      code,
		CreatedBy: createdBy,
		MaxUses:   maxUses,
		ExpiresAt: expiresAt,
	}

	if err := is.DB.Create(inviteCode).Error; err != nil {
		return nil, fmt.Errorf("error creating invite code: %w", err)
	}

	log.Printf("Created invite code: %s by user: %d", code, createdBy)
	return inviteCode, nil
}

// ValidateInviteCode validates an invite code
func (is *InviteService) ValidateInviteCode(code string) (*models.InviteCode, error) {
	var inviteCode models.InviteCode
	if err := is.DB.Where("code = ?", code).First(&inviteCode).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid invite code")
		}
		return nil, fmt.Errorf("error validating invite code: %w", err)
	}

	if !inviteCode.IsValid() {
		return nil, errors.New("invite code is expired or has reached maximum uses")
	}

	return &inviteCode, nil
}

// UseInviteCode marks an invite code as used
func (is *InviteService) UseInviteCode(code string, userID uint) error {
	inviteCode, err := is.ValidateInviteCode(code)
	if err != nil {
		return err
	}

	inviteCode.Use(userID)

	if err := is.DB.Save(inviteCode).Error; err != nil {
		return fmt.Errorf("error updating invite code usage: %w", err)
	}

	log.Printf("Invite code %s used by user: %d", code, userID)
	return nil
}

// GetInviteCodesByCreator gets all invite codes created by a user
func (is *InviteService) GetInviteCodesByCreator(creatorID uint) ([]models.InviteCode, error) {
	var codes []models.InviteCode
	if err := is.DB.Where("created_by = ?", creatorID).Order("created_at DESC").Find(&codes).Error; err != nil {
		return nil, fmt.Errorf("error getting invite codes: %w", err)
	}
	return codes, nil
}

// GetInviteCodeStats gets statistics about invite codes
func (is *InviteService) GetInviteCodeStats() (map[string]interface{}, error) {
	var totalCodes int64
	var usedCodes int64
	var expiredCodes int64

	if err := is.DB.Model(&models.InviteCode{}).Count(&totalCodes).Error; err != nil {
		return nil, err
	}

	if err := is.DB.Model(&models.InviteCode{}).Where("current_uses > 0").Count(&usedCodes).Error; err != nil {
		return nil, err
	}

	if err := is.DB.Model(&models.InviteCode{}).Where("expires_at < ?", time.Now()).Count(&expiredCodes).Error; err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"total_codes":   totalCodes,
		"used_codes":    usedCodes,
		"expired_codes": expiredCodes,
	}, nil
}

// DeleteInviteCode deletes an invite code
func (is *InviteService) DeleteInviteCode(codeID uint, creatorID uint) error {
	var inviteCode models.InviteCode
	if err := is.DB.Where("id = ? AND created_by = ?", codeID, creatorID).First(&inviteCode).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invite code not found or you don't have permission to delete it")
		}
		return err
	}

	if err := is.DB.Delete(&inviteCode).Error; err != nil {
		return fmt.Errorf("error deleting invite code: %w", err)
	}

	log.Printf("Deleted invite code: %s by user: %d", inviteCode.Code, creatorID)
	return nil
}
