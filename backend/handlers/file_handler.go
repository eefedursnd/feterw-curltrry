package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type FileHandler struct {
	FileService *services.FileService
}

func NewFileHandler(fileService *services.FileService) *FileHandler {
	return &FileHandler{FileService: fileService}
}

func (h *FileHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	fileType := r.FormValue("fileType")
	if fileType == "custom_badge" {
		file, fileHeader, err := r.FormFile("file")
		if err != nil {
			utils.RespondError(w, http.StatusBadRequest, "Failed to get file")
			return
		}
		defer file.Close()

		fileBytes, err := io.ReadAll(file)
		if err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to read file")
			return
		}

		if len(fileBytes) > 75*1024*1024 {
			utils.RespondError(w, http.StatusBadRequest, "File size should not exceed 75MB")
			return
		}

		badgeID := utils.StringToUint(r.FormValue("badgeID"))
		fileName := fileHeader.Filename

		fileURL, err := h.FileService.UploadCustomBadgeMedia(badgeID, fileName, fileBytes)
		if err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to upload file")
			return
		}

		utils.RespondSuccess(w, "File uploaded successfully", fileURL)
		return
	}

	if fileType == "custom_social" || fileType == "template_preview" {
		file, fileHeader, err := r.FormFile("file")
		if err != nil {
			utils.RespondError(w, http.StatusBadRequest, "Failed to get file")
			return
		}
		defer file.Close()

		fileBytes, err := io.ReadAll(file)
		if err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to read file")
			return
		}

		if len(fileBytes) > 75*1024*1024 {
			utils.RespondError(w, http.StatusBadRequest, "File size should not exceed 75MB")
			return
		}

		fileName := fileHeader.Filename
		fileURL, err := h.FileService.UploadCustomSocialMedia(fileName, fileBytes)
		if err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to upload file")
			return
		}

		utils.RespondSuccess(w, "File uploaded successfully", fileURL)
		return
	}

	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Failed to get file")
		return
	}
	defer file.Close()

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	if len(fileBytes) > 75*1024*1024 {
		utils.RespondError(w, http.StatusBadRequest, "File size should not exceed 75MB")
		return
	}

	fileName := fileHeader.Filename
	userID := middlewares.GetUserIDFromContext(r.Context())

	fileURL, err := h.FileService.UploadFile(fileType, fileName, userID, fileBytes)
	if err != nil {
		log.Println("Error uploading file:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to upload file")
		return
	}

	utils.RespondSuccess(w, "File uploaded successfully", fileURL)
}

func (h *FileHandler) DeleteFile(w http.ResponseWriter, r *http.Request) {
	var deleteRequest struct {
		FileURL string `json:"fileURL"`
	}

	if err := json.NewDecoder(r.Body).Decode(&deleteRequest); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	userID := middlewares.GetUserIDFromContext(r.Context())
	if err := h.FileService.DeleteFile(userID, deleteRequest.FileURL); err != nil {
		log.Println("Error deleting file:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "File deleted successfully", nil)
}
