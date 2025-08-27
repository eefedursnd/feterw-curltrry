package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type SocialHandler struct {
	SocialService *services.SocialService
}

func NewSocialHandler(socialService *services.SocialService) *SocialHandler {
	return &SocialHandler{
		SocialService: socialService,
	}
}

/* Create a new social link */
func (sh *SocialHandler) CreateUserSocial(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	var social models.UserSocial
	if err := json.NewDecoder(r.Body).Decode(&social); err != nil {
		log.Println("Error decoding request body:", err)
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	social.UID = uid

	if err := sh.SocialService.CreateUserSocial(&social); err != nil {
		log.Println("Error creating user social:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Social link created successfully", social)
}

/* Get all social links for a user (Public) */
func (sh *SocialHandler) GetUserSocialsPublic(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	uidStr, ok := vars["uid"]
	if !ok {
		utils.RespondError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	uid, err := strconv.Atoi(uidStr)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	socials, err := sh.SocialService.GetUserSocials(uint(uid))
	if err != nil {
		log.Println("Error getting user socials:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Social links found", socials)
}

/* Update a social link */
func (sh *SocialHandler) UpdateUserSocial(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	socialID := utils.StringToUint(vars["socialID"])
	if socialID == 0 {
		utils.RespondError(w, http.StatusBadRequest, "Social Id is required")
		return
	}

	var social models.UserSocial
	if err := json.NewDecoder(r.Body).Decode(&social); err != nil {
		log.Println("Error decoding request body:", err)
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	social.UID = uid
	social.ID = socialID

	if err := sh.SocialService.UpdateUserSocial(&social); err != nil {
		log.Println("Error updating user social:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Social link updated successfully", nil)
}

/* Delete a social link */
func (sh *SocialHandler) DeleteUserSocial(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	socialID := utils.StringToUint(vars["socialID"])
	if socialID == 0 {
		utils.RespondError(w, http.StatusBadRequest, "Social Id is required")
		return
	}

	if err := sh.SocialService.DeleteUserSocial(uid, socialID); err != nil {
		log.Println("Error deleting user social:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Social link deleted successfully", nil)
}

/* Reorder social links */
func (sh *SocialHandler) ReorderUserSocial(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Socials []services.SocialOrderUpdate `json:"socials"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	uid := middlewares.GetUserIDFromContext(r.Context())
	if err := sh.SocialService.ReorderUserSocials(uid, req.Socials); err != nil {
		log.Println("Error reordering user social:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Social link reordered successfully", nil)
}
