package models

import "time"

type PunishmentWithUser struct {
	ID             uint      `json:"id"`
	UserID         uint      `json:"userId"`
	Reason         string    `json:"reason"`
	Details        string    `json:"details"`
	CreatedAt      time.Time `json:"createdAt"`
	EndDate        time.Time `json:"expiresAt"`
	Active         bool      `json:"active"`
	StaffID        uint      `json:"createdBy"`
	PunishmentType string    `json:"punishmentType"`
	Username       string    `json:"username"`
	StaffUsername  string    `json:"staffUsername"`
}

type ModerationDashboard struct {
	TotalActions        int                   `json:"totalActions"`
	RestrictionsIssued  int                   `json:"restrictionsIssued"`
	RestrictionsRemoved int                   `json:"restrictionsRemoved"`
	ReportsHandled      int                   `json:"reportsHandled"`
	RecentActions       []*ModerationAction   `json:"recentActions"`
	PendingReports      []*ReportSummary      `json:"pendingReports"`
	ActiveRestrictions  []*PunishmentWithUser `json:"activeRestrictions"`
}

type ModerationAction struct {
	ID          uint      `json:"id" gorm:"column:id"`
	Type        string    `json:"type" gorm:"column:type"`
	Username    string    `json:"username" gorm:"column:username"`
	Reason      string    `json:"reason" gorm:"column:reason"`
	Timestamp   time.Time `json:"timestamp" gorm:"column:timestamp"`
	StaffMember string    `json:"staffMember" gorm:"column:staff_member"`
}

type ReportSummary struct {
	ID             int       `json:"id"`
	ReportedUser   string    `json:"reportedUser"`
	ReportedUserID uint      `json:"reportedUserId"`
	ReportReason   string    `json:"reportReason"`
	ReportCount    int       `json:"reportCount"`
	ReportedAt     time.Time `json:"reportedAt"`
}

type UserDetailsForModeration struct {
	UID                uint                  `json:"uid"`
	Username           string                `json:"username"`
	DisplayName        string                `json:"display_name"`
	CreatedAt          time.Time             `json:"created_at"`
	LastSeen           time.Time             `json:"last_seen"`
	Profile            ProfileForModeration  `json:"profile"`
	Premium            bool                  `json:"premium"`
	RestrictionHistory []*PunishmentWithUser `json:"restriction_history"`
	IPAddresses        []string              `json:"ip_addresses"`
	Badges             []UserBadge           `json:"badges"`
}

type ProfileForModeration struct {
	Bio          string `json:"bio"`
	Views        uint   `json:"views"`
	LinksClicked uint   `json:"links_clicked"`
	AvatarURL    string `json:"avatar_url"`
}
