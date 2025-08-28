package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type UserHandler struct {
	UserService    *services.UserService
	SessionService *services.SessionService
	EmailService   *services.EmailService
}

func NewUserHandler(userService *services.UserService, emailService *services.EmailService) *UserHandler {
	return &UserHandler{
		UserService:    userService,
		SessionService: &services.SessionService{DB: userService.DB, Client: userService.Client},
		EmailService:   emailService,
	}
}

type RegisterRequest struct {
	Email      string `json:"email"`
	Username   string `json:"username"`
	Password   string `json:"password"`
	InviteCode string `json:"invite_code"`
}
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type UpdatePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type DeleteAccountRequest struct {
	Confirmed bool `json:"confirmed"`
}

/* Register a new user */
func (uh *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var user RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		log.Println("Error decoding request body:", err)
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	ipAddress := utils.ExtractIP(r)
	token, err := uh.EmailService.CreateRegistrationRequest(user.Email, user.Username, user.Password, user.InviteCode, ipAddress)
	if err != nil {
		if err.Error() == "username already exists" {
			utils.RespondError(w, http.StatusConflict, "Username already exists")
			return
		} else if err.Error() == "email already exists" {
			utils.RespondError(w, http.StatusConflict, "Email already exists")
			return
		} else if err.Error() == "username must be between 3 and 20 characters" ||
			err.Error() == "username cannot contain spaces" ||
			err.Error() == "username must be plain text" ||
			err.Error() == "username is a reserved word" ||
			err.Error() == "username contains a reserved word" ||
			err.Error() == "invite code is required" ||
			err.Error() == "invalid invite code" ||
			err.Error() == "invite code is expired or has reached maximum uses" {
			utils.RespondError(w, http.StatusBadRequest, err.Error())
			return
		} else if err.Error() == "registration rate limit exceeded, please try again later" ||
			err.Error() == "email rate limit exceeded, please try again later" {
			utils.RespondError(w, http.StatusTooManyRequests, err.Error())
			return
		}

		log.Println("Error initiating registration:", user.Username, err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Verification email sent. Please check your inbox to complete registration", map[string]string{
		"token": token,
	})
}

/* Login a user */
func (uh *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var userRequest LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&userRequest); err != nil {
		log.Println("Error decoding request body:", err)
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	ipAddress := utils.ExtractIP(r)
	token, user, err := uh.UserService.LoginUser(userRequest.Username, userRequest.Password, ipAddress)
	if err != nil {
		if err.Error() == "invalid password" {
			utils.RespondError(w, http.StatusUnauthorized, "invalid password")
			return
		}

		if err.Error() == "user not found" {
			utils.RespondError(w, http.StatusNotFound, "user does not exist")
			return
		}

		log.Println("Error logging in user:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	if token == "" {
		log.Println("Error generating token")
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	if user.MFAEnabled {
		utils.RespondSuccess(w, "MFA required", map[string]uint{"uid": user.UID})
		return
	}

	userAgent := r.Header.Get("User-Agent")
	Country := r.Header.Get("CF-IPCountry")
	ip := utils.ExtractIP(r)
	if err := uh.SessionService.CreateSession(user.UID, token, userAgent, ip, Country); err != nil {
		log.Println("Error creating session:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSessionTokenCookie(w, token, false)
	utils.RespondSuccess(w, "User logged in successfully", nil)
}

/* Logout a user */
func (uh *UserHandler) Logout(w http.ResponseWriter, r *http.Request) {
	sessionCookie, err := r.Cookie("sessionToken")
	if err != nil {
		utils.RespondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	uid := middlewares.GetUserIDFromContext(r.Context())
	err = uh.SessionService.DeleteSession(uid, sessionCookie.Value)
	if err != nil {
		log.Println("Error deleting session:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSessionTokenCookie(w, "", true)
	utils.RespondSuccess(w, "User logged out successfully", nil)
}

/* Get current user */
func (uh *UserHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	user, err := uh.UserService.GetUserByUID(uid)
	if err != nil {
		log.Println("Error getting user:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	user.Password = ""

	utils.RespondSuccess(w, "User found", user)
}

/* Update password */
func (uh *UserHandler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	var updatePasswordRequest UpdatePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&updatePasswordRequest); err != nil {
		log.Println("Error decoding request body:", err)
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	err := uh.UserService.UpdatePassword(uid, updatePasswordRequest.CurrentPassword, updatePasswordRequest.NewPassword)
	if err != nil {
		if err.Error() == "invalid password" {
			utils.RespondError(w, http.StatusUnauthorized, "invalid password")
			return
		}

		log.Println("Error updating password:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Password updated successfully", nil)
}

/* Update user by UID */
func (uh *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	var fields map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&fields); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	err := uh.UserService.UpdateUserFields(uid, fields)
	if err != nil {
		if err.Error() == "username must be between 3 and 20 characters" ||
			err.Error() == "username cannot contain spaces" ||
			err.Error() == "username must be plain text" ||
			err.Error() == "username is a reserved word" ||
			err.Error() == "username contains a reserved word" {
			utils.RespondError(w, http.StatusBadRequest, err.Error())
			return
		} else if err.Error() == "alias must be between 3 and 20 characters" ||
			err.Error() == "alias cannot contain spaces" ||
			err.Error() == "alias must be plain text" ||
			err.Error() == "alias is a reserved word" ||
			err.Error() == "alias contains a reserved word" {
			utils.RespondError(w, http.StatusBadRequest, err.Error())
			return
		} else if err.Error() == "displayname must be between 3 and 20 characters" ||
			err.Error() == "displayname cannot contain spaces" ||
			err.Error() == "displayname must be plain text" ||
			err.Error() == "displayname is a reserved word" ||
			err.Error() == "displayname contains a reserved word" {
			utils.RespondError(w, http.StatusBadRequest, err.Error())
			return
		} else if err.Error() == "username already exists" || err.Error() == "alias already exists" {
			utils.RespondError(w, http.StatusConflict, err.Error())
			return
		} else if strings.Contains(err.Error(), "cooldown:") {
			utils.RespondError(w, http.StatusTooManyRequests, err.Error())
			return
		} else {
			log.Println("Error updating user:", err)
			utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
			return
		}
	}

	utils.RespondSuccess(w, "User updated", nil)
}

/* Get site stats */
func (uh *UserHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := uh.UserService.GetStats()
	if err != nil {
		log.Println("Error getting stats:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Stats retrieved successfully", stats)
}

/* Delete user account */
func (uh *UserHandler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	var deleteRequest DeleteAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&deleteRequest); err != nil {
		log.Println("Error decoding request body:", err)
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if !deleteRequest.Confirmed {
		utils.RespondError(w, http.StatusBadRequest, "Account deletion must be confirmed")
		return
	}

	err := uh.UserService.DeleteAccount(uid)
	if err != nil {
		log.Printf("Error deleting account for user %d: %v", uid, err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSessionTokenCookie(w, "", true)
	utils.RespondSuccess(w, "Account deleted successfully", nil)
}
