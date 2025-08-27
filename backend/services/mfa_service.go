package services

import (
	"fmt"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/utils"
	"gorm.io/gorm"
)

type MFAService struct {
	DB     *gorm.DB
	Client *redis.Client

	UserService *UserService
}

func NewMFAService(db *gorm.DB, client *redis.Client, userService *UserService) *MFAService {
	return &MFAService{
		DB:          db,
		Client:      client,
		UserService: userService,
	}
}

/* Generate a new MFA secret */
func (ms *MFAService) GenerateMFASecret(username string) (string, string, error) {
	secret, qrCodeURL, err := utils.GenerateMFA(username)
	if err != nil {
		return "", "", err
	}
	return secret, qrCodeURL, nil
}

/* Verify the MFA code */
func (ms *MFAService) VerifyMFA(uid uint, code string) error {
	user, err := ms.UserService.GetUserByUIDNoCache(uid)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if user.MFASecret != "" && !user.MFAEnabled {
		return fmt.Errorf("MFA is not enabled for this user")
	}

	if !utils.ValidateMFA(user.MFASecret, code) {
		return fmt.Errorf("invalid MFA code")
	}

	return nil
}

/* Enable MFA for a user */
func (ms *MFAService) EnableMFA(uid uint, secret string, code string) error {
	user, err := ms.UserService.GetUserByUIDNoCache(uid)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if !utils.ValidateMFA(secret, code) {
		return fmt.Errorf("invalid MFA code")
	}

	fields := make(map[string]interface{})
	fields["mfa_secret"] = secret
	fields["mfa_enabled"] = true

	err = ms.UserService.UpdateUserFields(user.UID, fields)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

/* Disable MFA for a user */
func (ms *MFAService) DisableMFA(uid uint) error {
	user, err := ms.UserService.GetUserByUIDNoCache(uid)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	fields := make(map[string]interface{})
	fields["mfa_secret"] = ""
	fields["mfa_enabled"] = false

	err = ms.UserService.UpdateUserFields(user.UID, fields)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}
