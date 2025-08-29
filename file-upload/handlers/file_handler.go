package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"io"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_file-upload/config"
	"github.com/hazebio/haze.bio_file-upload/services"
	"github.com/hazebio/haze.bio_file-upload/utils"
)

type TemporaryFileRequest struct {
	ExpirationHours int `json:"expirationHours"`
}

type PasswordProtectedFileRequest struct {
	Password string `json:"password"`
}

type PasswordVerificationRequest struct {
	Password string `json:"password"`
}

type FileHandler struct {
	R2Service *services.R2Service
}

func NewFileHandler(r2Service *services.R2Service) *FileHandler {
	return &FileHandler{
		R2Service: r2Service,
	}
}

func (fh *FileHandler) HandleFileOperations(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	key := vars["key"]

	if key == "" {
		utils.RespondError(w, http.StatusBadRequest, "No file key provided")
		return
	}

	key = strings.TrimPrefix(key, "/")

	if r.Method == http.MethodPut || r.Method == http.MethodDelete {
		providedKey := r.Header.Get("X-Api-Key")
		if providedKey != config.APIKey {
			utils.RespondError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}
	}

	fileType := r.URL.Query().Get("type")

	switch r.Method {
	case http.MethodPut:
		switch fileType {
		case "temporary":
			fh.handlePutTemporaryFile(w, r, key)
		case "protected":
			fh.handlePutProtectedFile(w, r, key)
		case "temporary-protected":
			fh.handlePutTemporaryProtectedFile(w, r, key)
		default:
			fh.handlePutFile(w, r, key)
		}
	case http.MethodGet:
		fh.handleGetFile(w, r, key)
	case http.MethodPost:
		if strings.HasSuffix(r.URL.Path, "/verify") {
			fh.handleVerifyPassword(w, r, key)
		} else {
			utils.RespondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
	case http.MethodDelete:
		fh.handleDeleteFile(w, key)
	default:
		utils.RespondError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func (fh *FileHandler) handlePutFile(w http.ResponseWriter, r *http.Request, key string) {
	err := fh.R2Service.UploadFile(key, r.Body)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to upload file: "+err.Error())
		return
	}

	log.Printf("PUT %s, Content-Type: %s", key, r.Header.Get("Content-Type"))

	utils.RespondSuccess(w, "Put "+key+" successfully!", nil)
}

func (fh *FileHandler) handlePutTemporaryFile(w http.ResponseWriter, r *http.Request, key string) {
	expirationHours, err := strconv.Atoi(r.URL.Query().Get("expiration"))
	if err != nil || expirationHours <= 0 {
		expirationHours = 24
	}

	err = fh.R2Service.UploadTemporaryFile(key, r.Body, time.Duration(expirationHours)*time.Hour)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to upload temporary file: "+err.Error())
		return
	}

	log.Printf("PUT temporary %s, expires in %d hours", key, expirationHours)
	utils.RespondSuccess(w, "Put temporary file "+key+" successfully! Expires in "+strconv.Itoa(expirationHours)+" hours", nil)
}

func (fh *FileHandler) handlePutProtectedFile(w http.ResponseWriter, r *http.Request, key string) {
	password := r.URL.Query().Get("password")
	if password == "" {
		password = r.Header.Get("X-Password")
	}

	if password == "" {
		utils.RespondError(w, http.StatusBadRequest, "Password required for protected files")
		return
	}

	err := fh.R2Service.UploadPasswordProtectedFile(key, r.Body, password)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to upload protected file: "+err.Error())
		return
	}

	log.Printf("PUT protected %s", key)
	utils.RespondSuccess(w, "Put password-protected file "+key+" successfully!", nil)
}

func (fh *FileHandler) handleGetFile(w http.ResponseWriter, r *http.Request, key string) {
	exists, err := fh.R2Service.FileExists(key)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to check file: "+err.Error())
		return
	}

	if !exists {
		utils.RespondError(w, http.StatusNotFound, "Object not found")
		return
	}

	metadata, err := fh.R2Service.GetFileMetadata(key)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get file metadata: "+err.Error())
		return
	}

	if metadata.ExpiresAt != nil && metadata.ExpiresAt.Before(time.Now()) {
		utils.RespondError(w, http.StatusGone, "File has expired")
		return
	}

	if metadata.PasswordHash != "" {
		password := r.URL.Query().Get("password")

		if password == "" {
			utils.RespondError(w, http.StatusForbidden, "Password required")
			return
		}

		hashedPassword := hashPassword(password)
		if hashedPassword != metadata.PasswordHash {
			utils.RespondError(w, http.StatusForbidden, "Invalid password")
			return
		}
	}

	rangeHeader := r.Header.Get("Range")
	if rangeHeader != "" {
		fh.handleRangeRequest(w, r, key, rangeHeader)
		return
	}

	obj, err := fh.R2Service.GetFile(key)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get file: "+err.Error())
		return
	}

	w.Header().Set("Content-Length", strconv.FormatInt(*obj.ContentLength, 10))

	contentType := getContentTypeByExtension(key)
	if contentType == "" && obj.ContentType != nil {
		contentType = *obj.ContentType
	}
	w.Header().Set("Content-Type", contentType)

	w.Header().Set("Content-Disposition", "inline")
	w.Header().Set("Cache-Control", "public, max-age=86400, immutable")
	if obj.ETag != nil {
		w.Header().Set("ETag", *obj.ETag)
	}
	w.Header().Set("Accept-Ranges", "bytes")

	w.Header().Set("Access-Control-Allow-Origin", config.Origin)
	w.Header().Set("Cross-Origin-Resource-Policy", "cross-origin")

	if metadata.ExpiresAt != nil {
		w.Header().Set("X-Expires-At", metadata.ExpiresAt.Format(time.RFC3339))
	}

	log.Printf("GET %s, Content-Type: %s, Content-Length: %d", key, contentType, *obj.ContentLength)

	io.Copy(w, obj.Body)
	defer obj.Body.Close()
}

