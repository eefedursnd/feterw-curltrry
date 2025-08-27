package models

type View struct {
	UserID    uint   `json:"user_id" gorm:"primaryKey"`
	ViewsData string `json:"views_data" gorm:"not null"` // JSON string
}
