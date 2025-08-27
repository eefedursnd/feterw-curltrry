package services

import (
	"errors"
	"log"
	"time"

	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/utils"
	"gorm.io/gorm"
)

type StatusService struct {
	DB *gorm.DB
}

func NewStatusService(db *gorm.DB) *StatusService {
	return &StatusService{
		DB: db,
	}
}

func (ss *StatusService) CreateStatus(statusType string, reason string, startDate string, endDate string) (uint, error) {
	log.Println(startDate, endDate)
	statusModel := &models.Status{
		Type:      statusType,
		Reason:    reason,
		StartDate: utils.ParseTime(startDate),
		EndDate:   utils.ParseTime(endDate),
	}

	if err := ss.DB.Create(&statusModel).Error; err != nil {
		log.Println("Error creating status:", err)
		return 0, err
	}

	return statusModel.ID, nil
}

func (ss *StatusService) DeleteStatus(id uint) error {
	if err := ss.DB.Where("id = ?", id).Delete(&models.Status{}).Error; err != nil {
		log.Println("Error deleting status:", err)
		return err
	}

	return nil
}

func (ss *StatusService) GetStatus(id uint) (*models.Status, error) {
	var status models.Status

	if err := ss.DB.Where("id = ?", id).First(&status).Error; err != nil {
		log.Println("Error getting status:", err)
		return nil, err
	}

	return &status, nil
}

func (ss *StatusService) GetActiveStatus() (*models.Status, error) {
	var status models.Status

	if err := ss.DB.Where("start_date <= ? AND end_date >= ?", time.Now(), time.Now()).First(&status).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("no active status found")
		}
		log.Println("Error getting active status:", err)
		return nil, err
	}

	return &status, nil
}

func (ss *StatusService) GetUpcomingStatus() ([]*models.Status, error) {
	var statuses []*models.Status

	if err := ss.DB.Where("start_date > ?", time.Now()).Limit(2).Find(&statuses).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("no upcoming statuses found")
		}

		log.Println("Error getting upcoming statuses:", err)
		return nil, err
	}

	return statuses, nil
}
