package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type WidgetHandler struct {
	WidgetService *services.WidgetService
}

func NewWidgetHandler(widgetService *services.WidgetService) *WidgetHandler {
	return &WidgetHandler{
		WidgetService: widgetService,
	}
}

/* Create a new widget */
func (wh *WidgetHandler) CreateUserWidget(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	var widget models.UserWidget
	if err := json.NewDecoder(r.Body).Decode(&widget); err != nil {
		log.Println("Error decoding request body:", err)
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	widget.UID = uid

	if err := wh.WidgetService.CreateUserWidget(&widget); err != nil {
		if err.Error() == "adding this widget requires premium" {
			utils.RespondError(w, http.StatusForbidden, "Adding this widget requires premium")
			return
		}

		log.Println("Error creating user widget:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Widget created successfully", widget.ID)
}

/* Update a widget */
func (wh *WidgetHandler) UpdateUserWidget(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	widgetIDStr := vars["id"]

	uid := middlewares.GetUserIDFromContext(r.Context())
	var widget models.UserWidget
	if err := json.NewDecoder(r.Body).Decode(&widget); err != nil {
		log.Println("Error decoding request body:", err)
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	widget.UID = uid
	widget.ID = utils.StringToUint(widgetIDStr)

	if err := wh.WidgetService.UpdateUserWidget(&widget); err != nil {
		if err.Error() == "updating to this widget requires premium" {
			utils.RespondError(w, http.StatusForbidden, "Updating to this widget requires premium")
			return
		}

		log.Println("Error updating user widget:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Widget updated successfully", nil)
}

/* Delete a widget */
func (wh *WidgetHandler) DeleteUserWidget(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	widgetID := vars["id"]

	if err := wh.WidgetService.DeleteUserWidget(uid, widgetID); err != nil {
		log.Println("Error deleting user widget:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Widget deleted successfully", nil)
}

/* Reorder widgets */
func (wh *WidgetHandler) ReorderUserWidget(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Widgets []services.WidgetOrderUpdate `json:"widgets"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	uid := middlewares.GetUserIDFromContext(r.Context())
	if err := wh.WidgetService.ReorderUserWidgets(uid, req.Widgets); err != nil {
		log.Println("Error reordering user widget:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Widget reordered successfully", nil)
}

/* Get GitHub repositories for a user */
func (wh *WidgetHandler) GetGitHubRepos(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]

	data, err := wh.WidgetService.GetGithubData(username)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Github data found", data)
}

/* Get valorant data for a user */
func (wh *WidgetHandler) GetValorantData(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	name := vars["name"]
	tag := vars["tag"]

	data, err := wh.WidgetService.GetValorantRank(name, tag)
	if err != nil {
		log.Println("Error getting valorant data:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Valorant data found", data)
}
