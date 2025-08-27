package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type ApplyHandler struct {
	ApplyService *services.ApplyService
	UserService  *services.UserService
}

func NewApplyHandler(applyService *services.ApplyService, userService *services.UserService) *ApplyHandler {
	return &ApplyHandler{
		ApplyService: applyService,
		UserService:  userService,
	}
}

func (ah *ApplyHandler) GetActivePositions(w http.ResponseWriter, r *http.Request) {
	positions := ah.ApplyService.GetActivePositions()
	utils.RespondSuccess(w, "Positions retrieved successfully", positions)
}

func (ah *ApplyHandler) GetPositionByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	positionID := vars["id"]

	position := ah.ApplyService.GetPositionByID(positionID)
	if position == nil {
		utils.RespondError(w, http.StatusNotFound, "Position not found")
		return
	}

	utils.RespondSuccess(w, "Position retrieved successfully", position)
}

func (ah *ApplyHandler) StartApplication(w http.ResponseWriter, r *http.Request) {
	userID := middlewares.GetUserIDFromContext(r.Context())

	var request struct {
		PositionID string `json:"position_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request format")
		return
	}

	if request.PositionID == "" {
		utils.RespondError(w, http.StatusBadRequest, "Position ID is required")
		return
	}

	session, err := ah.ApplyService.StartApplication(userID, request.PositionID)
	if err != nil {
		if err.Error() == "you already have an active application for this position" {
			utils.RespondError(w, http.StatusBadRequest, "You have already applied for this position")
			return
		}

		if matched, _ := regexp.MatchString(`you were recently rejected.*wait \d+ more days`, err.Error()); matched {
			utils.RespondError(w, http.StatusTooManyRequests, err.Error())
			return
		}

		log.Printf("Error starting application: %v", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to start application")
		return
	}

	utils.RespondSuccess(w, "Application session started", session)
}

func (ah *ApplyHandler) SaveAnswer(w http.ResponseWriter, r *http.Request) {
	userID := middlewares.GetUserIDFromContext(r.Context())

	var request struct {
		PositionID string `json:"position_id"`
		QuestionID string `json:"question_id"`
		Answer     string `json:"answer"`
		TimeSpent  int64  `json:"time_spent"` // Time in seconds
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request format")
		return
	}

	if request.PositionID == "" || request.QuestionID == "" {
		utils.RespondError(w, http.StatusBadRequest, "Position ID and Question ID are required")
		return
	}

	session, err := ah.ApplyService.SaveAnswer(userID, request.PositionID, request.QuestionID, request.Answer, request.TimeSpent)
	if err != nil {
		log.Printf("Error saving answer: %v", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to save answer")
		return
	}

	utils.RespondSuccess(w, "Answer saved successfully", session)
}

func (ah *ApplyHandler) SubmitApplication(w http.ResponseWriter, r *http.Request) {
	userID := middlewares.GetUserIDFromContext(r.Context())

	var request struct {
		PositionID string `json:"position_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request format")
		return
	}

	if request.PositionID == "" {
		utils.RespondError(w, http.StatusBadRequest, "Position ID is required")
		return
	}

	err := ah.ApplyService.SubmitApplication(userID, request.PositionID)
	if err != nil {
		log.Printf("Error submitting application: %v", err)
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.RespondSuccess(w, "Application submitted successfully", nil)
}