func (fh *FileHandler) handleRangeRequest(w http.ResponseWriter, r *http.Request, key string, rangeHeader string) {
	metadata, err := fh.R2Service.GetFileMetadata(key)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get file metadata: "+err.Error())
		return
	}

	if metadata.ExpiresAt != nil && metadata.ExpiresAt.Before(time.Now()) {
		utils.RespondError(w, http.StatusGone, "File has expired")
		return
	}

	if metadata.PasswordHash != "" {
		password := w.Header().Get("X-Password")
		if password == "" {
			password = r.URL.Query().Get("password")
		}

		if password == "" {
			utils.RespondError(w, http.StatusForbidden, "Password required")
			return
		}

		hashedPassword := hashPassword(password)
		if hashedPassword != metadata.PasswordHash {
			utils.RespondError(w, http.StatusForbidden, "Invalid password")
			return
		}
	}

	regex := regexp.MustCompile(`bytes=(\d+)-(\d*)`)
	matches := regex.FindStringSubmatch(rangeHeader)

	if len(matches) < 3 {
		utils.RespondError(w, http.StatusBadRequest, "Invalid range header")
		return
	}

	startByte, err := strconv.ParseInt(matches[1], 10, 64)
	if err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid range start")
		return
	}

	objInfo, err := fh.R2Service.GetFileInfo(key)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get file info: "+err.Error())
		return
	}

	totalSize := *objInfo.ContentLength

	var endByte int64
	if matches[2] == "" {
		endByte = totalSize - 1
	} else {
		endByte, err = strconv.ParseInt(matches[2], 10, 64)
		if err != nil {
			utils.RespondError(w, http.StatusBadRequest, "Invalid range end")
			return
		}
	}

	rangeObj, err := fh.R2Service.GetFileRange(key, startByte, endByte)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get file range: "+err.Error())
		return
	}

	contentLength := endByte - startByte + 1

	contentType := getContentTypeByExtension(key)
	if contentType == "" && rangeObj.ContentType != nil {
		contentType = *rangeObj.ContentType
	}

	w.Header().Set("Content-Range", "bytes "+strconv.FormatInt(startByte, 10)+"-"+strconv.FormatInt(endByte, 10)+"/"+strconv.FormatInt(totalSize, 10))
	w.Header().Set("Content-Length", strconv.FormatInt(contentLength, 10))
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", "inline")
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "public, max-age=86400, immutable")

	w.Header().Set("Access-Control-Allow-Origin", config.Origin)
	w.Header().Set("Cross-Origin-Resource-Policy", "cross-origin")

	if metadata.ExpiresAt != nil {
		w.Header().Set("X-Expires-At", metadata.ExpiresAt.Format(time.RFC3339))
	}

	log.Printf("Range request for %s: %s, Content-Type: %s, Content-Length: %d", key, rangeHeader, contentType, contentLength)

	w.WriteHeader(http.StatusPartialContent)

	io.Copy(w, rangeObj.Body)
	defer rangeObj.Body.Close()
}

func (fh *FileHandler) handleVerifyPassword(w http.ResponseWriter, r *http.Request, key string) {
	exists, err := fh.R2Service.FileExists(key)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to check file: "+err.Error())
		return
	}

	if !exists {
		utils.RespondError(w, http.StatusNotFound, "Object not found")
		return
	}

	metadata, err := fh.R2Service.GetFileMetadata(key)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get file metadata: "+err.Error())
		return
	}

	if metadata.PasswordHash == "" {
		utils.RespondError(w, http.StatusBadRequest, "File is not password protected")
		return
	}

	var req PasswordVerificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	hashedPassword := hashPassword(req.Password)
	if hashedPassword != metadata.PasswordHash {
		utils.RespondError(w, http.StatusForbidden, "Invalid password")
		return
	}

	utils.RespondSuccess(w, "Password verified", nil)
}

func (fh *FileHandler) handlePutTemporaryProtectedFile(w http.ResponseWriter, r *http.Request, key string) {
	expirationHours, err := strconv.Atoi(r.URL.Query().Get("expiration"))
	if err != nil || expirationHours <= 0 {
		expirationHours = 24
	}

	password := r.URL.Query().Get("password")
	if password == "" {
		password = r.Header.Get("X-Password")
	}

	if password == "" {
		utils.RespondError(w, http.StatusBadRequest, "Password required for protected files")
		return
	}

	err = fh.R2Service.UploadTemporaryProtectedFile(key, r.Body, password, time.Duration(expirationHours)*time.Hour)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to upload temporary protected file: "+err.Error())
		return
	}

	log.Printf("PUT temporary protected %s, expires in %d hours", key, expirationHours)
	utils.RespondSuccess(w, fmt.Sprintf("Put temporary password-protected file %s successfully! Expires in %d hours", key, expirationHours), nil)
}

func (fh *FileHandler) handleDeleteFile(w http.ResponseWriter, key string) {
	err := fh.R2Service.DeleteFile(key)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to delete file: "+err.Error())
		return
	}

	utils.RespondSuccess(w, "Deleted!", nil)
}

func getContentTypeByExtension(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".mp4":
		return "video/mp4"
	case ".webm":
		return "video/webm"
	case ".ogg":
		return "video/ogg"
	case ".mp3":
		return "audio/mpeg"
	case ".wav":
		return "audio/wav"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	default:
		return ""
	}
}

func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}
