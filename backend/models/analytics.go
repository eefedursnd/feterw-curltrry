package models

import (
	"time"
)

type Analytics struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint      `json:"user_id" gorm:"index;not null"`
	Date      time.Time `json:"date" gorm:"index;not null"`
	Type      string    `json:"type" gorm:"index;not null"` // "country", "device", "referrer", "social", "view"
	Name      string    `json:"name" gorm:"not null"`       // "TR", "desktop", "google.com", etc.
	Count     int64     `json:"count" gorm:"default:0"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for Analytics
func (Analytics) TableName() string {
	return "analytics"
}
