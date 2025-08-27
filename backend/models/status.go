package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

type Status struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Type      string    `json:"type" gorm:"type:varchar(255);not null"`
	Reason    string    `json:"reason" gorm:"type:varchar(255);not null"`
	StartDate time.Time `json:"start_date" gorm:"not null"`
	EndDate   time.Time `json:"end_date" gorm:"not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

const (
	StatusTypeMaintenance = "maintenance"
)

func (s *Status) BeforeCreate(tx *gorm.DB) (err error) {
	now := time.Now()

	if s.StartDate.Before(now) {
		return fmt.Errorf("start date cannot be in the past")
	}

	if s.EndDate.Before(s.StartDate) {
		return fmt.Errorf("end date must be after start date")
	}

	return nil
}

func (s *Status) AfterFind(tx *gorm.DB) (err error) {
	now := time.Now()

	if now.After(s.EndDate) {
		tx.Delete(s)
		return gorm.ErrRecordNotFound
	}
	return nil
}
