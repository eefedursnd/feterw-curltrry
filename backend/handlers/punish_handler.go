package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type PunishHandler struct {
	PunishService  *services.PunishService
	RedeemService  *services.RedeemService
	UserService    *services.UserService
	ProfileService *services.ProfileService
}

type restrictUserRequest struct {
	UserID       uint   `json:"userId"`
	TemplateID   string `json:"templateId"`
	Reason       string `json:"reason,omitempty"`
	Details      string `json:"details"`
	Duration     int    `json:"duration"`
	RestrictType string `json:"restrictType"`
}

type createReportRequest struct {
	ReportedUsername string `json:"reportedUsername"`
	Reason           string `json:"reason"`
	Details          string `json:"details"`
}

func NewPunishHandler(punishService *services.PunishService, redeemService *services.RedeemService) *PunishHandler {
	return &PunishHandler{
		PunishService:  punishService,
		RedeemService:  redeemService,
		UserService:    &services.UserService{DB: punishService.DB, Client: punishService.Client},
		ProfileService: &services.ProfileService{DB: punishService.DB, Client: punishService.Client},
	}
}

func (ph *PunishHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	staffUID := middlewares.GetUserIDFromContext(r.Context())
	staffUser, _ := ph.UserService.GetUserByUID(staffUID)

	if !utils.HasStaffPermission(staffUser) {
		utils.RespondError(w, http.StatusForbidden, "Insufficient permissions")
		return
	}

	query := r.URL.Query().Get("query")
	if query == "" {
		utils.RespondError(w, http.StatusBadRequest, "Query parameter is required")
		return
	}

	users, err := ph.UserService.SearchUsers(query, 10)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to search users: "+err.Error())
		return
	}

	if staffUser.StaffLevel < utils.StaffLevelModerator {
		for i := range users {
			users[i].Sessions = nil

			if users[i].HasActivePunishment() {
				punishment := users[i].GetActivePunishment()
				punishment.Details = ""

				newPunishments := []models.Punishment{*punishment}
				users[i].Punishments = &newPunishments
			}
		}
	}

	utils.RespondSuccess(w, "Users retrieved successfully", users)
}

func (ph *PunishHandler) RestrictUser(w http.ResponseWriter, r *http.Request) {
	staffUID := middlewares.GetUserIDFromContext(r.Context())
	staffUser, _ := ph.UserService.GetUserByUID(staffUID)

	if !utils.HasModeratorPermission(staffUser) {
		utils.RespondError(w, http.StatusForbidden, "Insufficient permissions")
		return
	}

	var req restrictUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.UserID == 0 || req.Details == "" {
		utils.RespondError(w, http.StatusBadRequest, "User ID and details are required")
		return
	}

	if req.TemplateID == "custom" {
		if req.Reason == "" {
			utils.RespondError(w, http.StatusBadRequest, "Reason is required for custom template")
			return
		}

		var endDate time.Time
		if req.Duration == -1 {
			endDate = time.Now().AddDate(100, 0, 0)
		} else {
			endDate = time.Now().Add(time.Duration(req.Duration) * time.Hour)
		}

		punishment := &models.Punishment{
			UserID:         req.UserID,
			StaffID:        staffUID,
			Reason:         req.Reason,
			Details:        req.Details,
			EndDate:        endDate,
			Active:         true,
			PunishmentType: req.RestrictType,
		}

		if err := ph.PunishService.CreatePunishment(punishment); err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to create restriction: "+err.Error())
			return
		}

		moderationLog := &models.ModerationLog{
			ActionType:   "restrict",
			StaffID:      staffUID,
			TargetID:     req.UserID,
			PunishmentID: punishment.ID,
		}

		if err := ph.PunishService.DB.Create(moderationLog).Error; err != nil {
			log.Printf("Error logging moderation action: %v", err)
		}

		utils.RespondSuccess(w, "Restriction created successfully", punishment)
		return
	}

	punishment, err := ph.PunishService.CreatePunishmentFromTemplate(
		req.UserID,
		req.TemplateID,
		req.Details,
		req.Duration,
		staffUser.UID,
		req.RestrictType,
	)

	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to create restriction: "+err.Error())
		return
	}

	utils.RespondSuccess(w, "Restriction created successfully", punishment)
}

func (ph *PunishHandler) UnrestrictUser(w http.ResponseWriter, r *http.Request) {
	staffUID := middlewares.GetUserIDFromContext(r.Context())
	staffUser, _ := ph.UserService.GetUserByUID(staffUID)

	if !utils.HasHeadModPermission(staffUser) {
		utils.RespondError(w, http.StatusForbidden, "Insufficient permissions")
		return
	}

	vars := mux.Vars(r)
	id, err := strconv.ParseUint(vars["id"], 10, 64)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid punishment ID")
		return
	}

	if err := ph.PunishService.DeactivatePunishment(uint(id), staffUser.UID); err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to deactivate punishment: "+err.Error())
		return
	}

	utils.RespondSuccess(w, "Punishment successfully deactivated", nil)
}

func (ph *PunishHandler) GetPunishmentTemplates(w http.ResponseWriter, r *http.Request) {
	staffUID := middlewares.GetUserIDFromContext(r.Context())
	staffUser, _ := ph.UserService.GetUserByUID(staffUID)

	if !utils.HasStaffPermission(staffUser) {
		utils.RespondError(w, http.StatusForbidden, "Insufficient permissions")
		return
	}

	utils.RespondSuccess(w, "Punishment templates retrieved successfully", config.PunishmentTemplates)
}

