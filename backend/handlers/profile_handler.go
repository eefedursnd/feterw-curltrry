package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type ProfileHandler struct {
	ProfileService *services.ProfileService
}

func NewProfileHandler(profileService *services.ProfileService) *ProfileHandler {
	return &ProfileHandler{
		ProfileService: profileService,
	}
}

/* Get public profile by identifier */
func (ph *ProfileHandler) GetPublicProfile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	identifier := vars["identifier"]

	profile, err := ph.ProfileService.GetPublicProfile(identifier)
	if err != nil {
		log.Println("Error getting user profile:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Profile found", profile)
}

/* Update user profile */
func (ph *ProfileHandler) UpdateUserProfile(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	var fields map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&fields); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updatedFields, err := ph.ProfileService.UpdateUserProfileFields(uid, fields)
	if err != nil {
		if err.Error() == "updating to this username effect requires premium" {
			utils.RespondError(w, http.StatusForbidden, "Updating to this username effect requires premium")
			return
		}

		if err.Error() == "updating to this font requires premium" {
			utils.RespondError(w, http.StatusForbidden, "Updating to this font requires premium")
			return
		}

		log.Println("Error updating user profile:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Profile updated", updatedFields)
}
