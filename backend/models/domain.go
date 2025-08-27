package models

import (
	"time"
)

type Domain struct {
	ID           string    `json:"id" gorm:"primaryKey"`
	Name         string    `json:"name" gorm:"unique;not null"`
	OnlyPremium  bool      `json:"only_premium" gorm:"default:false"`
	MaxUsage     int       `json:"max_usage" gorm:"default:0"`
	CurrentUsage int       `json:"current_usage" gorm:"default:0"`
	ExpiresAt    time.Time `json:"expires_at"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type DomainAssignment struct {
	ID         uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UID        uint      `json:"uid" gorm:"not null;index:,unique,composite:idx_uid_domainid"`
	DomainID   string    `json:"domain_id" gorm:"not null;index:,unique,composite:idx_uid_domainid"`
	AssignedAt time.Time `json:"assigned_at" gorm:"not null"`
	CreatedAt  time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt  time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