func (ph *PunishHandler) CreatePayPalChargebackPunishment(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("X-API-Key") != config.APIKey {
		utils.RespondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	vars := mux.Vars(r)
	userID := utils.StringToUint(vars["user_id"])

	if userID == 0 {
		utils.RespondError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	if err := ph.PunishService.CreateChargebackPunishment(userID); err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to create chargeback punishment: "+err.Error())
		return
	}

	utils.RespondSuccess(w, "Chargeback punishment created successfully", nil)
}

func (ph *PunishHandler) CreateReport(w http.ResponseWriter, r *http.Request) {
	reporterUID := middlewares.GetUserIDFromContext(r.Context())

	var req createReportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.ReportedUsername == "" || req.Reason == "" {
		utils.RespondError(w, http.StatusBadRequest, "Reported user name and reason are required")
		return
	}

	report, err := ph.PunishService.CreateReport(reporterUID, req.ReportedUsername, req.Reason, req.Details)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.RespondSuccess(w, "Report submitted successfully", report)
}

func (ph *PunishHandler) GetOpenReports(w http.ResponseWriter, r *http.Request) {
	staffUID := middlewares.GetUserIDFromContext(r.Context())
	staffUser, _ := ph.UserService.GetUserByUID(staffUID)

	if !utils.HasStaffPermission(staffUser) {
		utils.RespondError(w, http.StatusForbidden, "Insufficient permissions")
		return
	}

	reports, err := ph.PunishService.GetOpenReports()
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get reports: "+err.Error())
		return
	}

	if !utils.HasModeratorPermission(staffUser) {
		reports = nil
	}

	utils.RespondSuccess(w, "Reports retrieved successfully", reports)
}

func (ph *PunishHandler) HandleReport(w http.ResponseWriter, r *http.Request) {
	staffUID := middlewares.GetUserIDFromContext(r.Context())
	staffUser, _ := ph.UserService.GetUserByUID(staffUID)

	if !utils.HasStaffPermission(staffUser) {
		utils.RespondError(w, http.StatusForbidden, "Insufficient permissions")
		return
	}

	vars := mux.Vars(r)
	reportID, err := strconv.ParseUint(vars["id"], 10, 64)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid report ID")
		return
	}

	if err := ph.PunishService.HandleReport(uint(reportID), staffUID); err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to handle report: "+err.Error())
		return
	}

	utils.RespondSuccess(w, "Report marked as handled", nil)
}

func (ph *PunishHandler) AssignReportToStaff(w http.ResponseWriter, r *http.Request) {
	staffUID := middlewares.GetUserIDFromContext(r.Context())
	staffUser, _ := ph.UserService.GetUserByUID(staffUID)

	if !utils.HasStaffPermission(staffUser) {
		utils.RespondError(w, http.StatusForbidden, "Insufficient permissions")
		return
	}

	vars := mux.Vars(r)
	reportID, err := strconv.ParseUint(vars["id"], 10, 64)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid report ID")
		return
	}

	if err := ph.PunishService.AssignReportToStaff(uint(reportID), staffUID); err != nil {
		if err.Error() == "report is already being handled by another staff member" ||
			strings.HasPrefix(err.Error(), "report is already being handled by") {
			utils.RespondError(w, http.StatusConflict, err.Error())
		} else if err.Error() == "report has already been handled" {
			utils.RespondError(w, http.StatusConflict, err.Error())
		} else {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to assign report: "+err.Error())
		}
		return
	}

	utils.RespondSuccess(w, "Report assigned successfully", nil)
}

func (ph *PunishHandler) GetOpenReportCount(w http.ResponseWriter, r *http.Request) {
	staffUID := middlewares.GetUserIDFromContext(r.Context())
	staffUser, _ := ph.UserService.GetUserByUID(staffUID)

	if !utils.HasStaffPermission(staffUser) {
		utils.RespondError(w, http.StatusForbidden, "Insufficient permissions")
		return
	}

	count, err := ph.PunishService.GetOpenReportCount()
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get report count: "+err.Error())
		return
	}

	utils.RespondSuccess(w, "Report count retrieved successfully", map[string]int64{"count": count})
}

func (ph *PunishHandler) GetReport(w http.ResponseWriter, r *http.Request) {
	staffUID := middlewares.GetUserIDFromContext(r.Context())
	staffUser, _ := ph.UserService.GetUserByUID(staffUID)

	if !utils.HasStaffPermission(staffUser) {
		utils.RespondError(w, http.StatusForbidden, "Insufficient permissions")
		return
	}

	vars := mux.Vars(r)
	reportID, err := strconv.ParseUint(vars["id"], 10, 64)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid report ID")
		return
	}

	report, err := ph.PunishService.GetReport(uint(reportID), staffUID)
	if err != nil {
		if err.Error() == "report not found" {
			utils.RespondError(w, http.StatusNotFound, "Report not found")
		} else if err.Error() == "this report is assigned to another staff member" {
			utils.RespondError(w, http.StatusForbidden, err.Error())
		} else {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to get report: "+err.Error())
		}
		return
	}

	utils.RespondSuccess(w, "Report retrieved successfully", report)
}
