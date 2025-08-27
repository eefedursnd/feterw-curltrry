package handlers

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type SessionHandler struct {
	SessionService *services.SessionService
}

func NewSessionHandler(sessionService *services.SessionService) *SessionHandler {
	return &SessionHandler{
		SessionService: sessionService,
	}
}

/* Get all sessions */
func (sh *SessionHandler) GetAllSessions(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	sessionToken := middlewares.GetSessionTokenFromContext(r.Context())

	sessions, err := sh.SessionService.GetAllSessions(uid, sessionToken)
	if err != nil {
		log.Println("Error getting all sessions:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Sessions retrieved successfully", sessions)
}

/* Logout all sessions */
func (sh *SessionHandler) LogoutAllSessions(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	sessionToken := middlewares.GetSessionTokenFromContext(r.Context())
	err := sh.SessionService.LogoutAllSessions(uint(uid), sessionToken)
	if err != nil {
		log.Println("Error logging out all sessions:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSessionTokenCookie(w, "", true)
	utils.RespondSuccess(w, "Logged out all sessions", nil)
}

/* Delete session */
func (sh *SessionHandler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionToken := vars["session_token"]

	uid := middlewares.GetUserIDFromContext(r.Context())
	err := sh.SessionService.DeleteSession(uid, sessionToken)
	if err != nil {
		log.Println("Error deleting session:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Session deleted", nil)
}
