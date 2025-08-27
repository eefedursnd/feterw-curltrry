package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sort"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/utils"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserService struct {
	DB                  *gorm.DB
	Client              *redis.Client
	EmailService        *EmailService
	AltAccountService   *AltAccountService
	BotSession          *discordgo.Session

	EventService        *EventService
}

const (
	UsernameCooldownKey    = "cooldown:username:"
	AliasCooldownKey       = "cooldown:alias:"
	DisplayNameCooldownKey = "cooldown:displayname:"

	UsernameCooldownDuration    = 6 * time.Hour
	AliasCooldownDuration       = 3 * time.Hour
	DisplayNameCooldownDuration = 30 * time.Minute
)

func NewUserService(db *gorm.DB, client *redis.Client, botSession *discordgo.Session) *UserService {
	return &UserService{
		DB:                  db,
		Client:              client,
		EmailService:        &EmailService{DB: db, Client: client},
		AltAccountService:   &AltAccountService{DB: db, Client: client},
		BotSession:          botSession,

	}
}

/* Create a new user with verified email */
func (us *UserService) CreateUserWithVerifiedEmail(email string, username string, hashedPassword string) (*models.User, error) {
	tx := us.DB.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	var count int64
	tx.Model(&models.User{}).Where("lower(username) = ?", strings.ToLower(username)).Count(&count)
	if count > 0 {
		tx.Rollback()
		return nil, errors.New("username already exists")
	}

	tx.Model(&models.User{}).Where("lower(email) = ?", strings.ToLower(email)).Count(&count)
	if count > 0 {
		tx.Rollback()
		return nil, errors.New("email already exists")
	}

	userModel := &models.User{
		Email:         &email,
		Username:      username,
		DisplayName:   username,
		Password:      hashedPassword,
		EmailVerified: true,
	}

	if err := tx.Clauses(clause.Returning{}).Create(&userModel).Error; err != nil {
		tx.Rollback()
		log.Println("Error creating user:", err)
		return nil, err
	}

	if userModel.UID == 0 {
		tx.Rollback()
		log.Println("Error: UID is 0 after user creation")
		return nil, errors.New("user creation failed, UID not assigned")
	}

	userProfileModel := &models.UserProfile{
		UID:             userModel.UID,
		AccentColor:     "#626262",
		TextColor:       "#ffffff",
		BackgroundColor: "#000000",
		IconColor:       "#000000",
		BadgeColor:      "#000000",
	}

	if err := tx.Create(&userProfileModel).Error; err != nil {
		tx.Rollback()
		log.Println("Error creating user profile:", err)
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		log.Println("Error committing transaction:", err)
		return nil, err
	}

	content := &models.EmailContent{
		To:      email,
		Subject: "Welcome to cutz.lol",
		Body:    "welcome",
		Data: map[string]string{
			"Username": userModel.DisplayName,
		},
	}

	if err := us.EmailService.SendTemplateEmail(content); err != nil {
		log.Printf("Error sending welcome email: %v", err)
	}

	utils.UserRegistrations.Inc()

	log.Println("USER CREATED WITH VERIFIED EMAIL:", userModel.Username, userModel.UID)
	return userModel, nil
}

