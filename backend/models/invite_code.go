package models

import (
	"time"
)

type InviteCode struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Code        string    `json:"code" gorm:"unique;not null;type:varchar(20)"`
	CreatedBy   uint      `json:"created_by" gorm:"not null"` // User ID who created this code
	UsedBy      *uint     `json:"used_by" gorm:"default:null"` // User ID who used this code (if single use)
	MaxUses     int       `json:"max_uses" gorm:"default:1"`   // Maximum number of uses (0 = unlimited)
	CurrentUses int       `json:"current_uses" gorm:"default:0"` // Current number of uses
	ExpiresAt   *time.Time `json:"expires_at" gorm:"default:null"` // When the code expires
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relations
	Creator *User `json:"creator" gorm:"foreignKey:CreatedBy;references:UID"`
	User    *User `json:"user" gorm:"foreignKey:UsedBy;references:UID"`
}

// IsValid checks if the invite code is still valid
func (ic *InviteCode) IsValid() bool {
	// Check if expired
	if ic.ExpiresAt != nil && time.Now().After(*ic.ExpiresAt) {
		return false
	}

	// Check if max uses reached
	if ic.MaxUses > 0 && ic.CurrentUses >= ic.MaxUses {
		return false
	}

	return true
}

// CanBeUsed checks if the code can be used by a specific user
func (ic *InviteCode) CanBeUsed() bool {
	return ic.IsValid()
}

// Use increments the usage count
func (ic *InviteCode) Use(userID uint) {
	ic.CurrentUses++
	if ic.MaxUses == 1 {
		ic.UsedBy = &userID
	}
}
