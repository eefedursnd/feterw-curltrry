package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type Template struct {
	ID              uint        `json:"id" gorm:"primaryKey;autoIncrement"`
	CreatorID       uint        `json:"creator_id" gorm:"not null;index;constraint:OnDelete:CASCADE;"`
	Name            string      `json:"name" gorm:"not null"`
	Uses            uint        `json:"uses" gorm:"default:0"`
	Shareable       bool        `json:"shareable" gorm:"default:false"`
	PremiumRequired bool        `json:"premium_required" gorm:"default:false"`
	Tags            StringArray `json:"tags" gorm:"type:text"`
	TemplateData    string      `json:"template_data" gorm:"type:text"`
	BannerURL       string      `json:"banner_url" gorm:"default:null"`
	CreatedAt       time.Time   `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time   `json:"updated_at" gorm:"autoUpdateTime"`

	CreatorUsername string `json:"creator_username" gorm:"-"`
	CreatorAvatar   string `json:"creator_avatar" gorm:"-"`
}

type StringArray []string

func (a StringArray) Value() (driver.Value, error) {
	if a == nil {
		return nil, nil
	}
	return json.Marshal(a)
}

func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = nil
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case string:
		bytes = []byte(v)
	case []byte:
		bytes = v
	default:
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(bytes, a)
}
