package jobs

import (
	"log"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/services"
	"gorm.io/gorm"
)

type PremiumExpireJob struct {
	DB             *gorm.DB
	Client         *redis.Client
	UserService    *services.UserService
	ProfileService *services.ProfileService
	BadgeService   *services.BadgeService
}

func NewPremiumExpireJob(db *gorm.DB, client *redis.Client) *PremiumExpireJob {
	return &PremiumExpireJob{
		DB:             db,
		Client:         client,
		UserService:    &services.UserService{DB: db, Client: client},
		ProfileService: &services.ProfileService{DB: db, Client: client},
		BadgeService:   &services.BadgeService{DB: db, Client: client, UserService: &services.UserService{DB: db, Client: client}},
	}
}

func (j *PremiumExpireJob) Run() {
	log.Println("Running premium expiration job")

	var users []models.User
	result := j.DB.
		Preload("Subscription").
		Joins("INNER JOIN user_subscriptions ON users.uid = user_subscriptions.user_id").
		Where("user_subscriptions.status = ? AND user_subscriptions.subscription_type != ? AND user_subscriptions.next_payment_date < ?",
			"active", "lifetime", time.Now()).
		Find(&users)

	log.Println("Querying for users with expired premium subscriptions")

	if result.Error != nil {
		log.Printf("Error fetching users with expired premium: %v", result.Error)
		return
	}

	log.Printf("Found %d users with expired premium subscriptions", len(users))

	for _, user := range users {
		if !user.HasActivePremiumSubscription() {
			continue
		}

		log.Printf("Processing expired premium for user %s (UID: %d)", user.Username, user.UID)

		if err := j.DB.Where("user_id = ?", user.UID).Delete(&models.UserSubscription{}).Error; err != nil {
			log.Printf("Error deleting subscription for user %d: %v", user.UID, err)
			continue
		}
		log.Printf("Updated subscription status to cancelled for user %d", user.UID)

		if err := j.BadgeService.RemoveBadge(user.UID, "Premium"); err != nil {
			log.Printf("Error removing premium badge for user %d: %v", user.UID, err)
			continue
		}

		if err := j.ProfileService.RevertPremiumFeatures(user.UID); err != nil {
			log.Printf("Error reverting premium features for user %d: %v", user.UID, err)
		}

		log.Printf("Successfully processed expired premium for user %s", user.Username)
	}

	log.Println("Premium expiration job completed")
}

func GetSubscriptionCost(subscriptionType string) float32 {
	switch subscriptionType {
	case "monthly":
		return 200.0
	case "lifetime":
		return 600.0
	default:
		return 200.0
	}
}
