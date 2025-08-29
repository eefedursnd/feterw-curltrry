package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/utils"
	"gorm.io/gorm"
)

type RedeemService struct {
	DB           *gorm.DB
	Client       *redis.Client
	UserService  *UserService
	BadgeService *BadgeService
	EventService *EventService
}

func NewRedeemService(db *gorm.DB, client *redis.Client) *RedeemService {
	return &RedeemService{
		DB:           db,
		Client:       client,
		UserService:  &UserService{DB: db, Client: client},
		BadgeService: &BadgeService{DB: db, Client: client},
	}
}

func (rs *RedeemService) CreateRedeemCode(productData models.StripeProduct) (string, error) {
	generatedRedeemCode := utils.GenerateRedeemCode()
	productDataJSON, err := json.Marshal(productData)
	if err != nil {
		return "", err
	}

	redeemCode := &models.RedeemCode{
		Code:    generatedRedeemCode,
		Product: string(productDataJSON),
	}

	if err := rs.DB.Create(&redeemCode).Error; err != nil {
		return "", err
	}

	return generatedRedeemCode, nil
}

func (rs *RedeemService) HandlePurchase(uid uint, productData models.StripeProduct) error {
	switch productData.ProductName {
	case "Premium Upgrade":
		subscription := models.UserSubscription{
			UserID:           uid,
			SubscriptionType: "lifetime",
			Status:           "active",
			NextPaymentDate:  time.Now().AddDate(100, 0, 0),
		}

		if err := rs.BadgeService.AssignBadge(uid, "Premium"); err != nil {
			return err
		}

		var existingSub models.UserSubscription
		result := rs.DB.Where("user_id = ?", uid).First(&existingSub)

		if result.Error == nil {
			if err := rs.DB.Model(&existingSub).Updates(subscription).Error; err != nil {
				return err
			}
		} else if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			if err := rs.DB.Create(&subscription).Error; err != nil {
				return err
			}
		} else {
			return result.Error
		}
	case "Custom Badge":
		randomNumber := rand.Intn(9999)
		if err := rs.BadgeService.CreateCustomBadge(uid, fmt.Sprintf("Custom Badge %d", randomNumber), ""); err != nil {
			return errors.New("error creating custom badge")
		}

		if err := rs.UserService.AddBadgeEditCredits(uid, 8); err != nil {
			return errors.New("error adding badge edit credits")
		}
	case "Custom Badge Fee":
		if err := rs.UserService.AddBadgeEditCredits(uid, 5); err != nil {
			return errors.New("error adding badge edit credits")
		}
	default:
		return errors.New("invalid product type")
	}

	return nil
}

func (rs *RedeemService) DeleteRedeemCode(invoiceID string) error {
	if err := rs.DB.Where("invoice_id = ?", invoiceID).Delete(&models.RedeemCode{}).Error; err != nil {
		return err
	}

	return nil
}

func (rs *RedeemService) RedeemCode(uid uint, code string) (string, error) {
	var redeemCode models.RedeemCode

	if err := rs.DB.Where("code = ?", code).First(&redeemCode).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("redeem code not found")
		}
		return "", err
	}

	if redeemCode.IsUsed {
		return "", errors.New("code has already been redeemed")
	}

	var productData models.StripeProduct
	if err := json.Unmarshal([]byte(redeemCode.Product), &productData); err != nil {
		return "", err
	}

	if err := rs.HandleProductRedemption(uid, &productData); err != nil {
		return "", err
	}

	redeemCode.IsUsed = true
	redeemCode.UsedBy = uid
	redeemCode.UsedAt = time.Now()

	if err := rs.DB.Model(&redeemCode).Updates(map[string]interface{}{
		"is_used": redeemCode.IsUsed,
		"used_by": redeemCode.UsedBy,
		"used_at": redeemCode.UsedAt,
	}).Error; err != nil {
		return "", err
	}

	// Publish redeem code event
	if rs.EventService != nil {
		user, err := rs.UserService.GetUserByUID(uid)
		if err == nil {
			redeemData := models.RedeemCodeData{
				UID:         uid,
				Username:    user.Username,
				Code:        code,
				ProductName: productData.ProductName,
				RedeemedAt:  time.Now(),
			}

			if _, err := rs.EventService.Publish(models.EventRedeemCodeUsed, redeemData); err != nil {
				fmt.Printf("Error publishing redeem code event: %v\n", err)
			}
		}
	}

	return productData.ProductName, nil
}

func (rs *RedeemService) HandleProductRedemption(uid uint, productData *models.StripeProduct) error {
	switch productData.ProductName {
	case "Premium Upgrade":
		subscription := models.UserSubscription{
			UserID:           uid,
			SubscriptionType: "lifetime",
			Status:           "active",
			NextPaymentDate:  time.Now().AddDate(100, 0, 0),
		}

		if err := rs.BadgeService.AssignBadge(uid, "Premium"); err != nil {
			return err
		}

		var existingSub models.UserSubscription
		result := rs.DB.Where("user_id = ?", uid).First(&existingSub)

		if result.Error == nil {
			if err := rs.DB.Model(&existingSub).Updates(subscription).Error; err != nil {
				return err
			}
		} else if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			if err := rs.DB.Create(&subscription).Error; err != nil {
				return err
			}
		} else {
			return result.Error
		}
	case "Custom Badge":
		randomNumber := rand.Intn(9999)
		if err := rs.BadgeService.CreateCustomBadge(uid, fmt.Sprintf("Custom Badge %d", randomNumber), ""); err != nil {
			return errors.New("error creating custom badge")
		}

		if err := rs.UserService.AddBadgeEditCredits(uid, 8); err != nil {
			return errors.New("error adding badge edit credits")
		}
	case "Custom Badge Fee":
		if err := rs.UserService.AddBadgeEditCredits(uid, 5); err != nil {
			return errors.New("error adding badge edit credits")
		}
	default:
		return errors.New("invalid product type")
	}

	return nil
}
