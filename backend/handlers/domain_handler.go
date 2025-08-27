package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type DomainHandler struct {
	DomainService *services.DomainService
	UserService   *services.UserService
}

type AssignDomainRequest struct {
	DomainID string `json:"domain_id"`
}

func NewDomainHandler(domainService *services.DomainService, userService *services.UserService) *DomainHandler {
	return &DomainHandler{
		DomainService: domainService,
		UserService:   userService,
	}
}

func (dh *DomainHandler) GetAvailableDomains(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	domains, err := dh.DomainService.GetAvailableDomains(uid)
	if err != nil {
		log.Println("Error getting available domains:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Available domains retrieved successfully", domains)
}

func (dh *DomainHandler) GetUserDomains(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	assignments, err := dh.DomainService.GetUserDomains(uid)
	if err != nil {
		log.Println("Error getting user domains:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	type domainWithDetails struct {
		Assignment *models.DomainAssignment `json:"assignment"`
		Domain     *models.Domain           `json:"domain"`
		IsExpiring bool                     `json:"is_expiring"`
	}

	result := make([]domainWithDetails, 0, len(assignments))
	for _, assignment := range assignments {
		domain, err := dh.DomainService.GetDomain(assignment.DomainID)
		if err != nil {
			log.Printf("Error getting domain details for assignment ID %d, domain ID %s: %v\n", assignment.ID, assignment.DomainID, err)
			continue
		}

		isExpiring, err := dh.DomainService.IsDomainExpiringSoon(assignment.DomainID)
		if err != nil {
			log.Printf("Error checking if domain %s is expiring: %v\n", assignment.DomainID, err)
			isExpiring = false
		}

		result = append(result, domainWithDetails{
			Assignment: assignment,
			Domain:     domain,
			IsExpiring: isExpiring,
		})
	}

	utils.RespondSuccess(w, "User domains retrieved successfully", result)
}

func (dh *DomainHandler) AssignDomain(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	var req AssignDomainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.DomainID == "" {
		utils.RespondError(w, http.StatusBadRequest, "Domain ID is required")
		return
	}

	err := dh.DomainService.AssignDomainToUser(uid, req.DomainID)
	if err != nil {
		switch err.Error() {
		case "domain not found":
			utils.RespondError(w, http.StatusNotFound, "Domain not found")
		case "domain has expired":
			utils.RespondError(w, http.StatusBadRequest, "This domain has expired")
		case "this domain is only available for premium users":
			utils.RespondError(w, http.StatusForbidden, "This domain is only available for premium users")
		case "this domain has reached its maximum usage capacity":
			utils.RespondError(w, http.StatusConflict, "This domain has reached its maximum usage capacity")
		case "user already has this domain assigned":
			utils.RespondError(w, http.StatusConflict, "You already have this domain assigned")
		case "standard users can only assign one domain":
			utils.RespondError(w, http.StatusForbidden, "Standard users can only assign one domain")
		case "premium users can assign a maximum of two domains":
			utils.RespondError(w, http.StatusForbidden, "Premium users can assign a maximum of two domains")
		default:
			log.Printf("Error assigning domain %s to user %d: %v\n", req.DomainID, uid, err)
			utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		}
		return
	}

	utils.RespondSuccess(w, "Domain assigned successfully", nil)
}

func (dh *DomainHandler) HasUserSelectedDomain(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	domainName := vars["domain_name"]

	if username == "" || domainName == "" {
		utils.RespondError(w, http.StatusBadRequest, "Username/Alias and domain name are required in the path")
		return
	}

	hasSelected, err := dh.DomainService.HasUserSelectedDomain(username, domainName)
	if err != nil {
		errMsg := err.Error()
		if errMsg == "user not found" || errMsg == "domain not found" {
			utils.RespondSuccess(w, "Domain selection checked successfully", map[string]bool{"has_selected": false})
		} else if strings.Contains(errMsg, "error retrieving") {
			log.Printf("Database error checking domain selection for %s.%s: %v\n", username, domainName, err)
			utils.RespondError(w, http.StatusInternalServerError, "Error checking domain selection")
		} else {
			log.Printf("Unexpected error checking domain selection for %s.%s: %v\n", username, domainName, err)
			utils.RespondError(w, http.StatusInternalServerError, "Error checking domain selection")
		}
		return
	}

	utils.RespondSuccess(w, "Domain selection checked successfully", map[string]bool{"has_selected": hasSelected})
}

func (dh *DomainHandler) RemoveDomain(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)

	domainID := vars["domain_id"]

	if domainID == "" {
		utils.RespondError(w, http.StatusBadRequest, "Domain ID is required")
		return
	}

	err := dh.DomainService.RemoveDomainFromUser(uid, domainID)
	if err != nil {
		switch err.Error() {
		case "assignment not found for this user and domain":
			utils.RespondError(w, http.StatusNotFound, "Domain assignment not found for this user")
		default:
			log.Printf("Error removing domain %s from user %d: %v\n", domainID, uid, err)
			utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		}
		return
	}

	utils.RespondSuccess(w, "Domain removed successfully", nil)
}

func (dh *DomainHandler) GetAllDomains(w http.ResponseWriter, r *http.Request) {
	domains, err := dh.DomainService.GetAllDomains()
	if err != nil {
		log.Println("Error getting all domains:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "All domains retrieved successfully", domains)
}

func (dh *DomainHandler) AddDomain(w http.ResponseWriter, r *http.Request) {
	var domain models.Domain
	if err := json.NewDecoder(r.Body).Decode(&domain); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if domain.ID == "" || domain.Name == "" {
		utils.RespondError(w, http.StatusBadRequest, "Domain ID and Name are required")
		return
	}
	domain.ID = strings.ToLower(strings.ReplaceAll(domain.ID, ".", "-"))

	if domain.ExpiresAt.IsZero() {
		domain.ExpiresAt = time.Now().AddDate(1, 0, 0)
	}

	err := dh.DomainService.AddDomain(&domain)
	if err != nil {
		if err.Error() == "domain already exists" {
			utils.RespondError(w, http.StatusConflict, "Domain with this ID or Name already exists")
		} else {
			log.Println("Error adding domain:", err)
			utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		}
		return
	}

	utils.RespondSuccess(w, "Domain added successfully", domain)
}

func (dh *DomainHandler) UpdateDomain(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	domainID := vars["id"]
	if domainID == "" {
		utils.RespondError(w, http.StatusBadRequest, "Domain ID is required in path")
		return
	}
	domainID = strings.ToLower(strings.ReplaceAll(domainID, ".", "-"))

	var updatedDomainData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updatedDomainData); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	existingDomain, err := dh.DomainService.GetDomain(domainID)
	if err != nil {
		if err.Error() == "domain not found" {
			utils.RespondError(w, http.StatusNotFound, "Domain not found")
		} else {
			log.Printf("Error fetching domain %s for update: %v\n", domainID, err)
			utils.RespondError(w, http.StatusInternalServerError, "Failed to retrieve domain for update")
		}
		return
	}

	if name, ok := updatedDomainData["name"].(string); ok {
		existingDomain.Name = name
	}
	if onlyPremium, ok := updatedDomainData["only_premium"].(bool); ok {
		existingDomain.OnlyPremium = onlyPremium
	}
	if maxUsage, ok := updatedDomainData["max_usage"].(float64); ok {
		existingDomain.MaxUsage = int(maxUsage)
	}
	if expiresAtStr, ok := updatedDomainData["expires_at"].(string); ok {
		if expiresAt, err := time.Parse(time.RFC3339, expiresAtStr); err == nil {
			existingDomain.ExpiresAt = expiresAt
		} else {
			utils.RespondError(w, http.StatusBadRequest, "Invalid expires_at date format (use RFC3339)")
			return
		}
	}

	existingDomain.ID = domainID

	err = dh.DomainService.UpdateDomain(existingDomain)
	if err != nil {
		log.Printf("Error updating domain %s: %v\n", domainID, err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong while updating the domain")
		return
	}

	utils.RespondSuccess(w, "Domain updated successfully", existingDomain)
}

func (dh *DomainHandler) DeleteDomain(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	domainID := vars["id"]
	if domainID == "" {
		utils.RespondError(w, http.StatusBadRequest, "Domain ID is required in path")
		return
	}
	domainID = strings.ToLower(strings.ReplaceAll(domainID, ".", "-"))

	err := dh.DomainService.DeleteDomain(domainID)
	if err != nil {
		log.Printf("Error deleting domain %s: %v\n", domainID, err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong while deleting the domain")
		return
	}

	utils.RespondSuccess(w, "Domain deleted successfully", nil)
}

func (dh *DomainHandler) RenewDomain(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	domainID := vars["id"]
	if domainID == "" {
		utils.RespondError(w, http.StatusBadRequest, "Domain ID is required in path")
		return
	}
	domainID = strings.ToLower(strings.ReplaceAll(domainID, ".", "-"))

	type renewRequest struct {
		DurationDays int `json:"duration_days"`
	}

	var req renewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.DurationDays <= 0 {
		utils.RespondError(w, http.StatusBadRequest, "Duration must be a positive number of days")
		return
	}

	duration := time.Duration(req.DurationDays) * 24 * time.Hour
	err := dh.DomainService.RenewDomain(domainID, duration)
	if err != nil {
		if err.Error() == "domain not found" {
			utils.RespondError(w, http.StatusNotFound, "Domain not found")
		} else {
			log.Printf("Error renewing domain %s: %v\n", domainID, err)
			utils.RespondError(w, http.StatusInternalServerError, "Something went wrong while renewing the domain")
		}
		return
	}

	utils.RespondSuccess(w, "Domain renewed successfully", nil)
}
