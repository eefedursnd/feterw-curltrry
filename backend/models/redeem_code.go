package models

import "time"

type RedeemCode struct {
	Code    string `json:"code" gorm:"primaryKey"`
	Product string `json:"data" gorm:"not null"` // ProductData as JSON string
	IsUsed  bool   `json:"is_used" gorm:"not null:default:false"`
	UsedBy  uint   `json:"used_by" gorm:"default:null"`

	UsedAt    time.Time `json:"used_at" gorm:"default:null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}
