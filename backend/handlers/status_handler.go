package handlers

import (
	"log"
	"net/http"

	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type StatusHandler struct {
	StatusService *services.StatusService
}

func NewStatusHandler(statusService *services.StatusService) *StatusHandler {
	return &StatusHandler{
		StatusService: statusService,
	}
}

func (sh *StatusHandler) GetActiveStatus(w http.ResponseWriter, r *http.Request) {
	status, err := sh.StatusService.GetActiveStatus()
	if err != nil {
		if err.Error() == "no active status found" {
			utils.RespondSuccess(w, "No active status found", nil)
			return
		}

		log.Println("Error getting active status:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Active status retrieved", status)
}

func (sh *StatusHandler) GetUpcomingStatus(w http.ResponseWriter, r *http.Request) {
	status, err := sh.StatusService.GetUpcomingStatus()
	if err != nil {
		if err.Error() == "no upcoming statuses found" {
			utils.RespondSuccess(w, "No upcoming statuses found", nil)
			return
		}

		log.Println("Error getting upcoming status:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	log.Println("Upcoming status retrieved:", status)

	utils.RespondSuccess(w, "Upcoming status retrieved", status)
}
