package services

import (
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/smtp"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/utils"
	"github.com/jordan-wright/email"
	"gorm.io/gorm"
)

type EmailService struct {
	DB                *gorm.DB
	Client            *redis.Client
	UserService       *UserService
	EventService      *EventService
	AltAccountService *AltAccountService
}

const (
	emailVerificationPrefix = "email_verification:"
	verificationCodeLength  = 6
	verificationCodeTTL     = 10 * time.Minute

	registrationPrefix = "registration:"
	registrationTTL    = 24 * time.Hour

	// Rate limiting constants
	emailRateLimitPrefix          = "ratelimit:email:"
	registrationRateLimitPrefix   = "ratelimit:registration:"
	ipEmailLimit                  = 10        // Maximum emails per IP per hour
	ipRegistrationLimit           = 3         // Maximum registrations per IP per hour
	emailRateLimitDuration        = time.Hour // Reset email rate limit after 1 hour
	registrationRateLimitDuration = time.Hour // Reset registration rate limit after 1 hour
)

type PendingRegistration struct {
	Email     string `json:"email"`
	Username  string `json:"username"`
	Password  string `json:"password"`
	Token     string `json:"token"`
	CreatedAt int64  `json:"created_at"`
	ExpiresAt int64  `json:"expires_at"`
}

func NewEmailService(db *gorm.DB, client *redis.Client, eventService *EventService) *EmailService {
	service := &EmailService{
		DB:           db,
		Client:       client,
		EventService: eventService,
	}

	userService := &UserService{
		DB:     db,
		Client: client,
	}

	altAccountService := &AltAccountService{
		DB:     db,
		Client: client,
	}

	service.UserService = userService
	service.AltAccountService = altAccountService

	return service
}

func (s *EmailService) CheckEmailRateLimit(ipAddress string) error {
	key := fmt.Sprintf("%s%s", emailRateLimitPrefix, ipAddress)

	count, err := s.Client.Get(key).Int64()
	if err != nil && err != redis.Nil {
		log.Printf("Error checking email rate limit: %v", err)
		return nil
	}

	if err == redis.Nil {
		if err := s.Client.Set(key, 1, emailRateLimitDuration).Err(); err != nil {
			log.Printf("Error setting email rate limit: %v", err)
		}
		return nil
	}

	if count >= ipEmailLimit {
		return errors.New("email rate limit exceeded, please try again later")
	}

	if err := s.Client.Incr(key).Err(); err != nil {
		log.Printf("Error incrementing email rate limit counter: %v", err)
	}

	s.Client.Expire(key, emailRateLimitDuration)

	return nil
}

func (s *EmailService) CheckRegistrationRateLimit(ipAddress string) error {
	key := fmt.Sprintf("%s%s", registrationRateLimitPrefix, ipAddress)

	count, err := s.Client.Get(key).Int64()
	if err != nil && err != redis.Nil {
		log.Printf("Error checking registration rate limit: %v", err)
		return nil
	}

	if err == redis.Nil {
		if err := s.Client.Set(key, 1, registrationRateLimitDuration).Err(); err != nil {
			log.Printf("Error setting registration rate limit: %v", err)
		}
		return nil
	}

	if count >= ipRegistrationLimit {
		return errors.New("registration rate limit exceeded, please try again later")
	}

	if err := s.Client.Incr(key).Err(); err != nil {
		log.Printf("Error incrementing registration rate limit counter: %v", err)
	}

	s.Client.Expire(key, registrationRateLimitDuration)

	return nil
}

