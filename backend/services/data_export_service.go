package services

import (
	"bytes"
	"crypto/rand"
	"errors"
	"fmt"
	"log"
	"math/big"
	"strings"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/jung-kurt/gofpdf"
	"gorm.io/gorm"
)

type DataExportService struct {
	DB           *gorm.DB
	Client       *redis.Client
	UserService  *UserService
	EmailService *EmailService
	FileService  *FileService
}

const (
	DataExportCachePrefix   = "data_export:"
	DataExportRequestPeriod = time.Minute    // 7 days between export requests
	DataExportExpiration    = 24 * time.Hour // Export links expire after 24 hours
)

func NewDataExportService(db *gorm.DB, client *redis.Client) *DataExportService {
	return &DataExportService{
		DB:           db,
		Client:       client,
		UserService:  &UserService{DB: db, Client: client},
		EmailService: &EmailService{DB: db, Client: client},
		FileService:  &FileService{DB: db, Client: client},
	}
}

/* Request a new data export */
func (des *DataExportService) RequestDataExport(userID uint) (*models.DataExportResponse, error) {
	_, err := des.UserService.GetUserByUID(userID)
	if err != nil {
		log.Printf("User not found: %v", err)
		return nil, errors.New("user not found")
	}

	var lastExport models.DataExport
	result := des.DB.Where("user_id = ?", userID).Order("last_requested_at DESC").First(&lastExport)

	if result.Error == nil {
		timeSinceLastRequest := time.Since(lastExport.LastRequestedAt)
		if timeSinceLastRequest < DataExportRequestPeriod {
			waitingTime := DataExportRequestPeriod - timeSinceLastRequest
			days := int(waitingTime.Hours()) / 24
			hours := int(waitingTime.Hours()) % 24

			return nil, fmt.Errorf("you can request a new data export in %d days and %d hours", days, hours)
		}
	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		log.Printf("Error checking last export: %v", result.Error)
		return nil, errors.New("error checking previous export requests")
	}

	password, err := generateSecurePassword(12)
	if err != nil {
		log.Printf("Error generating password: %v", err)
		return nil, errors.New("error creating export request")
	}

	export := &models.DataExport{
		UserID:          userID,
		Status:          models.DataExportStatusRequested,
		FilePassword:    password,
		ExpiresAt:       time.Now().Add(DataExportExpiration),
		LastRequestedAt: time.Now(),
	}

	if err := des.DB.Create(export).Error; err != nil {
		log.Printf("Error saving export job: %v", err)
		return nil, errors.New("error creating export request")
	}

	go des.processDataExport(export.ID)

	return &models.DataExportResponse{
		Message:      "Your data export request has been successfully created.",
		Status:       models.DataExportStatusProcessing,
		RequestedAt:  export.RequestedAt,
		EstimatedETA: "approximately 30 minutes",
		ExportId:     export.ID,
	}, nil
}

/* Process a data export request */
func (des *DataExportService) processDataExport(exportID uint) {
	var export models.DataExport
	if err := des.DB.First(&export, exportID).Error; err != nil {
		log.Printf("Export with ID %d not found: %v", exportID, err)
		return
	}

	des.DB.Model(&export).Update("status", models.DataExportStatusProcessing)

	userData, err := des.collectUserData(export.UserID)
	if err != nil {
		log.Printf("Error collecting user data for export %d: %v", exportID, err)
		des.DB.Model(&export).Update("status", models.DataExportStatusFailed)
		return
	}

	pdfBuffer, err := des.generatePDF(userData)
	if err != nil {
		log.Printf("Error generating PDF for export %d: %v", exportID, err)
		des.DB.Model(&export).Update("status", models.DataExportStatusFailed)
		return
	}

	fileName := fmt.Sprintf("haze_bio_data_export_%d_%s.pdf", export.UserID, time.Now().Format("20060102150405"))

	fileURL, err := des.uploadExportFile(pdfBuffer, fileName, export.FilePassword)
	if err != nil {
		log.Printf("Error uploading PDF for export %d: %v", exportID, err)
		des.DB.Model(&export).Update("status", models.DataExportStatusFailed)
		return
	}

	completedAt := time.Now()
	des.DB.Model(&export).Updates(map[string]interface{}{
		"status":       models.DataExportStatusCompleted,
		"file_url":     fileURL,
		"file_name":    fileName,
		"completed_at": completedAt,
	})

	des.sendExportEmail(export.UserID, export.FilePassword, export.ExpiresAt)
}

