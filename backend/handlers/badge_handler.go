package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type BadgeHandler struct {
	BadgeService *services.BadgeService
}

func NewBadgeHandler(badgeService *services.BadgeService) *BadgeHandler {
	return &BadgeHandler{
		BadgeService: badgeService,
	}
}

/* Reorder user badges */
func (bh *BadgeHandler) ReorderUserBadge(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Badges []services.BadgeOrderUpdate `json:"badges"`
	}

	prettyJsonBODY, _ := json.MarshalIndent(r.Body, "", "    ")
	log.Println("ReorderUserBadge: ", string(prettyJsonBODY))

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	uid := middlewares.GetUserIDFromContext(r.Context())
	if err := bh.BadgeService.ReorderUserBadges(uid, req.Badges); err != nil {
		log.Println("Error reordering user badge:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Badge reordered successfully", nil)
}

/* Edit custom badge */
func (bh *BadgeHandler) EditCustomBadge(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	badgeID := utils.StringToUint(vars["badgeID"])
	if badgeID == 0 {
		utils.RespondError(w, http.StatusBadRequest, "Badge id is required")
		return
	}

	var req struct {
		NewName     string `json:"newName"`
		NewMediaURL string `json:"newMediaURL"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	log.Println("Editing custom badge:", req)

	if req.NewName == "" && req.NewMediaURL == "" {
		utils.RespondError(w, http.StatusBadRequest, "New name or mediaURL is required")
		return
	}

	if err := bh.BadgeService.EditCustomBadge(uid, badgeID, req.NewName, req.NewMediaURL); err != nil {
		if err.Error() == "no badge edit credits" {
			utils.RespondError(w, http.StatusNotFound, "You don't have enough badge edit credits")
			return
		}

		if err.Error() == "badge name already exists" {
			utils.RespondError(w, http.StatusNotFound, "Badge name already exists")
			return
		}

		log.Println("Error editing custom badge:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	log.Println("Custom badge updated successfully")

	utils.RespondSuccess(w, "Badge updated successfully", nil)
}

/* Hide user badge */
func (bh *BadgeHandler) HideUserBadge(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	badgeID := utils.StringToUint(vars["badgeID"])
	if badgeID == 0 {
		utils.RespondError(w, http.StatusBadRequest, "Badge id is required")
		return
	}

	hiddenStr := r.URL.Query().Get("hidden")
	if hiddenStr == "" {
		utils.RespondError(w, http.StatusBadRequest, "Hidden parameter is required")
		return
	}

	hidden, err := strconv.ParseBool(hiddenStr)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid hidden value")
		return
	}

	if err := bh.BadgeService.HideUserBadge(uid, badgeID, hidden); err != nil {
		log.Println("Error hiding user badge:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Badge visibility updated successfully", nil)
}