func (s *EmailService) SendVerificationEmail(userID uint, newEmail string, ipAddress string) error {
	if err := s.CheckEmailRateLimit(ipAddress); err != nil {
		return err
	}

	_, err := s.UserService.GetUserByUID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	if !utils.IsValidEmail(newEmail) {
		return errors.New("invalid email address")
	}

	existingUser, err := s.UserService.GetUserByEmail(newEmail)
	if err == nil && existingUser.UID != userID {
		return errors.New("email address already in use")
	}

	code := utils.GenerateRandomNumericCode(verificationCodeLength)

	key := fmt.Sprintf("%s%d", emailVerificationPrefix, userID)
	data := map[string]string{
		"email": newEmail,
		"code":  code,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	err = s.Client.Set(key, string(jsonData), verificationCodeTTL).Err()
	if err != nil {
		return err
	}

	content := &models.EmailContent{
		To:      newEmail,
		Subject: "Verify your email address",
		Body:    "verify_email",
		Data: map[string]string{
			"Code": code,
		},
	}

	return s.SendTemplateEmail(content)
}

func (s *EmailService) VerifyEmailCode(userID uint, code string) error {
	if _, err := s.UserService.GetUserByUID(userID); err != nil {
		return errors.New("user not found")
	}

	key := fmt.Sprintf("%s%d", emailVerificationPrefix, userID)

	jsonData, err := s.Client.Get(key).Result()
	if err == redis.Nil {
		return errors.New("verification code expired or not found")
	} else if err != nil {
		return err
	}

	var data map[string]string
	if err := json.Unmarshal([]byte(jsonData), &data); err != nil {
		return err
	}

	if data["code"] != code {
		return errors.New("invalid verification code")
	}

	existingUser, err := s.UserService.GetUserByEmail(data["email"])
	if err == nil && existingUser.UID != userID {
		return errors.New("email address already in use")
	}

	fields := make(map[string]interface{})
	fields["email"] = data["email"]
	fields["email_verified"] = true

	if err := s.UserService.UpdateUser(userID, fields); err != nil {
		log.Printf("failed to update user email for user %d: %v", userID, err)
		return err
	}

	return s.Client.Del(key).Err()
}

func (s *EmailService) CreateRegistrationRequest(email string, username string, password string, ipAddress string) (string, error) {
	if err := s.CheckRegistrationRateLimit(ipAddress); err != nil {
		return "", err
	}

	if err := s.CheckEmailRateLimit(ipAddress); err != nil {
		return "", err
	}

	if err := utils.Validate(username, "username", utils.ValidationOptions{
		MinLength:         3,
		MaxLength:         20,
		AllowSpaces:       false,
		AllowNonPlainText: false,
	}); err != nil {
		return "", err
	}

	if !utils.IsValidEmail(email) {
		return "", errors.New("invalid email")
	}

	if s.UserService.CheckNameExists(username) {
		return "", errors.New("username already exists")
	}

	if s.UserService.CheckEmailExists(email) {
		return "", errors.New("email already exists")
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return "", errors.New("error hashing password")
	}

	token := utils.GenerateRandomString(32)

	now := time.Now()
	pendingReg := PendingRegistration{
		Email:     email,
		Username:  username,
		Password:  hashedPassword,
		Token:     token,
		CreatedAt: now.Unix(),
		ExpiresAt: now.Add(registrationTTL).Unix(),
	}

	key := fmt.Sprintf("%s%s", registrationPrefix, token)
	jsonData, err := json.Marshal(pendingReg)
	if err != nil {
		return "", err
	}

	if err := s.Client.Set(key, string(jsonData), registrationTTL).Err(); err != nil {
		return "", err
	}


	content := &models.EmailContent{
		To:      email,
		Subject: "Verify Your Email for cutz.lol",
		Body:    "verify_email",
		Data: map[string]string{
			"Code": token,
		},
	}

	if err := s.SendTemplateEmail(content); err != nil {
		log.Printf("Error sending registration verification email: %v", err)
		s.Client.Del(key)
		return "", errors.New("failed to send verification email")
	}

	return token, nil
}

func (s *EmailService) GetRegistrationRequest(token string) (*PendingRegistration, error) {
	key := fmt.Sprintf("%s%s", registrationPrefix, token)

	jsonData, err := s.Client.Get(key).Result()
	if err == redis.Nil {
		return nil, errors.New("verification token expired or not found")
	} else if err != nil {
		return nil, err
	}

	var reg PendingRegistration
	if err := json.Unmarshal([]byte(jsonData), &reg); err != nil {
		return nil, err
	}

	now := time.Now().Unix()
	if now > reg.ExpiresAt {
		s.Client.Del(key)
		return nil, errors.New("verification token has expired")
	}

	return &reg, nil
}

func (s *EmailService) CompleteRegistrationWithIP(token string, ipAddress string) (*models.User, error) {
	reg, err := s.GetRegistrationRequest(token)
	if err != nil {
		return nil, err
	}

	if s.UserService.CheckNameExists(reg.Username) {
		return nil, errors.New("username already exists")
	}

	if s.UserService.CheckEmailExists(reg.Email) {
		return nil, errors.New("email already exists")
	}

	user, err := s.UserService.CreateUserWithVerifiedEmail(reg.Email, reg.Username, reg.Password)
	if err != nil {
		return nil, err
	}

	key := fmt.Sprintf("%s%s", registrationPrefix, token)
	s.Client.Del(key)

	go func() {
		if err := s.AltAccountService.CheckForAltAccount(user, ipAddress); err != nil {
			log.Printf("Error checking for IP-based alt accounts: %v", err)
		}

		if s.AltAccountService != nil {
			if err := s.AltAccountService.CheckEmailForAltAccounts(user); err != nil {
				log.Printf("Error checking for email-based alt accounts: %v", err)
			}
		}
	}()

	if s.EventService != nil {
		regData := models.EventData{
			"uid":               user.UID,
			"username":          user.Username,
			"registration_time": time.Now(),
			"ip_address":        ipAddress,
		}

		if _, err := s.EventService.Publish(models.EventUserRegistered, regData); err != nil {
			log.Printf("Error publishing enhanced user registration event: %v", err)
		}
	}

	return user, nil
}

func (s *EmailService) SendEmail(content *models.EmailContent) error {
	e := email.NewEmail()
	e.From = s.formatFromAddress()
	e.To = []string{content.To}
	e.Subject = content.Subject
	e.HTML = []byte(content.Body)

	// Use SSL/TLS for port 465, regular SMTP for other ports
	if config.SMTPPort == "465" {
		tlsConfig := &tls.Config{
			ServerName: config.SMTPHost,
			InsecureSkipVerify: false,
		}
		if err := e.SendWithTLS(s.formatSMTPServer(), s.createSMTPAuth(), tlsConfig); err != nil {
			log.Printf("Error sending email with TLS: %v", err)
			return err
		}
	} else {
		if err := e.Send(s.formatSMTPServer(), s.createSMTPAuth()); err != nil {
			log.Printf("Error sending email: %v", err)
			return err
		}
	}

	return nil
}

func (s *EmailService) SendTemplateEmail(content *models.EmailContent) error {
	templateService := utils.NewEmailTemplateService()
	templateContent, err := templateService.GetTemplate(content.Body)
	if err != nil {
		return err
	}

	emailBody := utils.ReplaceTemplatePlaceholders(templateContent, content.Data)

	emailToSend := &models.EmailContent{
		To:      content.To,
		Subject: content.Subject,
		Body:    emailBody,
	}

	return s.SendEmail(emailToSend)
}

func (s *EmailService) formatFromAddress() string {
	return "Support <" + config.SMTPUsername + ">"
}

func (s *EmailService) formatSMTPServer() string {
	return config.SMTPHost + ":" + config.SMTPPort
}

func (s *EmailService) createSMTPAuth() smtp.Auth {
	return smtp.PlainAuth(
		"",
		config.SMTPUsername,
		config.SMTPPassword,
		config.SMTPHost,
	)
}
