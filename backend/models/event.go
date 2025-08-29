package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type EventType string

const (
	EventUserRegistered     EventType = "user.registered"
	EventUserLoggedIn       EventType = "user.logged_in"
	EventAltAccountDetected EventType = "user.alt_account_detected"
	EventUserDeleted        EventType = "user.deleted"
	EventDiscordLinked      EventType = "user.discord_linked"
	EventRedeemCodeUsed     EventType = "redeem.code_used"
)

type Event struct {
	ID          string     `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Type        EventType  `json:"type" gorm:"type:varchar(50);index;not null"`
	Data        EventData  `json:"data" gorm:"type:json;not null"`
	Processed   bool       `json:"processed" gorm:"default:false"`
	ProcessedAt *time.Time `json:"processed_at" gorm:"default:null"`
	CreatedAt   time.Time  `json:"created_at" gorm:"autoCreateTime"`
}

type EventData map[string]interface{}

func (ed *EventData) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal EventData value")
	}

	return json.Unmarshal(bytes, &ed)
}

func (ed EventData) Value() (driver.Value, error) {
	return json.Marshal(ed)
}

type EventSubscription struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	EventType EventType `json:"event_type" gorm:"type:varchar(50);not null;index"`
	ServiceID string    `json:"service_id" gorm:"type:varchar(100);not null;index"`
	Active    bool      `json:"active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type UserRegistrationData struct {
	UID      uint   `json:"uid"`
	Username string `json:"username"`
}

type UserLoginData struct {
	UID       uint      `json:"uid"`
	Username  string    `json:"username"`
	IPAddress string    `json:"ip_address,omitempty"`
	UserAgent string    `json:"user_agent,omitempty"`
	LoginTime time.Time `json:"login_time"`
}

type AltAccountData struct {
	UID             uint                 `json:"uid"`              // Current user's UID
	Username        string               `json:"username"`         // Current user's username
	IPAddress       string               `json:"ip_address"`       // The IP address that triggered detection
	AltAccounts     []AltAccountInstance `json:"alt_accounts"`     // List of potential alt accounts
	DetectionSource string               `json:"detection_source"` // "registration", "login", "manual"
	DetectionTime   time.Time            `json:"detection_time"`
	Confidence      float64              `json:"confidence,omitempty"` // 0.0-1.0 confidence score
	Notes           string               `json:"notes,omitempty"`      // Additional notes
}

type AltAccountInstance struct {
	UID             uint     `json:"uid"`      // The alt account's UID
	Username        string   `json:"username"` // The alt account's username
	LastSeen        string   `json:"last_seen,omitempty"`
	MatchReason     string   `json:"match_reason,omitempty"` // "ip", "browser_fingerprint", "email", etc.
	SharedIPs       []string `json:"shared_ips,omitempty"`
	ConfidenceScore float64  `json:"confidence_score,omitempty"` // 0.0-1.0
}

type DiscordLinkedData struct {
	UID             uint      `json:"uid"`
	Username        string    `json:"username"`
	DiscordID       string    `json:"discord_id"`
	DiscordUsername string    `json:"discord_username"`
	LinkedAt        time.Time `json:"linked_at"`
}

type RedeemCodeData struct {
	UID         uint      `json:"uid"`
	Username    string    `json:"username"`
	Code        string    `json:"code"`
	ProductName string    `json:"product_name"`
	RedeemedAt  time.Time `json:"redeemed_at"`
}
