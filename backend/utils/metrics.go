package utils

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// Registration metrics
	UserRegistrations = promauto.NewCounter(prometheus.CounterOpts{
		Name: "hazebio_user_registrations_total",
		Help: "Total number of user registrations",
	})

	// Session metrics
	ActiveSessions = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "hazebio_active_sessions",
		Help: "Current number of active user sessions",
	})

	// Profile view metrics
	ProfileViews = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "hazebio_profile_views_total",
			Help: "Total number of profile views per user",
		},
		[]string{"username", "uid"},
	)

	// Daily profile views (useful for rate calculations)
	DailyProfileViews = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "hazebio_daily_profile_views",
			Help: "Profile views per day per user",
		},
		[]string{"username", "uid", "date"},
	)
)