/* Search users by username or display name */
func (us *UserService) SearchUsers(query string, limit int) ([]*models.User, error) {
	users := []*models.User{}
	err := us.DB.Where("LOWER(username) = LOWER(?) OR LOWER(alias) = LOWER(?) OR LOWER(display_name) = LOWER(?)", query, query, query).
		Select("uid, email, username, display_name, alias, email_verified, badge_edit_credits, mfa_enabled, login_with_discord, discord_id, linked_at, created_at").
		Preload("Profile", func(db *gorm.DB) *gorm.DB {
			return db.Select("uid, views, avatar_url, description, location, template, audio_url")
		}).
		Preload("Badges.Badge", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, name")
		}).
		Preload("Sessions", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, user_id, user_agent, ip_address, location, expires_at, created_at").Order("created_at DESC")
		}).
		Preload("Punishments", func(db *gorm.DB) *gorm.DB {
			return db.Select("*").Order("created_at DESC")
		}).
		Preload("Subscription", func(db *gorm.DB) *gorm.DB {
			return db.Select("user_id, subscription_type, status, created_at")
		}).
		Limit(limit).
		Find(&users).Error

	if err != nil {
		log.Println("Error searching users:", err)
		return nil, err
	}

	for _, user := range users {
		if user.Email != nil {
			maskedEmail := utils.MaskEmail(*user.Email)
			user.Email = &maskedEmail
		}

		for i := range user.Sessions {
			if user.Sessions[i].IPAddress != "" {
				ipParts := strings.Split(user.Sessions[i].IPAddress, ".")
				if len(ipParts) == 4 {
					user.Sessions[i].IPAddress = ipParts[0] + ".***.***"
				} else {
					ipv6Parts := strings.Split(user.Sessions[i].IPAddress, ":")
					if len(ipv6Parts) > 1 {
						user.Sessions[i].IPAddress = ipv6Parts[0] + ":****:****"
					} else {
						user.Sessions[i].IPAddress = "***"
					}
				}
			}
		}

		for i := range *user.Punishments {
			if (*user.Punishments)[i].StaffID > 0 {
				staffUser := &models.User{}
				if err := us.DB.Select("username").First(staffUser, (*user.Punishments)[i].StaffID).Error; err == nil {
					(*user.Punishments)[i].StaffName = staffUser.Username
				} else {
					(*user.Punishments)[i].StaffName = "Unknown Staff"
				}
			} else {
				(*user.Punishments)[i].StaffName = "System"
			}
		}

		user.Password = ""
		user.MFASecret = ""

		user.HasPremium = user.HasActivePremiumSubscription()
	}

	return users, nil
}

/* Get Stats */
func (us *UserService) GetStats() (*models.Stats, error) {
	cacheKey := "site:stats"
	val, err := us.Client.Get(cacheKey).Result()
	if err == nil {
		var stats models.Stats
		if err := json.Unmarshal([]byte(val), &stats); err == nil {
			return &stats, nil
		}
		log.Printf("Error unmarshaling stats from cache: %v", err)
	} else if err != redis.Nil {
		log.Printf("Error getting stats from cache: %v", err)
	}

	var users int64
	if err := us.DB.Model(&models.User{}).Count(&users).Error; err != nil {
		return nil, err
	}

	var premium int64
	if err := us.DB.Model(&models.UserSubscription{}).
		Where("status = ?", "active").
		Count(&premium).Error; err != nil {
		return nil, err
	}

	var totalViews int64
	if err := us.DB.Model(&models.UserProfile{}).Select("sum(views)").Row().Scan(&totalViews); err != nil {
		return nil, err
	}

	discordLinked, err := us.GetDiscordLinkedUsers()
	if err != nil {
		return nil, err
	}

	stats := &models.Stats{
		Users:         int(users),
		Premium:       int(premium),
		TotalViews:    totalViews,
		DiscordLinked: len(discordLinked),
	}

	jsonStats, err := json.Marshal(stats)
	if err == nil {
		if err := us.Client.Set(cacheKey, string(jsonStats), 30*time.Minute).Err(); err != nil {
			log.Printf("Error caching stats: %v", err)
		}
	} else {
		log.Printf("Error marshaling stats for cache: %v", err)
	}

	return stats, nil
}

/* Add Badge Edit Credits */
func (us *UserService) AddBadgeEditCredits(uid uint, amount int) error {
	user, err := us.GetUserByUIDNoCache(uid)
	if err != nil {
		return err
	}

	user.BadgeEditCredits += amount
	fields := make(map[string]interface{})
	fields["badge_edit_credits"] = user.BadgeEditCredits

	if err := us.UpdateUser(uid, fields); err != nil {
		return err
	}

	return nil
}

