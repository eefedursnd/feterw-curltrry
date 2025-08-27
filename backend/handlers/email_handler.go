package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type EmailHandler struct {
	EmailService *services.EmailService
}

func NewEmailHandler(emailService *services.EmailService) *EmailHandler {
	return &EmailHandler{EmailService: emailService}
}

func (h *EmailHandler) SendVerificationEmail(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	userID := middlewares.GetUserIDFromContext(r.Context())
	ipAddress := utils.ExtractIP(r)
	if err := h.EmailService.SendVerificationEmail(userID, request.Email, ipAddress); err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.RespondSuccess(w, "Verification email sent successfully", nil)
}

func (h *EmailHandler) VerifyEmailCode(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Code string `json:"code"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	userID := middlewares.GetUserIDFromContext(r.Context())
	if err := h.EmailService.VerifyEmailCode(userID, request.Code); err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.RespondSuccess(w, "Email verified successfully", nil)
}

func (h *EmailHandler) VerifyRegistration(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		utils.RespondError(w, http.StatusBadRequest, "Verification token is missing")
		return
	}

	pendingReg, err := h.EmailService.GetRegistrationRequest(token)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	response := map[string]string{
		"username": pendingReg.Username,
		"email":    pendingReg.Email,
	}

	utils.RespondSuccess(w, "Valid verification token", response)
}

func (h *EmailHandler) CompleteRegistration(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Token string `json:"token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	ipAddress := utils.ExtractIP(r)

	user, err := h.EmailService.CompleteRegistrationWithIP(request.Token, ipAddress)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	token, err := utils.GenerateJWT(user.UID, config.SecretKey, false)
	if err != nil {
		log.Println("Error generating token:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Error generating authentication token")
		return
	}

	sessionService := &services.SessionService{DB: h.EmailService.DB, Client: h.EmailService.Client}
	userAgent := r.Header.Get("User-Agent")
	country := r.Header.Get("CF-IPCountry")
	ip := utils.ExtractIP(r)

	if err := sessionService.CreateSession(user.UID, token, userAgent, ip, country); err != nil {
		log.Println("Error creating session:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Error creating session")
		return
	}

	utils.RespondSessionTokenCookie(w, token, false)
	utils.RespondSuccess(w, "Registration completed successfully", nil)
}
