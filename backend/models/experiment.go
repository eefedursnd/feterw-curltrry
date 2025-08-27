package models

import "time"

type Experiment struct {
	Name             string    `json:"name"`
	FeatureKey       string    `json:"feature_key"`
	Description      string    `json:"description"`
	StartDate        time.Time `json:"start_date"`
	EndDate          time.Time `json:"end_date"`
	InitialUserCount int       `json:"initial_user_count"`
}
