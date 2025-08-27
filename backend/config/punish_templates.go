package config

import "time"

type PunishmentTemplate struct {
	ID            string        `json:"id"`
	Name          string        `json:"name"`
	Duration      time.Duration `json:"-"`
	DurationHours int           `json:"defaultDuration"`
	Reason        string        `json:"reason"`
	Description   string        `json:"description"`
}

var PunishmentTemplates = []PunishmentTemplate{
	{
		ID:            "tou_violation",
		Name:          "Terms of Use Violation",
		Duration:      72 * time.Hour,
		DurationHours: 72,
		Reason:        "Terms of Use Violation",
		Description:   "General violation of our Terms of Use",
	},
	{
		ID:            "inappropriate_content",
		Name:          "Inappropriate Content",
		Duration:      168 * time.Hour,
		DurationHours: 168,
		Reason:        "Inappropriate Content",
		Description:   "Profile contains inappropriate or explicit content",
	},
	{
		ID:            "harassment",
		Name:          "Harassment",
		Duration:      336 * time.Hour,
		DurationHours: 336,
		Reason:        "Harassment",
		Description:   "Harassment or targeted attacks against users",
	},
	{
		ID:            "impersonation",
		Name:          "Impersonation",
		Duration:      720 * time.Hour,
		DurationHours: 720,
		Reason:        "Impersonation",
		Description:   "Impersonating another user or organization",
	},
	{
		ID:            "spam",
		Name:          "Spam",
		Duration:      48 * time.Hour,
		DurationHours: 48,
		Reason:        "Spam",
		Description:   "Excessive promotional content or spam",
	},
	{
		ID:            "scam",
		Name:          "Scam/Phishing",
		Duration:      8760 * time.Hour,
		DurationHours: -1,
		Reason:        "Scam/Phishing",
		Description:   "Profile contains scam links or phishing attempts",
	},
	{
		ID:            "custom",
		Name:          "Custom Reason",
		Duration:      24 * time.Hour,
		DurationHours: 24,
		Reason:        "Custom",
		Description:   "Specify a custom reason for the restriction",
	},
}

func GetPunishmentTemplateByID(id string) (PunishmentTemplate, bool) {
	for _, template := range PunishmentTemplates {
		if template.ID == id {
			return template, true
		}
	}

	return PunishmentTemplate{}, false
}
