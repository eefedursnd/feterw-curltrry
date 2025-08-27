package models

import "time"

type Badge struct {
	ID            uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Name          string    `json:"name" gorm:"unique;not null"`
	MediaURL      string    `json:"media_url" gorm:"not null"`
	IsCustom      bool      `json:"is_custom" gorm:"default:false"`
	DiscordRoleID string    `json:"discord_role_id"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
