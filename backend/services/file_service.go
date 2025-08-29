package services

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-redis/redis"
	"github.com/google/uuid"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/utils"
	"gorm.io/gorm"
)

type FileService struct {
	DB     *gorm.DB
	Client *redis.Client
}

func NewFileService(db *gorm.DB, client *redis.Client) *FileService {
	return &FileService{
		DB:     db,
		Client: client,
	}
}

/* Upload a file */
func (fs *FileService) UploadFile(fileType, fileName string, userID uint, fileBytes []byte) (string, error) {
	fileExtension := utils.GetFileExtension(fileName)

	allowedExtensions := map[string]bool{
		".mp4":  true,
		".webm": true,
		".ogg":  true,
		".mp3":  true,
		".wav":  true,
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
	}

	if !allowedExtensions[strings.ToLower(fileExtension)] {
		return "", fmt.Errorf("file type %s is not allowed", fileExtension)
	}

	uuid := uuid.New().String()
	fileKey := uuid + fileExtension

	// Change to file upload service endpoint
	putURL := fmt.Sprintf("%s/%s", config.R2URL, fileKey)

	log.Printf("Attempting to upload file to file-upload service: %s", putURL)

	req, err := http.NewRequest("PUT", putURL, bytes.NewReader(fileBytes))
	if err != nil {
		log.Printf("Error creating request: %v", err)
		return "", err
	}

	req.Header.Set("Content-Type", "application/octet-stream")
	req.Header.Set("X-Api-Key", config.R2APIKey)

	// Set up HTTP client with extended timeout for large uploads
	client := &http.Client{
		Timeout: 5 * time.Minute,
	}

	log.Printf("Sending request to S3 server...")
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending request to S3: %v", err)
		return "", fmt.Errorf("error communicating with storage server: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		return "", fmt.Errorf("error reading server response: %w", err)
	}

	log.Printf("S3 server responded with status: %d", resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		log.Printf("S3 upload failed. Status: %d, Response: %s", resp.StatusCode, string(body))
		return "", fmt.Errorf("failed to upload file: error code: %d, response: %s",
			resp.StatusCode, string(body))
	}

	fileURL := fmt.Sprintf("%s/%s", config.R2PublicURL, fileKey)
	log.Printf("File uploaded successfully. URL: %s", fileURL)

	profile := &models.UserProfile{}
	err = fs.DB.Where("uid = ?", userID).First(profile).Error
	if err != nil {
		return "", err
	}

	switch fileType {
	case "avatar_url":
		profile.AvatarURL = fileURL
	case "background_url":
		profile.BackgroundURL = fileURL
	case "audio_url":
		profile.AudioURL = fileURL
	case "cursor_url":
		profile.CursorURL = fileURL
	case "banner_url":
		profile.BannerURL = fileURL
	default:
		return "", fmt.Errorf("invalid file type: %s", fileType)
	}

	err = fs.UpdateUserProfile(profile)
	if err != nil {
		return "", err
	}

	return fileURL, nil
}

func (fs *FileService) CheckR2Health() error {
	healthURL := fmt.Sprintf("%s/api/health", config.R2URL)

	req, err := http.NewRequest("GET", healthURL, nil)
	if err != nil {
		return fmt.Errorf("error creating health check request: %w", err)
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("s3 service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("s3 service health check failed: status %d, response: %s",
			resp.StatusCode, string(body))
	}

	return nil
}