/* Use Badge Edit Credits */
func (us *UserService) UseBadgeEditCredits(uid uint) error {
	user, err := us.GetUserByUIDNoCache(uid)
	if err != nil {
		return err
	}

	if user.BadgeEditCredits == 0 {
		return errors.New("no badge edit credits")
	}

	user.BadgeEditCredits--
	fields := make(map[string]interface{})
	fields["badge_edit_credits"] = user.BadgeEditCredits

	if err := us.UpdateUser(uid, fields); err != nil {
		return err
	}

	return nil
}

/* Login a user */
func (us *UserService) LoginUser(usernameOrEmail string, password string, ipAddress string) (string, *models.User, error) {
	var user *models.User
	var err error

	if utils.IsValidEmail(usernameOrEmail) {
		user, err = us.GetUserByEmail(usernameOrEmail)
	} else {
		user, err = us.GetUserByUsername(usernameOrEmail)
	}

	if err != nil {
		return "", nil, err
	}

	if err := utils.CheckPassword(password, user.Password); err != nil {
		if err.Error() == "crypto/bcrypt: hashedPassword is not the hash of the given password" {
			return "", nil, errors.New("invalid password")
		}
		return "", nil, err
	}

	token, err := utils.GenerateJWT(user.UID, config.SecretKey, false)
	if err != nil {
		log.Println("Error generating token:", err)
		return "", nil, errors.New("error generating token")
	}

	if us.EventService != nil {
		data := models.UserLoginData{
			UID:       user.UID,
			Username:  user.Username,
			IPAddress: ipAddress,
			LoginTime: time.Now(),
		}

		if _, err := us.EventService.Publish(models.EventUserLoggedIn, data); err != nil {
			log.Printf("Error publishing user login event: %v", err)
		}
	}

	go us.AltAccountService.CheckForAltAccountOnLogin(user, ipAddress)

	return token, user, nil
}

/* Check if name already exists */
func (us *UserService) CheckNameExists(input string) bool {
	err := us.DB.Where("lower(username) = ? OR lower(alias) = ?", utils.ToLowerCase(input), utils.ToLowerCase(input)).First(&models.User{}).Error

	return !errors.Is(err, gorm.ErrRecordNotFound)
}

/* Check if email already exists */
func (us *UserService) CheckEmailExists(email string) bool {
	err := us.DB.Where("email = ?", email).First(&models.User{}).Error

	return !errors.Is(err, gorm.ErrRecordNotFound)
}

/* Get user by UID */
func (us *UserService) GetUserByUID(uid uint) (*models.User, error) {
	user := &models.User{}

	err := us.DB.Where("uid = ?", uid).
		Preload("Profile").
		Preload("Socials").
		Preload("Widgets").
		Preload("Subscription").
		Preload("Punishments", func(db *gorm.DB) *gorm.DB {
			return db.Where("active = ?", true).Omit("staff_id")
		}).
		Preload("Badges.Badge").First(user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	user.Password = ""
	user.MFASecret = ""

	user.HasPremium = user.HasActivePremiumSubscription()

	if usernameCooldown, timestamp, err := us.CheckCooldown(uid, UsernameCooldownKey); err == nil && usernameCooldown {
		user.UsernameCooldown = us.GetRemainingCooldown(timestamp)
	}

	if aliasCooldown, timestamp, err := us.CheckCooldown(uid, AliasCooldownKey); err == nil && aliasCooldown {
		user.AliasCooldown = us.GetRemainingCooldown(timestamp)
	}

	if displayNameCooldown, timestamp, err := us.CheckCooldown(uid, DisplayNameCooldownKey); err == nil && displayNameCooldown {
		user.DisplayNameCooldown = us.GetRemainingCooldown(timestamp)
	}

	return user, nil
}

/* Get user by Email */
func (us *UserService) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}

	err := us.DB.Where("email = ?", email).First(user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return user, nil
}

