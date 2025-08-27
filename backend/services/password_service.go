package services

import (
	"errors"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/utils"
	"gorm.io/gorm"
)

const (
	passwordResetPrefix = "password_reset:"
	passwordResetTTL    = 10 * time.Minute
)

type PasswordService struct {
	DB           *gorm.DB
	Client       *redis.Client
	UserService  *UserService
	EmailService *EmailService
}

func NewPasswordService(db *gorm.DB, client *redis.Client, userService *UserService, emailService *EmailService) *PasswordService {
	return &PasswordService{
		DB:           db,
		Client:       client,
		UserService:  userService,
		EmailService: emailService,
	}
}

func (ps *PasswordService) InitiateReset(email string) error {
	if !utils.IsValidEmail(email) {
		return nil
	}

	user, err := ps.UserService.GetUserByEmail(email)
	if err != nil {
		return nil
	}

	token := utils.GenerateRandomString(32)

	key := fmt.Sprintf("%s%s", passwordResetPrefix, token)
	err = ps.Client.Set(key, fmt.Sprintf("%d", user.UID), passwordResetTTL).Err()
	if err != nil {
		log.Printf("Error storing password reset token in Redis: %v", err)
		return errors.New("failed to initiate password reset")
	}

	resetLink := fmt.Sprintf("%s/password-reset?token=%s", config.Origin, token)

	content := &models.EmailContent{
		To:      *user.Email,
		Subject: "Reset Your haze.bio Password",
		Body:    "password_reset",
		Data: map[string]string{
			"ResetLink": resetLink,
		},
	}

	if err := ps.EmailService.SendTemplateEmail(content); err != nil {
		log.Printf("Error sending password reset email: %v", err)
		return errors.New("failed to send password reset email")
	}

	return nil
}

func (ps *PasswordService) VerifyToken(token string) (bool, error) {
	if token == "" {
		return false, errors.New("invalid token")
	}

	key := fmt.Sprintf("%s%s", passwordResetPrefix, token)

	_, err := ps.Client.Get(key).Result()
	if err == redis.Nil {
		log.Printf("Password reset token not found or expired: %s", token)
		return false, nil
	} else if err != nil {
		log.Printf("Error checking password reset token: %v", err)
		return false, errors.New("error verifying token")
	}

	return true, nil
}

func (ps *PasswordService) ResetPassword(token string, newPassword string) error {
	if len(newPassword) < 8 {
		return errors.New("password must be at least 8 characters long")
	}

	key := fmt.Sprintf("%s%s", passwordResetPrefix, token)
	uidStr, err := ps.Client.Get(key).Result()
	if err == redis.Nil {
		log.Printf("Attempt to use invalid or expired token: %s", token)
		return errors.New("invalid or expired password reset token")
	} else if err != nil {
		log.Printf("Error retrieving password reset token: %v", err)
		return errors.New("error processing password reset")
	}

	uid, err := strconv.ParseUint(uidStr, 10, 32)
	if err != nil {
		log.Printf("Error parsing user ID from reset token: %v", err)
		return errors.New("error processing password reset")
	}

	if err := ps.UserService.UpdatePasswordWithoutCurrentPassword(uint(uid), newPassword); err != nil {
		log.Printf("Error updating password for user %d: %v", uid, err)
		return errors.New("error updating password")
	}

	if err := ps.Client.Del(key).Err(); err != nil {
		log.Printf("Error deleting used password reset token: %v", err)
	}

	return nil
}
