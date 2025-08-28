package db

import (
	"errors"
	"log"
	"time"

	"github.com/hazebio/haze.bio_backend/models"
	"gorm.io/gorm"
)

func StartMigration(db *gorm.DB) error {
	// First, handle invite_codes table migration
	if err := migrateInviteCodesTable(db); err != nil {
		log.Printf("Error migrating invite_codes table: %v", err)
		return err
	}

	err := db.AutoMigrate(
		&models.User{},
		&models.UserProfile{},
		&models.UserSocial{},
		&models.UserWidget{},
		&models.UserBadge{},
		&models.UserSession{},
		&models.UserSubscription{},
		&models.Badge{},
		&models.Punishment{},
		&models.ModerationLog{},
		&models.Report{},
		&models.View{},
		&models.RedeemCode{},
		&models.Status{},
		&models.Template{},
		&models.Application{},
		&models.Response{},
		
		&models.Event{},
		&models.DataExport{},
		&models.InviteCode{},
	)
	if err != nil {
		log.Println("Error migrating models:", err)
		return err
	}

	log.Println("Migration completed")
	return nil
}

// migrateInviteCodesTable handles the invite_codes table migration
func migrateInviteCodesTable(db *gorm.DB) error {
	// Check if invite_codes table exists
	var tableExists bool
	err := db.Raw("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invite_codes')").Scan(&tableExists).Error
	if err != nil {
		return err
	}

	if !tableExists {
		// Table doesn't exist, create it
		log.Println("Creating invite_codes table...")
		return db.AutoMigrate(&models.InviteCode{})
	}

	// Table exists, check if created_by column exists
	var columnExists bool
	err = db.Raw("SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invite_codes' AND column_name = 'created_by')").Scan(&columnExists).Error
	if err != nil {
		return err
	}

	if !columnExists {
		log.Println("invite_codes table exists but created_by column is missing, dropping and recreating table...")
		
		// Drop the existing table and recreate it
		err = db.Exec("DROP TABLE IF EXISTS invite_codes").Error
		if err != nil {
			return err
		}
		
		log.Println("Recreating invite_codes table with correct structure...")
		return db.AutoMigrate(&models.InviteCode{})
	}

	// Column exists, check if it has NULL values
	var nullCount int64
	err = db.Raw("SELECT COUNT(*) FROM invite_codes WHERE created_by IS NULL").Scan(&nullCount).Error
	if err != nil {
		return err
	}

	if nullCount > 0 {
		log.Printf("Found %d invite codes with NULL created_by values, cleaning up...", nullCount)
		
		// Delete all invite codes with NULL created_by (they're invalid anyway)
		err = db.Exec("DELETE FROM invite_codes WHERE created_by IS NULL").Error
		if err != nil {
			return err
		}
		
		log.Printf("Deleted %d invalid invite codes", nullCount)
	}

	// Now migrate the table structure
	return db.AutoMigrate(&models.InviteCode{})
}

func RestrictUsersWithoutEmail(db *gorm.DB) error {
	log.Println("Starting migration: Restricting users without email addresses")

	var usersWithoutEmail []models.User
	if err := db.Where("email IS NULL").Find(&usersWithoutEmail).Error; err != nil {
		log.Printf("Error finding users without email: %v", err)
		return err
	}

	log.Printf("Found %d users without email addresses", len(usersWithoutEmail))

	migrationDate := time.Date(2025, 4, 31, 0, 1, 0, 0, time.UTC)

	permanentEndDate := migrationDate.AddDate(100, 0, 0)

	const systemStaffID uint = 0

	for _, user := range usersWithoutEmail {
		var existingPunishment models.Punishment
		result := db.Where("user_id = ? AND active = ?", user.UID, true).First(&existingPunishment)

		if result.Error == nil {
			log.Printf("User ID %d already has an active punishment, skipping", user.UID)
			continue
		} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			log.Printf("Error checking existing punishment for user %d: %v", user.UID, result.Error)
			continue
		}

		punishment := models.Punishment{
			UserID:         user.UID,
			StaffID:        systemStaffID,
			Reason:         "Account does not meet minimum security requirements",
			Details:        "Migration from announcement on 17/04/2025, 00:01 - Email verification required",
			CreatedAt:      migrationDate,
			EndDate:        permanentEndDate,
			Active:         true,
			PunishmentType: "partial",
		}

		if err := db.Create(&punishment).Error; err != nil {
			log.Printf("Error creating punishment for user %d: %v", user.UID, err)
			continue
		}

		moderationLog := models.ModerationLog{
			ActionType:   "restrict",
			StaffID:      systemStaffID,
			TargetID:     user.UID,
			PunishmentID: punishment.ID,
			CreatedAt:    migrationDate,
		}

		if err := db.Create(&moderationLog).Error; err != nil {
			log.Printf("Error creating moderation log for user %d: %v", user.UID, err)
		}

		log.Printf("Created partial restriction for user ID %d (username: %s)", user.UID, user.Username)
	}

	log.Println("Migration completed: Users without email addresses have been restricted")
	return nil
}

func DisableParallaxForNonPremiumUsers(db *gorm.DB) error {
	log.Println("Starting migration: Disabling parallax effect for non-premium users")

	var profilesWithParallax []models.UserProfile
	if err := db.Where("parallax_effect = ?", true).Find(&profilesWithParallax).Error; err != nil {
		log.Printf("Error finding profiles with parallax effect: %v", err)
		return err
	}

	log.Printf("Found %d profiles with parallax effect", len(profilesWithParallax))

	var disabledCount int

	for _, profile := range profilesWithParallax {
		var user models.User
		if err := db.Preload("Subscription").Where("uid = ?", profile.UID).First(&user).Error; err != nil {
			log.Printf("Error finding user for profile UID %d: %v", profile.UID, err)
			continue
		}

		if user.Subscription.Status != "active" {
			if err := db.Model(&models.UserProfile{}).Where("uid = ?", profile.UID).Update("parallax_effect", false).Error; err != nil {
				log.Printf("Error disabling parallax effect for user %d: %v", profile.UID, err)
				continue
			}

			disabledCount++
			log.Printf("Disabled parallax effect for non-premium user %d (username: %s)", user.UID, user.Username)
		}
	}

	log.Printf("Migration completed: Disabled parallax effect for %d non-premium users", disabledCount)
	return nil
}