/* Collect all data for a user */
func (des *DataExportService) collectUserData(userID uint) (*models.User, error) {
	user, err := des.UserService.GetUserByUIDNoCache(userID)
	if err != nil {
		return nil, err
	}

	if user.Email != nil {
		emailCopy := *user.Email
		user.Email = &emailCopy
	}
	user.Password = "[ENCRYPTED]"
	user.MFASecret = "[ENCRYPTED]"

	for i := range user.Sessions {
		if user.Sessions[i].IPAddress != "" {
			ipParts := strings.Split(user.Sessions[i].IPAddress, ".")
			if len(ipParts) == 4 {
				user.Sessions[i].IPAddress = ipParts[0] + "." + ipParts[1] + ".***.*"
			} else {
				ipv6Parts := strings.Split(user.Sessions[i].IPAddress, ":")
				if len(ipv6Parts) > 1 {
					user.Sessions[i].IPAddress = ipv6Parts[0] + ":****:****"
				}
			}
		}

		if user.Sessions[i].SessionToken != "" {
			user.Sessions[i].SessionToken = user.Sessions[i].SessionToken[:8] + "..."
		}
	}

	return user, nil
}

/* Generate PDF with user data */
func (des *DataExportService) generatePDF(user *models.User) (*bytes.Buffer, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(10, 10, 10)
	pdf.SetAutoPageBreak(true, 10)

	pdf.AddPage()

	pdf.SetFont("Helvetica", "B", 16)
	pdf.Cell(190, 10, "haze.bio Data Export")

	pdf.Ln(10)
	pdf.SetFont("Helvetica", "", 10)
	pdf.Cell(190, 6, fmt.Sprintf("Created on: %s", time.Now().Format("January 2, 2006 15:04:05")))
	pdf.Ln(6)
	pdf.Cell(190, 6, fmt.Sprintf("For user: %s (ID: %d)", user.Username, user.UID))

	pdf.Ln(15)
	pdf.SetFont("Helvetica", "B", 12)
	pdf.Cell(190, 8, "Personal Information")
	pdf.Ln(10)

	pdf.SetFont("Helvetica", "B", 10)
	pdf.Cell(60, 6, "Information")
	pdf.Cell(130, 6, "Value")
	pdf.Ln(6)
	pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
	pdf.Ln(2)

	pdf.SetFont("Helvetica", "", 10)
	addDataRow(pdf, "Username", user.Username)
	addDataRow(pdf, "Display Name", user.DisplayName)
	if user.Alias != nil {
		addDataRow(pdf, "Alias", *user.Alias)
	} else {
		addDataRow(pdf, "Alias", "-")
	}
	if user.Email != nil {
		addDataRow(pdf, "Email", *user.Email)
	} else {
		addDataRow(pdf, "Email", "-")
	}
	addDataRow(pdf, "Email Verified", formatBool(user.EmailVerified))
	addDataRow(pdf, "Account Created", user.CreatedAt.Format("January 2, 2006 15:04:05"))
	addDataRow(pdf, "MFA Enabled", formatBool(user.MFAEnabled))

	pdf.Ln(10)
	pdf.SetFont("Helvetica", "B", 12)
	pdf.Cell(190, 8, "Profile Information")
	pdf.Ln(10)

	pdf.SetFont("Helvetica", "B", 10)
	pdf.Cell(60, 6, "Information")
	pdf.Cell(130, 6, "Value")
	pdf.Ln(6)
	pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
	pdf.Ln(2)

	pdf.SetFont("Helvetica", "", 10)
	addDataRow(pdf, "Views", fmt.Sprintf("%d", user.Profile.Views))
	addDataRow(pdf, "Description", truncateText(user.Profile.Description, 100))
	addDataRow(pdf, "Location", user.Profile.Location)
	addDataRow(pdf, "Occupation", user.Profile.Occupation)

	if len(user.Badges) > 0 {
		pdf.AddPage()
		pdf.SetFont("Helvetica", "B", 12)
		pdf.Cell(190, 8, "Badges")
		pdf.Ln(10)

		pdf.SetFont("Helvetica", "B", 10)
		pdf.Cell(20, 6, "ID")
		pdf.Cell(90, 6, "Badge Name")
		pdf.Cell(30, 6, "Sort Order")
		pdf.Cell(30, 6, "Hidden")
		pdf.Ln(6)
		pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
		pdf.Ln(2)

		pdf.SetFont("Helvetica", "", 10)
		for _, badge := range user.Badges {
			pdf.Cell(20, 6, fmt.Sprintf("%d", badge.ID))
			pdf.Cell(90, 6, badge.Badge.Name)
			pdf.Cell(30, 6, fmt.Sprintf("%d", badge.Sort))
			pdf.Cell(30, 6, formatBool(badge.Hidden))
			pdf.Ln(6)
		}
	}

	if len(user.Socials) > 0 {
		pdf.AddPage()
		pdf.SetFont("Helvetica", "B", 12)
		pdf.Cell(190, 8, "Social Media Links")
		pdf.Ln(10)

		pdf.SetFont("Helvetica", "B", 10)
		pdf.Cell(20, 6, "ID")
		pdf.Cell(40, 6, "Platform")
		pdf.Cell(80, 6, "Link")
		pdf.Cell(20, 6, "Sort Order")
		pdf.Cell(30, 6, "Type")
		pdf.Ln(6)
		pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
		pdf.Ln(2)

		pdf.SetFont("Helvetica", "", 10)
		for _, social := range user.Socials {
			shortLink := social.Link
			if len(shortLink) > 70 {
				shortLink = shortLink[:70] + "..."
			}

			pdf.Cell(20, 6, fmt.Sprintf("%d", social.ID))
			pdf.Cell(40, 6, social.Platform)
			pdf.Cell(80, 6, shortLink)
			pdf.Cell(20, 6, fmt.Sprintf("%d", social.Sort))
			pdf.Cell(30, 6, string(social.SocialType))
			pdf.Ln(6)
		}
	}

	if len(user.Widgets) > 0 {
		pdf.AddPage()
		pdf.SetFont("Helvetica", "B", 12)
		pdf.Cell(190, 8, "Widgets")
		pdf.Ln(10)

		pdf.SetFont("Helvetica", "B", 10)
		pdf.Cell(20, 6, "ID")
		pdf.Cell(130, 6, "Widget Data")
		pdf.Cell(20, 6, "Sort Order")
		pdf.Cell(20, 6, "Hidden")
		pdf.Ln(6)
		pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
		pdf.Ln(2)

		pdf.SetFont("Helvetica", "", 10)
		for _, widget := range user.Widgets {
			shortData := widget.WidgetData
			if len(shortData) > 120 {
				shortData = shortData[:120] + "..."
			}

			pdf.Cell(20, 6, fmt.Sprintf("%d", widget.ID))
			pdf.Cell(130, 6, shortData)
			pdf.Cell(20, 6, fmt.Sprintf("%d", widget.Sort))
			pdf.Cell(20, 6, formatBool(widget.Hidden))
			pdf.Ln(6)
		}
	}

	if len(user.Sessions) > 0 {
		pdf.AddPage()
		pdf.SetFont("Helvetica", "B", 12)
		pdf.Cell(190, 8, "Sessions")
		pdf.Ln(10)

		pdf.SetFont("Helvetica", "B", 10)
		pdf.Cell(20, 6, "ID")
		pdf.Cell(60, 6, "IP Address")
		pdf.Cell(50, 6, "Location")
		pdf.Cell(60, 6, "Created")
		pdf.Ln(6)
		pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
		pdf.Ln(2)

		pdf.SetFont("Helvetica", "", 10)
		for _, session := range user.Sessions {
			pdf.Cell(20, 6, fmt.Sprintf("%d", session.ID))
			pdf.Cell(60, 6, session.IPAddress)
			pdf.Cell(50, 6, session.Location)
			pdf.Cell(60, 6, session.CreatedAt.Format("Jan 2, 2006 15:04"))
			pdf.Ln(6)
		}
	}

	pdf.AddPage()
	pdf.SetFont("Helvetica", "B", 12)
	pdf.Cell(190, 8, "Notes About Your Data Export")
	pdf.Ln(10)

	pdf.SetFont("Helvetica", "", 10)
	pdf.MultiCell(190, 6, "This data export contains all personal data that haze.bio has stored about you. Please treat this information confidentially and do not share it with third parties.", "0", "L", false)
	pdf.Ln(6)
	pdf.MultiCell(190, 6, "This export was automatically generated. If you have questions about the data contained or need further information, please contact our support at support@haze.bio.", "0", "L", false)
	pdf.Ln(6)
	pdf.MultiCell(190, 6, "According to our privacy policy, you can request a new data export every 7 days. You also have the right to request deletion of your data.", "0", "L", false)

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}

	return &buf, nil
}