/* Get user by UID without cache */
func (us *UserService) GetUserByUIDNoCache(uid uint) (*models.User, error) {
	user := &models.User{}

	err := us.DB.Where("uid = ?", uid).
		Preload("Profile").
		Preload("Socials").
		Preload("Widgets").
		Preload("Subscription").
		Preload("Punishments", func(db *gorm.DB) *gorm.DB {
			return db.Where("active = ?", true).Omit("staff_id")
		}).
		Preload("Badges.Badge").First(user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}

		return nil, err
	}

	if usernameCooldown, timestamp, err := us.CheckCooldown(uid, UsernameCooldownKey); err == nil && usernameCooldown {
		user.UsernameCooldown = us.GetRemainingCooldown(timestamp)
	}

	if aliasCooldown, timestamp, err := us.CheckCooldown(uid, AliasCooldownKey); err == nil && aliasCooldown {
		user.AliasCooldown = us.GetRemainingCooldown(timestamp)
	}

	if displayNameCooldown, timestamp, err := us.CheckCooldown(uid, DisplayNameCooldownKey); err == nil && displayNameCooldown {
		user.DisplayNameCooldown = us.GetRemainingCooldown(timestamp)
	}

	return user, nil
}

/* Get all users that have linked their Discord account */
func (us *UserService) GetDiscordLinkedUsers() ([]*models.User, error) {
	users := []*models.User{}

	err := us.DB.Where("discord_id IS NOT NULL").Omit("mfa_secret", "password", "email").Find(&users).Error
	if err != nil {
		return nil, err
	}

	for _, user := range users {
		user.Password = ""
		user.MFASecret = ""
	}

	return users, nil
}

