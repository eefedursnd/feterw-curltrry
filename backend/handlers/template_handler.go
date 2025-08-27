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

type TemplateHandler struct {
	TemplateService *services.TemplateService
}

func NewTemplateHandler(templateService *services.TemplateService) *TemplateHandler {
	return &TemplateHandler{
		TemplateService: templateService,
	}
}

/* Create a new template */
func (th *TemplateHandler) CreateTemplate(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	var template models.Template
	if err := json.NewDecoder(r.Body).Decode(&template); err != nil {
		log.Println("Error decoding request body:", err)
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	template.CreatorID = uid

	if err := th.TemplateService.CreateTemplate(&template); err != nil {
		log.Println("Error creating template:", err)

		if err.Error() == "template limit reached" {
			utils.RespondError(w, http.StatusForbidden, err.Error())
			return
		}
		if err.Error() == "template name must be between 3 and 50 characters" {
			utils.RespondError(w, http.StatusBadRequest, err.Error())
			return
		}
		if err.Error() == "you already have a template with this name" {
			utils.RespondError(w, http.StatusConflict, err.Error())
			return
		}

		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Template created successfully", template)
}

/* Get template by ID */
func (th *TemplateHandler) GetTemplate(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	templateID := utils.StringToUint(vars["templateID"])
	if templateID == 0 {
		utils.RespondError(w, http.StatusBadRequest, "Template ID is required")
		return
	}

	uid := middlewares.GetUserIDFromContext(r.Context())

	template, err := th.TemplateService.GetTemplateByID(templateID)
	if err != nil {
		if err.Error() == "template not found" {
			utils.RespondError(w, http.StatusNotFound, "Template not found")
		} else {
			log.Println("Error getting template:", err)
			utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		}
		return
	}

	if !template.Shareable && template.CreatorID != uid {
		utils.RespondError(w, http.StatusForbidden, "You don't have permission to view this template")
		return
	}

	utils.RespondSuccess(w, "Template found", template)
}

/* Get all templates for the current user */
func (th *TemplateHandler) GetUserTemplates(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	templates, err := th.TemplateService.GetTemplatesByUserID(uid)
	if err != nil {
		log.Println("Error getting user templates:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Templates found", templates)
}

/* Get all publicly shareable templates */
func (th *TemplateHandler) GetShareableTemplates(w http.ResponseWriter, r *http.Request) {
	templates, err := th.TemplateService.GetShareableTemplates()
	if err != nil {
		log.Println("Error getting shareable templates:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Shareable templates found", templates)
}

/* Update template */
func (th *TemplateHandler) UpdateTemplate(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	templateID := utils.StringToUint(vars["templateID"])
	if templateID == 0 {
		utils.RespondError(w, http.StatusBadRequest, "Template ID is required")
		return
	}

	var template models.Template
	if err := json.NewDecoder(r.Body).Decode(&template); err != nil {
		log.Println("Error decoding request body:", err)
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	overwrite := r.URL.Query().Get("overwrite") == "true"

	template.ID = templateID
	template.CreatorID = uid

	if err := th.TemplateService.UpdateTemplate(&template, overwrite); err != nil {
		log.Println("Error updating template:", err)

		if err.Error() == "template not found" {
			utils.RespondError(w, http.StatusNotFound, "Template not found")
			return
		}
		if err.Error() == "you don't have permission to update this template" {
			utils.RespondError(w, http.StatusForbidden, "You don't have permission to update this template")
			return
		}

		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Template updated successfully", nil)
}

/* Delete template */
func (th *TemplateHandler) DeleteTemplate(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	templateID := utils.StringToUint(vars["templateID"])
	if templateID == 0 {
		utils.RespondError(w, http.StatusBadRequest, "Template ID is required")
		return
	}

	if err := th.TemplateService.DeleteTemplate(uid, templateID); err != nil {
		log.Println("Error deleting template:", err)

		if err.Error() == "template not found" {
			utils.RespondError(w, http.StatusNotFound, "Template not found")
			return
		}
		if err.Error() == "you don't have permission to delete this template" {
			utils.RespondError(w, http.StatusForbidden, "You don't have permission to delete this template")
			return
		}

		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Template deleted successfully", nil)
}

/* Apply template to current user */
func (th *TemplateHandler) ApplyTemplate(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	templateID := utils.StringToUint(vars["templateID"])
	if templateID == 0 {
		utils.RespondError(w, http.StatusBadRequest, "Template ID is required")
		return
	}

	var request struct {
		ConfirmPremium bool `json:"confirm_premium"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil && err.Error() != "EOF" {
		log.Println("Error decoding request body:", err)
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := th.TemplateService.UserService.GetUserByUIDNoCache(uid)
	if err != nil {
		log.Println("Error getting user:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	template, err := th.TemplateService.GetTemplateByID(templateID)
	if err != nil {
		if err.Error() == "template not found" {
			utils.RespondError(w, http.StatusNotFound, "Template not found")
		} else {
			log.Println("Error getting template:", err)
			utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		}
		return
	}

	if template.PremiumRequired && !request.ConfirmPremium && !user.HasActivePremiumSubscription() {
		_, premiumFeatures, err := th.TemplateService.ExtractPremiumFeatures(templateID)
		if err != nil {
			log.Println("Error extracting premium features:", err)
			utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
			return
		}

		utils.RespondError(w, http.StatusConflict, "This template contains premium features that won't be applied: "+utils.SliceToString(premiumFeatures))
		return
	}

	if err := th.TemplateService.ApplyTemplate(uid, templateID, request.ConfirmPremium); err != nil {
		log.Println("Error applying template:", err)

		if err.Error() == "template not found" {
			utils.RespondError(w, http.StatusNotFound, "Template not found")
			return
		}
		if err.Error() == "this template is not shareable" {
			utils.RespondError(w, http.StatusForbidden, "This template is not shareable")
			return
		}

		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Template applied successfully", nil)
}

/* Get template statistics */
func (th *TemplateHandler) GetTemplateStats(w http.ResponseWriter, r *http.Request) {
	stats, err := th.TemplateService.GetTemplateStats()
	if err != nil {
		log.Println("Error getting template stats:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Template stats retrieved", stats)
}