/* Upload export file to S3 */
func (des *DataExportService) uploadExportFile(pdfBuffer *bytes.Buffer, fileName string, password string) (string, error) {
	fileBytes := pdfBuffer.Bytes()

	actualURL, err := des.FileService.UploadDataExport(fileName, fileBytes, password)
	if err != nil {
		return "", err
	}

	return actualURL, nil
}

/* Send export email to user */
func (des *DataExportService) sendExportEmail(userID uint, password string, expiresAt time.Time) error {
	user, err := des.UserService.GetUserByUID(userID)
	if err != nil {
		log.Printf("Error loading user for export email: %v", err)
		return err
	}

	if user.Email == nil {
		log.Printf("User %d has no email address", userID)
		return errors.New("user has no email address")
	}

	content := &models.EmailContent{
		To:      *user.Email,
		Subject: "Your cutz.lol Data Export is Ready",
		Body:    "data_export",
		Data: map[string]string{
			"DownloadURL": downloadURL,
		},
	}

	return des.EmailService.SendTemplateEmail(content)
}

/* Get the latest data export for a user */
func (des *DataExportService) GetLatestExport(userID uint) (*models.DataExport, error) {
	var export models.DataExport

	err := des.DB.Where("user_id = ?", userID).Order("requested_at DESC").First(&export).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("no export found for this user")
		}
		return nil, err
	}

	export.FilePassword = ""

	return &export, nil
}

