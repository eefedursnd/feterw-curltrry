package models

import "time"

type Punishment struct {
	ID             uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID         uint      `json:"user_id" gorm:"not null;index"`
	StaffID        uint      `json:"staff_id" gorm:"not null"`
	Reason         string    `json:"reason" gorm:"not null"`
	Details        string    `json:"details" gorm:"type:text"`
	CreatedAt      time.Time `json:"created_at" gorm:"autoCreateTime"`
	EndDate        time.Time `json:"end_date"`
	Active         bool      `json:"active" gorm:"default:true"`
	PunishmentType string    `json:"punishment_type" gorm:"default:full"` // full or partial

	/* Virtual fields */
	StaffName string `json:"staff_name" gorm:"-"`
}

type ModerationLog struct {
	ID           uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	ActionType   string    `json:"action_type" gorm:"not null"` // restrict or unrestrict
	StaffID      uint      `json:"staff_id" gorm:"not null"`
	TargetID     uint      `json:"target_id" gorm:"not null"`
	PunishmentID uint      `json:"punishment_id"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
}

type Report struct {
	ID             uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	ReportedUserID uint      `json:"reported_user_id" gorm:"not null;index"`
	ReporterUserID uint      `json:"reporter_user_id" gorm:"not null"`
	Reason         string    `json:"reason" gorm:"not null"`
	Details        string    `json:"details" gorm:"type:text"`
	Handled        bool      `json:"handled" gorm:"default:false"`
	HandledBy      uint      `json:"handled_by"`
	CreatedAt      time.Time `json:"created_at" gorm:"autoCreateTime"`
}

type ReportWithDetails struct {
	Report
	ReportedUsername    string   `json:"reported_username"`
	ReportedDisplayName string   `json:"reported_display_name"`
	ReporterUsername    string   `json:"reporter_username"`
	TotalReports        int      `json:"total_reports"`
	HasActivePunishment bool     `json:"has_active_punishment"`
	OtherReporters      []string `json:"other_reporters"`
}

var validReportReasons = []string{
	"Spam",
	"Inappropriate Content",
	"Harassment",
	"Impersonation",
	"Scam or Fraud",
	"Other",
}

func IsValidReportReason(reason string) bool {
	for _, validReason := range validReportReasons {
		if reason == validReason {
			return true
		}
	}
	return false
}
