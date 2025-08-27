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

type DataExportHandler struct {
	DataExportService *services.DataExportService
	UserService       *services.UserService
}

func NewDataExportHandler(dataExportService *services.DataExportService) *DataExportHandler {
	return &DataExportHandler{
		DataExportService: dataExportService,
		UserService:       &services.UserService{DB: dataExportService.DB, Client: dataExportService.Client},
	}
}

/* Request a new data export */
func (deh *DataExportHandler) RequestDataExport(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	response, err := deh.DataExportService.RequestDataExport(uid)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.RespondSuccess(w, "Data export requested successfully", response)
}

/* Get export status */
func (deh *DataExportHandler) GetExportStatus(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	vars := mux.Vars(r)
	exportID, err := strconv.ParseUint(vars["exportID"], 10, 32)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid export ID")
		return
	}

	export, err := deh.DataExportService.GetExportStatus(uid, uint(exportID))
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.RespondSuccess(w, "Export status retrieved successfully", export)
}

/* Get latest export status */
func (deh *DataExportHandler) GetLatestExportStatus(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	export, err := deh.DataExportService.GetLatestExport(uid)
	if err != nil {
		if err.Error() == "no export found for this user" {
			utils.RespondError(w, http.StatusNotFound, "You haven't requested any data exports yet")
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error retrieving export status")
		return
	}

	utils.RespondSuccess(w, "Export status retrieved successfully", export)
}

/* Download export file */
func (deh *DataExportHandler) DownloadExport(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	exportID, err := strconv.ParseUint(vars["exportID"], 10, 32)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid export ID")
		return
	}

	var request models.DataExportDownloadRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if request.ExportID != uint(exportID) {
		utils.RespondError(w, http.StatusBadRequest, "Export ID mismatch")
		return
	}

	response, err := deh.DataExportService.ValidateExportDownload(uint(exportID), request.Password)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.RespondSuccess(w, "Export download authorized", response)
}

/* For admin use: cleanup expired exports manually */
func (deh *DataExportHandler) CleanupExpiredExports(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	user, err := deh.UserService.GetUserByUID(uid)
	if err != nil {
		utils.RespondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	if user.StaffLevel < 3 {
		utils.RespondError(w, http.StatusForbidden, "Admin access required")
		return
	}

	err = deh.DataExportService.CleanupExpiredExports()
	if err != nil {
		log.Printf("Error cleaning up expired exports: %v", err)
		utils.RespondError(w, http.StatusInternalServerError, "Error cleaning up expired exports")
		return
	}

	utils.RespondSuccess(w, "Expired exports cleaned up successfully", nil)
}