func (des *DataExportService) GetExportStatus(userID uint, exportID uint) (*models.DataExport, error) {
	var export models.DataExport

	err := des.DB.Where("id = ? AND user_id = ?", exportID, userID).First(&export).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("export not found")
		}
		return nil, err
	}

	export.FilePassword = ""

	return &export, nil
}

func (des *DataExportService) ValidateExportDownload(exportID uint, password string) (*models.DataExportDownloadResponse, error) {
	var export models.DataExport

	err := des.DB.First(&export, exportID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("export not found")
		}
		return nil, err
	}

	if time.Now().After(export.ExpiresAt) {
		return nil, errors.New("the export link has expired")
	}

	if export.FilePassword != password {
		return nil, errors.New("invalid password")
	}

	if export.Status != models.DataExportStatusCompleted {
		return nil, errors.New("the export is not yet completed")
	}

	if export.DownloadedAt != nil {
		return nil, errors.New("this export has already been downloaded")
	}

	downloadURL := export.FileURL

	now := time.Now()
	des.DB.Model(&export).Update("downloaded_at", now)

	return &models.DataExportDownloadResponse{
		DownloadURL: downloadURL,
		ExpiresAt:   export.ExpiresAt,
	}, nil
}

func (des *DataExportService) CleanupExpiredExports() error {
	var expiredExports []models.DataExport

	err := des.DB.Where("expires_at < ?", time.Now()).Find(&expiredExports).Error
	if err != nil {
		return err
	}

	for _, export := range expiredExports {
		if export.FileURL != "" {
			err := des.FileService.DeleteFileByURL(export.FileURL)
			if err != nil {
				log.Printf("Error deleting export file %s: %v", export.FileURL, err)
			}
		}

		des.DB.Delete(&export)
	}

	return nil
}

func generateSecurePassword(length int) (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?"
	password := make([]byte, length)

	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		password[i] = charset[n.Int64()]
	}

	return string(password), nil
}

func addDataRow(pdf *gofpdf.Fpdf, label, value string) {
	pdf.Cell(60, 6, label)
	pdf.Cell(130, 6, value)
	pdf.Ln(6)
}

func formatBool(value bool) string {
	if value {
		return "Yes"
	}
	return "No"
}

func truncateText(text string, maxLength int) string {
	if len(text) <= maxLength {
		return text
	}
	return text[:maxLength] + "..."
}