/* Get user by username public */
func (us *UserService) GetUserByUsernamePublic(username string) (*models.User, error) {
	user := &models.User{}

	err := us.DB.Where("LOWER(username) = LOWER(?)", username).Omit("mfa_secret", "password", "email").First(user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return user, nil
}

/* Get user by username without cache */
func (us *UserService) GetUserByUsername(username string) (*models.User, error) {
	user := &models.User{}

	err := us.DB.Where("LOWER(username) = LOWER(?)", username).First(user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return user, nil
}

func (us *UserService) GetUserByUsernameOrAlias(username string) (*models.User, error) {
	user := &models.User{}
	err := us.DB.Where("LOWER(username) = LOWER(?) OR LOWER(alias) = LOWER(?)", username, username).First(user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	user.Password = ""
	user.MFASecret = ""

	user.HasPremium = user.HasActivePremiumSubscription()

	if usernameCooldown, timestamp, err := us.CheckCooldown(user.UID, UsernameCooldownKey); err == nil && usernameCooldown {
		user.UsernameCooldown = us.GetRemainingCooldown(timestamp)
	}

	if aliasCooldown, timestamp, err := us.CheckCooldown(user.UID, AliasCooldownKey); err == nil && aliasCooldown {
		user.AliasCooldown = us.GetRemainingCooldown(timestamp)
	}

	if displayNameCooldown, timestamp, err := us.CheckCooldown(user.UID, DisplayNameCooldownKey); err == nil && displayNameCooldown {
		user.DisplayNameCooldown = us.GetRemainingCooldown(timestamp)
	}

	return user, nil
}

/* Update user by fields */
func (us *UserService) UpdateUserFields(uid uint, fields map[string]interface{}) error {
	prettyJSON, _ := json.MarshalIndent(fields, "", "  ")
	log.Printf("Updating user fields for UID %d: %s", uid, string(prettyJSON))

	oldUser := &models.User{}
	err := us.DB.First(oldUser, uid).Error
	if err != nil {
		return err
	}

	if username, ok := fields["username"].(string); ok && username != oldUser.Username {
		onCooldown, timestamp, err := us.CheckCooldown(uid, UsernameCooldownKey)
		if err != nil {
			return err
		}
		if onCooldown {
			remaining := us.GetRemainingCooldown(timestamp)
			return fmt.Errorf("username change cooldown: %d minutes remaining", remaining)
		}

		err = utils.Validate(username, "username", utils.ValidationOptions{
			MinLength:         1,
			MaxLength:         20,
			AllowSpaces:       false,
			AllowNonPlainText: false,
		})
		if err != nil {
			return err
		}
		if us.CheckNameExists(username) {
			return errors.New("username already exists")
		}
		fields["username"] = username

		if err := us.SetCooldown(uid, UsernameCooldownKey, UsernameCooldownDuration); err != nil {
			log.Printf("Warning: Failed to set username cooldown: %v", err)
		}
	}

	if alias, ok := fields["alias"].(string); ok {
		if oldUser.Alias == nil {
			oldUser.Alias = new(string)
		}
		if alias != *oldUser.Alias {
			onCooldown, timestamp, err := us.CheckCooldown(uid, AliasCooldownKey)
			if err != nil {
				return err
			}
			if onCooldown {
				remaining := us.GetRemainingCooldown(timestamp)
				return fmt.Errorf("alias change cooldown: %d minutes remaining", remaining)
			}

			err = utils.Validate(alias, "alias", utils.ValidationOptions{
				MinLength:         1,
				MaxLength:         20,
				AllowSpaces:       false,
				AllowNonPlainText: false,
			})
			if err != nil {
				return err
			}
			if us.CheckNameExists(alias) {
				return errors.New("alias already exists")
			}
			fields["alias"] = alias

			if err := us.SetCooldown(uid, AliasCooldownKey, AliasCooldownDuration); err != nil {
				log.Printf("Warning: Failed to set alias cooldown: %v", err)
			}
		}
	}

	if displayName, ok := fields["display_name"].(string); ok && displayName != oldUser.DisplayName {
		onCooldown, timestamp, err := us.CheckCooldown(uid, DisplayNameCooldownKey)
		if err != nil {
			return err
		}
		if onCooldown {
			remaining := us.GetRemainingCooldown(timestamp)
			return fmt.Errorf("display name change cooldown: %d minutes remaining", remaining)
		}

		err = utils.Validate(displayName, "displayname", utils.ValidationOptions{
			MinLength:         1,
			MaxLength:         30,
			AllowSpaces:       true,
			AllowNonPlainText: true,
		})
		if err != nil {
			return err
		}
		fields["display_name"] = displayName

		// Set display_name cooldown after validation passes
		if err := us.SetCooldown(uid, DisplayNameCooldownKey, DisplayNameCooldownDuration); err != nil {
			log.Printf("Warning: Failed to set display name cooldown: %v", err)
		}
	}

	delete(fields, "uid")
	delete(fields, "created_at")
	delete(fields, "password")
	delete(fields, "badges")
	delete(fields, "badge_edit_credits")
	delete(fields, "subscription")
	delete(fields, "staff_level")

	delete(fields, "avatar_url")
	delete(fields, "banner_url")
	delete(fields, "email_verified")
	delete(fields, "background_url")

	err = us.DB.Model(&models.User{}).Where("uid = ?", uid).Omit("uid", "created_at", "password", "badges").Updates(fields).Error
	if err != nil {
		log.Printf("Error updating user: %v", err)
		return err
	}

	return nil
}

/* Delete account (anonymization) */
func (us *UserService) DeleteAccount(uid uint) error {
	tx := us.DB.Begin()
	if tx.Error != nil {
		log.Printf("Error starting transaction: %v", tx.Error)
		return tx.Error
	}

	user, err := us.GetUserByUIDNoCache(uid)
	if err != nil {
		tx.Rollback()
		return err
	}

	originalEmail := user.Email

	anonymizedFields := map[string]interface{}{
		"username":     "deleted_user_" + fmt.Sprintf("%d", user.UID),
		"display_name": "Deleted User " + fmt.Sprintf("%d", user.UID),
		"alias":        nil,
		"email":        nil,
		"password":     utils.GenerateRandomString(64),
	}

	if err := tx.Model(&models.User{}).Where("uid = ?", uid).Updates(anonymizedFields).Error; err != nil {
		tx.Rollback()
		log.Printf("Error anonymizing user data: %v", err)
		return err
	}

	if err := tx.Where("uid = ?", uid).Delete(&models.UserSocial{}).Error; err != nil {
		tx.Rollback()
		log.Printf("Error deleting user socials: %v", err)
		return err
	}

	if err := tx.Where("uid = ?", uid).Delete(&models.UserWidget{}).Error; err != nil {
		tx.Rollback()
		log.Printf("Error deleting user widgets: %v", err)
		return err
	}

	defaultProfile := map[string]interface{}{
		"description":        "",
		"location":           "",
		"occupation":         "",
		"avatar_url":         nil,
		"banner_url":         nil,
		"background_url":     nil,
		"audio_url":          nil,
		"cursor_url":         nil,
		"decoration_url":     nil,
		"accent_color":       "#000000",
		"text_color":         "#000000",
		"background_color":   "#000000",
		"icon_color":         "#000000",
		"badge_color":        "#000000",
		"template":           "default",
		"monochrome_icons":   false,
		"monochrome_badges":  false,
		"card_opacity":       0.9,
		"card_blur":          0.5,
		"card_border_radius": 15,
		"layout_max_width":   776,
	}

	if err := tx.Model(&models.UserProfile{}).Where("uid = ?", uid).Updates(defaultProfile).Error; err != nil {
		tx.Rollback()
		log.Printf("Error resetting user profile: %v", err)
		return err
	}

	if err := tx.Where("user_id = ?", uid).Delete(&models.UserSession{}).Error; err != nil {
		tx.Rollback()
		log.Printf("Error deleting user sessions: %v", err)
		return err
	}

	if err := tx.Commit().Error; err != nil {
		log.Printf("Error committing deletion changes: %v", err)
		return err
	}

	if originalEmail != nil {
		content := &models.EmailContent{
			To:      *originalEmail,
			Subject: "Your cutz.lol Account Has Been Deleted",
			Body:    "account_deleted",
			Data: map[string]string{
				"DeletedAt": time.Now().Format("January 2, 2006"),
			},
		}

		if err := us.EmailService.SendTemplateEmail(content); err != nil {
			log.Printf("Error sending account deleted email: %v", err)
		}
	}

	if us.EventService != nil {
		data := map[string]interface{}{
			"uid":      uid,
			"username": user.Username,
		}

		if _, err := us.EventService.Publish(models.EventUserDeleted, data); err != nil {
			log.Printf("Error publishing account deletion event: %v", err)
		}
	}

	log.Printf("Successfully deleted account for user %d", uid)
	return nil
}

func (us *UserService) UpdateUser(uid uint, fields map[string]interface{}) error {
	prettyJSON, _ := json.MarshalIndent(fields, "", "  ")
	log.Printf("[NO CHECK] Updating user fields for UID %d: %s", uid, string(prettyJSON))

	err := us.DB.Model(&models.User{}).Where("uid = ?", uid).Updates(fields).Error
	if err != nil {
		log.Printf("Error updating user: %v", err)
		return err
	}

	return nil
}

/* Delete user by UID */
func (us *UserService) DeleteUserByUID(UID uint) error {
	if err := us.DB.Where("uid = ?", UID).Delete(&models.User{}).Error; err != nil {
		return err
	}

	return nil
}

/* Update password */
func (us *UserService) UpdatePassword(uid uint, currentPassword string, newPassword string) error {
	user, err := us.GetUserByUIDNoCache(uid)
	if err != nil {
		return err
	}

	if err := utils.CheckPassword(currentPassword, user.Password); err != nil {
		return errors.New("invalid password")
	}

	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return errors.New("error hashing password")
	}

	fields := make(map[string]interface{})
	fields["password"] = hashedPassword

	if err := us.DB.Model(&models.User{}).Where("uid = ?", uid).Updates(fields).Error; err != nil {
		return err
	}

	return nil
}

func (us *UserService) UpdatePasswordWithoutCurrentPassword(uid uint, newPassword string) error {
	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return errors.New("error hashing password")
	}

	fields := make(map[string]interface{})
	fields["password"] = hashedPassword

	if err := us.DB.Model(&models.User{}).Where("uid = ?", uid).Updates(fields).Error; err != nil {
		return err
	}

	return nil
}

/* Top 10 users by views */
type TopUser struct {
	Username string `json:"username"`
	Views    uint   `json:"views"`
}

func (us *UserService) GetTopUsersByViews() ([]*TopUser, error) {
	cacheKey := "users:top_views"
	var topUsers []*TopUser

	val, err := us.Client.Get(cacheKey).Result()
	if err == nil {
		err = json.Unmarshal([]byte(val), &topUsers)
		if err != nil {
			log.Printf("Error decoding users from cache: %v", err)
			us.Client.Del(cacheKey)
		} else {
			return topUsers, nil
		}
	} else if err != redis.Nil {
		log.Printf("Error getting users from cache: %v", err)
	}

	var users []*models.User
	err = us.DB.Find(&users).Error
	if err != nil {
		return nil, err
	}

	for _, user := range users {
		profile := &models.UserProfile{}
		err = us.DB.Where("uid = ?", user.UID).First(profile).Error
		if err != nil {
			log.Printf("Error getting profile for user %s: %v", user.Username, err)
			continue
		}

		topUsers = append(topUsers, &TopUser{
			Username: user.Username,
			Views:    profile.Views,
		})
	}

	sort.Slice(topUsers, func(i, j int) bool {
		return topUsers[i].Views > topUsers[j].Views
	})

	if len(topUsers) > 10 {
		topUsers = topUsers[:10]
	}

	encoded, err := json.Marshal(topUsers)
	if err != nil {
		log.Printf("Error encoding users for cache: %v", err)
	} else {
		err = us.Client.Set(cacheKey, string(encoded), time.Minute*15).Err()
		if err != nil {
			log.Printf("Error setting users in cache: %v", err)
		}
	}

	return topUsers, nil
}

func (us *UserService) CheckCooldown(uid uint, cooldownType string) (bool, time.Time, error) {
	key := fmt.Sprintf("%s%d", cooldownType, uid)

	val, err := us.Client.Get(key).Result()
	if err == redis.Nil {
		return false, time.Time{}, nil
	} else if err != nil {
		log.Printf("Error checking cooldown: %v", err)
		return false, time.Time{}, err
	}

	timestamp, err := time.Parse(time.RFC3339, val)
	if err != nil {
		log.Printf("Error parsing cooldown timestamp: %v", err)
		return false, time.Time{}, err
	}

	return true, timestamp, nil
}

func (us *UserService) SetCooldown(uid uint, cooldownType string, duration time.Duration) error {
	key := fmt.Sprintf("%s%d", cooldownType, uid)

	expiryTime := time.Now().Add(duration)

	err := us.Client.Set(key, expiryTime.Format(time.RFC3339), duration).Err()
	if err != nil {
		log.Printf("Error setting cooldown: %v", err)
		return err
	}

	return nil
}

func (us *UserService) GetRemainingCooldown(timestamp time.Time) int {
	remaining := time.Until(timestamp)
	if remaining < 0 {
		return 0
	}
	return int(remaining.Minutes()) + 1
}