func (ah *ApplyHandler) GetUserApplications(w http.ResponseWriter, r *http.Request) {
	userID := middlewares.GetUserIDFromContext(r.Context())

	applications, err := ah.ApplyService.GetApplicationsByUserID(userID)
	if err != nil {
		log.Printf("Error getting user applications: %v", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to retrieve applications")
		return
	}

	type enrichedApplication struct {
		models.Application
		PositionTitle       string `json:"position_title"`
		PositionDescription string `json:"position_description"`
	}

	var enrichedApplications []enrichedApplication
	for _, app := range applications {
		position := ah.ApplyService.GetPositionByID(app.PositionID)
		if position == nil {
			continue
		}

		enriched := enrichedApplication{
			Application:         app,
			PositionTitle:       position.Title,
			PositionDescription: position.Description,
		}
		enrichedApplications = append(enrichedApplications, enriched)
	}

	utils.RespondSuccess(w, "Applications retrieved successfully", enrichedApplications)
}

func (ah *ApplyHandler) GetApplications(w http.ResponseWriter, r *http.Request) {
	userID := middlewares.GetUserIDFromContext(r.Context())
	user, _ := ah.UserService.GetUserByUID(userID)
	if !utils.HasStaffPermission(user) {
		utils.RespondError(w, http.StatusForbidden, "Insufficient permissions")
		return
	}

	vars := mux.Vars(r)
	status := vars["status"]

	var applications []models.Application
	var getErr error

	if status == "all" {
		applications, getErr = ah.ApplyService.GetApplicationsByStatus(models.StatusSubmitted)
		if getErr == nil {
			inReviewApps, err := ah.ApplyService.GetApplicationsByStatus(models.StatusInReview)
			if err == nil {
				applications = append(applications, inReviewApps...)
			}
		}
	} else {
		applications, getErr = ah.ApplyService.GetApplicationsByStatus(models.ApplicationStatus(status))
	}

	if getErr != nil {
		log.Printf("Error getting applications: %v", getErr)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to retrieve applications")
		return
	}

	type enrichedApplication struct {
		models.Application
		Username            string `json:"username"`
		DisplayName         string `json:"display_name"`
		PositionTitle       string `json:"position_title"`
		ReviewerUsername    string `json:"reviewer_username,omitempty"`
		ReviewerDisplayName string `json:"reviewer_display_name,omitempty"`
	}

	var enrichedApplications []enrichedApplication
	for _, app := range applications {
		user, err := ah.UserService.GetUserByUID(app.UserID)
		if err != nil {
			continue
		}

		position := ah.ApplyService.GetPositionByID(app.PositionID)
		if position == nil {
			continue
		}

		enriched := enrichedApplication{
			Application:   app,
			Username:      user.Username,
			DisplayName:   user.DisplayName,
			PositionTitle: position.Title,
		}

		if app.ReviewedBy != nil {
			reviewer, err := ah.UserService.GetUserByUID(*app.ReviewedBy)
			if err == nil {
				enriched.ReviewerUsername = reviewer.Username
				enriched.ReviewerDisplayName = reviewer.DisplayName
			}
		}

		enrichedApplications = append(enrichedApplications, enriched)
	}

	utils.RespondSuccess(w, "Applications retrieved successfully", enrichedApplications)
}

func (ah *ApplyHandler) GetApplicationDetail(w http.ResponseWriter, r *http.Request) {
	userID := middlewares.GetUserIDFromContext(r.Context())
	user, _ := ah.UserService.GetUserByUID(userID)
	if !utils.HasStaffPermission(user) {
		utils.RespondError(w, http.StatusForbidden, "Insufficient permissions")
		return
	}

	vars := mux.Vars(r)
	appIDStr := vars["id"]

	appID, err := strconv.ParseUint(appIDStr, 10, 32)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid application ID")
		return
	}

	application, err := ah.ApplyService.GetApplicationByID(uint(appID))
	if err != nil {
		log.Printf("Error getting application details: %v", err)
		utils.RespondError(w, http.StatusNotFound, "Application not found")
		return
	}

	applicant, err := ah.UserService.GetUserByUID(application.UserID)
	if err != nil {
		log.Printf("Error getting applicant details: %v", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to retrieve applicant details")
		return
	}

	position := ah.ApplyService.GetPositionByID(application.PositionID)
	if position == nil {
		utils.RespondError(w, http.StatusNotFound, "Position not found")
		return
	}

	type enrichedResponse struct {
		QuestionID       string `json:"question_id"`
		QuestionTitle    string `json:"question_title"`
		QuestionSubtitle string `json:"question_subtitle"`
		Answer           string `json:"answer"`
		TimeToAnswer     int64  `json:"time_to_answer"`
	}

	type enrichedApplication struct {
		Application models.Application `json:"application"`
		Applicant   struct {
			UID         uint   `json:"uid"`
			Username    string `json:"username"`
			DisplayName string `json:"display_name"`
			AvatarURL   string `json:"avatar_url,omitempty"`
			MemberSince string `json:"member_since"`
		} `json:"applicant"`
		Position  models.Position    `json:"position"`
		Responses []enrichedResponse `json:"responses"`
		Reviewer  *struct {
			UID         uint   `json:"uid"`
			Username    string `json:"username"`
			DisplayName string `json:"display_name"`
		} `json:"reviewer,omitempty"`
	}

	enriched := enrichedApplication{
		Application: *application,
		Position:    *position,
	}

	enriched.Applicant.UID = applicant.UID
	enriched.Applicant.Username = applicant.Username
	enriched.Applicant.DisplayName = applicant.DisplayName
	if applicant.Profile != nil && applicant.Profile.AvatarURL != "" {
		enriched.Applicant.AvatarURL = applicant.Profile.AvatarURL
	}
	enriched.Applicant.MemberSince = applicant.CreatedAt.Format("January 2, 2006")

	if application.ReviewedBy != nil {
		reviewer, err := ah.UserService.GetUserByUID(*application.ReviewedBy)
		if err == nil {
			enriched.Reviewer = &struct {
				UID         uint   `json:"uid"`
				Username    string `json:"username"`
				DisplayName string `json:"display_name"`
			}{
				UID:         reviewer.UID,
				Username:    reviewer.Username,
				DisplayName: reviewer.DisplayName,
			}
		}
	}

	for _, resp := range application.Responses {
		question := models.GetQuestionByID(application.PositionID, resp.QuestionID)
		if question == nil {
			continue
		}

		enrichedResp := enrichedResponse{
			QuestionID:       resp.QuestionID,
			QuestionTitle:    question.Title,
			QuestionSubtitle: question.Subtitle,
			Answer:           resp.Answer,
			TimeToAnswer:     resp.TimeToAnswer,
		}

		enriched.Responses = append(enriched.Responses, enrichedResp)
	}

	utils.RespondSuccess(w, "Application details retrieved successfully", enriched)
}

func (ah *ApplyHandler) ReviewApplication(w http.ResponseWriter, r *http.Request) {
	userID := middlewares.GetUserIDFromContext(r.Context())
	user, _ := ah.UserService.GetUserByUID(userID)
	if !utils.HasStaffPermission(user) {
		utils.RespondError(w, http.StatusForbidden, "Insufficient permissions")
		return
	}

	vars := mux.Vars(r)
	appIDStr := vars["id"]

	appID, err := strconv.ParseUint(appIDStr, 10, 32)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid application ID")
		return
	}

	var request struct {
		Status       string `json:"status"`
		FeedbackNote string `json:"feedback_note"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request format")
		return
	}

	if request.Status == "" {
		utils.RespondError(w, http.StatusBadRequest, "Status is required")
		return
	}

	if (request.Status == string(models.StatusRejected)) && request.FeedbackNote == "" {
		utils.RespondError(w, http.StatusBadRequest, "Feedback note is required for rejected or need-info applications")
		return
	}

	log.Println("Reviewing application with ID:", appID)
	log.Println("New status:", request.Status)

	err = ah.ApplyService.ReviewApplication(uint(appID), userID, models.ApplicationStatus(request.Status), request.FeedbackNote)
	if err != nil {
		log.Printf("Error reviewing application: %v", err)
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.RespondSuccess(w, "Application reviewed successfully", nil)
}