/* Upload Custom Badge Media but in path https://s3.haze.bio/custom_badges/{badgeName}.png */
func (fs *FileService) UploadCustomBadgeMedia(badgeID uint, fileName string, fileBytes []byte) (string, error) {
	fileExtension := utils.GetFileExtension(fileName)
	fileKey := fmt.Sprintf("custom_badges/%d%s", badgeID, fileExtension)

	oldFileURL := fmt.Sprintf("%s/custom_badges/%d%s", config.R2URL, badgeID, fileExtension)
	err := fs.DeleteFileByURL(oldFileURL)
	if err != nil && !strings.Contains(err.Error(), "file URL not found") {
		log.Printf("Error deleting old badge: %v", err)
	}

	putURL := fmt.Sprintf("%s/%s", config.R2URL, fileKey)
	req, err := http.NewRequest("PUT", putURL, bytes.NewReader(fileBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/octet-stream")
	req.Header.Set("X-Api-Key", config.R2APIKey) // Changed header name

	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to upload file: %s", body)
	}

	fileURL := fmt.Sprintf("%s/%s", config.R2PublicURL, fileKey)

	return fileURL, nil
}

// upload custom social, but in the normal directory, but not set any stuff in the database
func (fs *FileService) UploadCustomSocialMedia(fileName string, fileBytes []byte) (string, error) {
	fileExtension := utils.GetFileExtension(fileName)

	allowedExtensions := map[string]bool{
		".mp4":  true,
		".webm": true,
		".ogg":  true,
		".mp3":  true,
		".wav":  true,
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
	}

	if !allowedExtensions[strings.ToLower(fileExtension)] {
		return "", fmt.Errorf("file type %s is not allowed", fileExtension)
	}

	uuid := uuid.New().String()
	fileKey := uuid + fileExtension

	putURL := fmt.Sprintf("%s/%s", config.R2URL, fileKey)
	req, err := http.NewRequest("PUT", putURL, bytes.NewReader(fileBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/octet-stream")
	req.Header.Set("X-Api-Key", config.R2APIKey)

	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to upload file: %s", body)
	}

	fileURL := fmt.Sprintf("%s/%s", config.R2PublicURL, fileKey)

	return fileURL, nil
}

// Upload Data Export in "data_exports" folder
func (fs *FileService) UploadDataExport(fileName string, fileBytes []byte, password string) (string, error) {
	fileExtension := utils.GetFileExtension(fileName)

	allowedExtensions := map[string]bool{
		".pdf": true,
	}

	if !allowedExtensions[strings.ToLower(fileExtension)] {
		return "", fmt.Errorf("file type %s is not allowed", fileExtension)
	}

	uuid := uuid.New().String()
	fileKey := "data_exports/" + uuid + fileExtension

	putURL := fmt.Sprintf("%s/%s?type=temporary-protected&expiration=24&password=%s",
		config.R2URL, fileKey, password)

	req, err := http.NewRequest("PUT", putURL, bytes.NewReader(fileBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/octet-stream")
	req.Header.Set("X-Api-Key", config.R2APIKey)
	req.Header.Set("X-Password", password)

	client := &http.Client{
		Timeout: 5 * time.Minute,
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("failed to upload file: %s", body)
	}

	fileURL := fmt.Sprintf("%s/%s", config.R2PublicURL, fileKey)
	return fileURL, nil
}

// DeleteFileByURL deletes a file from R2 storage by its URL.
func (fs *FileService) DeleteFileByURL(fileURL string) error {
	fileKey := fileURL[len(config.R2URL)+1:]

	deleteURL := fmt.Sprintf("%s/%s", config.R2URL, fileKey)
	req, err := http.NewRequest("DELETE", deleteURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("X-Api-Key", config.R2APIKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to delete file: %s", body)
	}

	return nil
}

/* Delete a file */
func (fs *FileService) DeleteFile(userID uint, fileURL string) error {
	// Handle removing the URL from the user profile first
	err := fs.DeleteMediaURL(userID, fileURL)
	if err != nil {
		return err
	}

	return nil
}

/* Update user profile */
func (fs *FileService) UpdateUserProfile(profile *models.UserProfile) error {
	err := fs.DB.Model(profile).Where("uid = ?", profile.UID).Select("*").Updates(profile).Error
	if err != nil {
		return err
	}

	return nil
}

/* Delete media URL from user profile */
func (fs *FileService) DeleteMediaURL(uid uint, fileURL string) error {
	profile := &models.UserProfile{}
	err := fs.DB.Where("uid = ?", uid).First(profile).Error
	if err != nil {
		return err
	}

	if profile.AvatarURL == fileURL {
		profile.AvatarURL = ""
	} else if profile.BackgroundURL == fileURL {
		profile.BackgroundURL = ""
	} else if profile.AudioURL == fileURL {
		profile.AudioURL = ""
	} else if profile.CursorURL == fileURL {
		profile.CursorURL = ""
	} else if profile.BannerURL == fileURL {
		profile.BannerURL = ""
	} else {
		var userSocials []models.UserSocial
		err = fs.DB.Where("uid = ? AND image_url = ?", uid, fileURL).Find(&userSocials).Error
		if err != nil {
			return err
		}

		if len(userSocials) > 0 {
			err = fs.DB.Where("uid = ? AND image_url = ?", uid, fileURL).Delete(&models.UserSocial{}).Error
			if err != nil {
				return err
			}
			return nil
		}

		return fmt.Errorf("file URL not found in profile or user_socials")
	}

	err = fs.UpdateUserProfile(profile)
	if err != nil {
		return err
	}

	return nil
}
