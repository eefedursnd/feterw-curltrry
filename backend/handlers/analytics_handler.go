package handlers

import (
	"net/http"
	"strconv"

	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type AnalyticsHandler struct {
	AnalyticsService *services.AnalyticsService
}

func NewAnalyticsHandler(analyticsService *services.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{
		AnalyticsService: analyticsService,
	}
}

func (ah *AnalyticsHandler) GetAnalytics(w http.ResponseWriter, r *http.Request) {
	userID := middlewares.GetUserIDFromContext(r.Context())
	daysStr := r.URL.Query().Get("days")
	days := 7
	if daysStr != "" {
		parsedDays, err := strconv.Atoi(daysStr)
		if err == nil && parsedDays > 0 {
			days = parsedDays
		}
	}

	if days > services.DataRetentionDays {
		days = services.DataRetentionDays
	}

	analytics, err := ah.AnalyticsService.GetFullAnalytics(userID, days)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to retrieve analytics data")
		return
	}

	utils.RespondSuccess(w, "Analytics data retrieved successfully", analytics)
}

func (ah *AnalyticsHandler) TrackSocialClick(w http.ResponseWriter, r *http.Request) {
	uidStr := r.URL.Query().Get("uid")
	if uidStr == "" {
		utils.RespondError(w, http.StatusBadRequest, "Missing user ID")
		return
	}

	uid, err := strconv.ParseUint(uidStr, 10, 32)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	socialType := r.URL.Query().Get("type")
	if socialType == "" {
		utils.RespondError(w, http.StatusBadRequest, "Missing social type")
		return
	}

	err = ah.AnalyticsService.TrackSocialClick(uint(uid), socialType)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to track social click")
		return
	}

	utils.RespondSuccess(w, "Social click tracked", nil)
}
