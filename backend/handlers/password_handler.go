package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type PasswordHandler struct {
	PasswordService *services.PasswordService
	UserService     *services.UserService
	EmailService    *services.EmailService
}

func NewPasswordHandler(passwordService *services.PasswordService, userService *services.UserService, emailService *services.EmailService) *PasswordHandler {
	return &PasswordHandler{
		PasswordService: passwordService,
		UserService:     userService,
		EmailService:    emailService,
	}
}

func (ph *PasswordHandler) RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Email string `json:"email"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if request.Email == "" {
		utils.RespondError(w, http.StatusBadRequest, "Email is required")
		return
	}

	err := ph.PasswordService.InitiateReset(request.Email)
	if err != nil {
		log.Println("Error initiating password reset:", err)
	}

	utils.RespondSuccess(w, "If your email exists in our system, you will receive password reset instructions", nil)
}

func (ph *PasswordHandler) VerifyResetToken(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")

	if token == "" {
		utils.RespondError(w, http.StatusBadRequest, "Token is required")
		return
	}

	valid, err := ph.PasswordService.VerifyToken(token)
	if err != nil {
		log.Println("Error verifying reset token:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to verify token")
		return
	}

	if !valid {
		utils.RespondError(w, http.StatusBadRequest, "Invalid or expired token")
		return
	}

	utils.RespondSuccess(w, "Token is valid", nil)
}

func (ph *PasswordHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if request.Token == "" {
		utils.RespondError(w, http.StatusBadRequest, "Token is required")
		return
	}

	if request.NewPassword == "" {
		utils.RespondError(w, http.StatusBadRequest, "New password is required")
		return
	}

	err := ph.PasswordService.ResetPassword(request.Token, request.NewPassword)
	if err != nil {
		log.Println("Error resetting password:", err)
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.RespondSuccess(w, "Password has been reset successfully", nil)
}
