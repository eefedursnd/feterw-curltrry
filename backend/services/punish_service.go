package services

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/utils"
	"gorm.io/gorm"
)

type PunishService struct {
	DB     *gorm.DB
	Client *redis.Client

	UserService  *UserService
	EmailService *EmailService
}

func NewPunishService(db *gorm.DB, client *redis.Client) *PunishService {
	return &PunishService{
		DB:           db,
		Client:       client,
		UserService:  &UserService{DB: db, Client: client},
		EmailService: &EmailService{DB: db, Client: client},
	}
}

/* Create a new punishment */
func (p *PunishService) CreatePunishment(punishment *models.Punishment) error {
	existingPunishment, err := p.GetActivePunishmentForUser(punishment.UserID)
	if err != nil {
		return err
	}

	if existingPunishment != nil {
		return errors.New("user already has an active punishment")
	}

	user, err := p.UserService.GetUserByUID(punishment.UserID)
	if err != nil {
		return err
	}

	if err := p.DB.Create(punishment).Error; err != nil {
		log.Println("Error creating punishment:", err)
		return err
	}

	if user.Email == nil {
		log.Println("User has no email, skipping email notification")
		return nil
	}

	content := &models.EmailContent{
		To:      *user.Email,
		Subject: "Your account has been restricted",
		Body:    "account_restricted",
		Data: map[string]string{
			"PunishmentId": utils.UintToString(punishment.ID),
			"StartDate":    utils.FormatDate(punishment.CreatedAt),
			"EndDate":      utils.FormatDate(punishment.EndDate),
			"Reason":       punishment.Reason,
		},
	}

	if err := p.EmailService.SendTemplateEmail(content); err != nil {
		log.Printf("Error sending restriction notification email: %v", err)
	}

	return nil
}

/* Create punishment from template */
func (p *PunishService) CreatePunishmentFromTemplate(userID uint, templateID string, details string, customDuration int, staffID uint, punishmentType string) (*models.Punishment, error) {
	template, found := config.GetPunishmentTemplateByID(templateID)
	if !found {
		return nil, errors.New("invalid punishment template")
	}

	var endDate time.Time
	if customDuration == -1 {
		endDate = time.Now().AddDate(100, 0, 0)
	} else if customDuration > 0 {
		endDate = time.Now().Add(time.Duration(customDuration) * time.Hour)
	} else {
		endDate = time.Now().Add(template.Duration)
	}

	punishment := &models.Punishment{
		UserID:         userID,
		StaffID:        staffID,
		Reason:         template.Name,
		Details:        details,
		EndDate:        endDate,
		Active:         true,
		PunishmentType: punishmentType,
	}

	err := p.CreatePunishment(punishment)
	if err != nil {
		return nil, err
	}

	moderationLog := &models.ModerationLog{
		ActionType:   "restrict",
		StaffID:      staffID,
		TargetID:     userID,
		PunishmentID: punishment.ID,
	}

	if err := p.DB.Create(moderationLog).Error; err != nil {
		log.Printf("Error logging moderation action: %v", err)
	}

	return punishment, nil
}

/* Get punishment by ID */
func (p *PunishService) GetPunishmentByID(id uint) (*models.Punishment, error) {
	punishment := &models.Punishment{}
	err := p.DB.First(punishment, id).Error
	if err != nil {
		log.Println("Error getting punishment by ID:", err)
		return nil, err
	}
	return punishment, nil
}

/* Get active punishment for a user */
func (p *PunishService) GetActivePunishmentForUser(userID uint) (*models.Punishment, error) {
	punishments := []*models.Punishment{}

	err := p.DB.Where("user_id = ? AND active = ?", userID, true).Find(&punishments).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		log.Println("Error getting active punishment for user:", err)
		return nil, err
	}

	for _, punishment := range punishments {
		if punishment.Active {
			return punishment, nil
		}
	}

	return nil, nil
}

/* Get all active punishments for a user */
func (p *PunishService) GetActivePunishmentsForUser(userID uint) ([]*models.Punishment, error) {
	punishments := []*models.Punishment{}

	err := p.DB.Where("user_id = ? AND active = ?", userID, true).Find(&punishments).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []*models.Punishment{}, nil
		}
		log.Println("Error getting active punishments for user:", err)
		return nil, err
	}

	return punishments, nil
}

/* Update a punishment */
func (p *PunishService) UpdatePunishment(punishment *models.Punishment) error {
	err := p.DB.Model(punishment).Select("*").Where("id = ?", punishment.ID).Updates(punishment).Error
	if err != nil {
		return err
	}

	return nil
}

/* Deactivate a punishment */
func (p *PunishService) DeactivatePunishment(punishmentID uint, staffID uint) error {
	punishment := &models.Punishment{}
	err := p.DB.First(punishment, punishmentID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("punishment not found")
		}
		return err
	}

	punishment.Active = false
	err = p.UpdatePunishment(punishment)
	if err != nil {
		return err
	}

	moderationLog := &models.ModerationLog{
		ActionType:   "unrestrict",
		StaffID:      staffID,
		TargetID:     punishment.UserID,
		PunishmentID: punishmentID,
	}

	if err := p.DB.Create(moderationLog).Error; err != nil {
		log.Printf("Error logging moderation action: %v", err)
	}

	user, err := p.UserService.GetUserByUID(punishment.UserID)
	if err == nil && user.Email != nil {
		content := &models.EmailContent{
			To:      *user.Email,
			Subject: "Your account restriction has been removed",
			Body:    "account_unrestricted",
			Data: map[string]string{
				"Reason": punishment.Reason,
			},
		}

		if err := p.EmailService.SendTemplateEmail(content); err != nil {
			log.Printf("Error sending unrestriction notification email: %v", err)
		}
	}

	return nil
}

/* Create a report for a user */
func (p *PunishService) CreateReport(reporterID uint, reportedUsername string, reason string, details string) (*models.Report, error) {
	_, err := p.UserService.GetUserByUID(reporterID)
	if err != nil {
		return nil, errors.New("reporter user not found")
	}

	reportedUser, err := p.UserService.GetUserByUsername(reportedUsername)
	if err != nil {
		return nil, errors.New("reported user not found")
	}

	if reporterID == reportedUser.UID {
		return nil, errors.New("you cannot report yourself")
	}

	if !models.IsValidReportReason(reason) {
		return nil, errors.New("invalid report reason")
	}

	var existingReport models.Report
	err = p.DB.Where("reporter_user_id = ? AND reported_user_id = ? AND handled = ?",
		reporterID, reportedUser.UID, false).First(&existingReport).Error

	if err == nil {
		return nil, errors.New("you already have an open report for this user")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("Error checking for existing report: %v", err)
		return nil, errors.New("error checking for existing reports")
	}

	report := &models.Report{
		ReporterUserID: reporterID,
		ReportedUserID: reportedUser.UID,
		Reason:         reason,
		Details:        details,
		Handled:        false,
		HandledBy:      0,
		CreatedAt:      time.Now(),
	}

	if err := p.DB.Create(report).Error; err != nil {
		log.Printf("Error creating report: %v", err)
		return nil, errors.New("failed to create report")
	}

	reportCountKey := fmt.Sprintf("report_count:%d", reportedUser.UID)
	err = p.Client.Incr(reportCountKey).Err()
	if err != nil {
		log.Printf("Error incrementing report count: %v", err)
	}

	return report, nil
}

/* Get open reports for moderation */
func (p *PunishService) GetOpenReports() ([]*models.ReportWithDetails, error) {
	var reports []*models.Report
	err := p.DB.Where("handled = ?", false).Order("created_at DESC").Find(&reports).Error
	if err != nil {
		return nil, err
	}

	var reportDetails []*models.ReportWithDetails

	for _, report := range reports {
		reportDetail := &models.ReportWithDetails{
			Report: *report,
		}

		reportedUser, err := p.UserService.GetUserByUID(report.ReportedUserID)
		if err == nil {
			reportDetail.ReportedUsername = reportedUser.Username
			reportDetail.ReportedDisplayName = reportedUser.DisplayName

			reportCountKey := fmt.Sprintf("report_count:%d", report.ReportedUserID)
			reportCount, err := p.Client.Get(reportCountKey).Int64()
			if err == nil {
				reportDetail.TotalReports = int(reportCount)
			} else if err != redis.Nil {
				log.Printf("Error getting report count from Redis: %v", err)
				var count int64
				p.DB.Model(&models.Report{}).Where("reported_user_id = ?", report.ReportedUserID).Count(&count)
				reportDetail.TotalReports = int(count)
			}

			activePunishment, _ := p.GetActivePunishmentForUser(report.ReportedUserID)
			if activePunishment != nil {
				reportDetail.HasActivePunishment = true
			}
		}

		reporterUser, err := p.UserService.GetUserByUID(report.ReporterUserID)
		if err == nil {
			reportDetail.ReporterUsername = reporterUser.Username
		}

		reportDetails = append(reportDetails, reportDetail)
	}

	return reportDetails, nil
}

/* Handle a report as staff */
func (p *PunishService) HandleReport(reportID uint, staffID uint) error {
	report := &models.Report{}
	err := p.DB.First(report, reportID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("report not found")
		}
		return err
	}

	report.Handled = true
	report.HandledBy = staffID

	fields := map[string]interface{}{
		"handled":    true,
		"handled_by": staffID,
	}

	err = p.DB.Model(&models.Report{}).Where("id = ?", reportID).Updates(fields).Error
	if err != nil {
		return err
	}

	return nil
}

/* Create a new punishment for a user (PayPal Chargeback) */
func (p *PunishService) CreateChargebackPunishment(userID uint) error {
	punishment := &models.Punishment{
		UserID:         userID,
		StaffID:        0,
		Reason:         "Payment Chargeback detected on your account",
		Details:        "The account has been restricted due to a chargeback on a payment. ",
		EndDate:        time.Now().AddDate(100, 0, 0), // 100 years (permanent)
		Active:         true,
		PunishmentType: "full",
	}

	return p.CreatePunishment(punishment)
}

/* Assign report to staff member */
func (p *PunishService) AssignReportToStaff(reportID uint, staffID uint) error {
	report := &models.Report{}
	err := p.DB.First(report, reportID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("report not found")
		}
		return err
	}

	if report.HandledBy != 0 && report.HandledBy != staffID && !report.Handled {
		staffUser, err := p.UserService.GetUserByUID(report.HandledBy)
		if err == nil {
			return fmt.Errorf("report is already being handled by %s", staffUser.Username)
		}
		return errors.New("report is already being handled by another staff member")
	}

	if report.Handled {
		return errors.New("report has already been handled")
	}

	report.HandledBy = staffID
	return p.DB.Save(report).Error
}

/* Get report count */
func (p *PunishService) GetOpenReportCount() (int64, error) {
	var count int64
	err := p.DB.Model(&models.Report{}).Where("handled = ?", false).Count(&count).Error
	return count, err
}

/* Get report by ID */
func (p *PunishService) GetReport(reportID uint, staffID uint) (*models.ReportWithDetails, error) {
	var report models.Report

	err := p.DB.First(&report, reportID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("report not found")
		}
		return nil, err
	}

	if report.HandledBy != 0 && report.HandledBy != staffID {
		return nil, errors.New("this report is assigned to another staff member")
	}

	if report.HandledBy == 0 {
		report.HandledBy = staffID
		if err := p.DB.Save(&report).Error; err != nil {
			log.Printf("Error assigning report to staff: %v", err)
		}
	}

	reportDetail := &models.ReportWithDetails{
		Report: report,
	}

	reportedUser, err := p.UserService.GetUserByUID(report.ReportedUserID)
	if err == nil {
		reportDetail.ReportedUsername = reportedUser.Username
		reportDetail.ReportedDisplayName = reportedUser.DisplayName

		reportCountKey := fmt.Sprintf("report_count:%d", report.ReportedUserID)
		reportCount, err := p.Client.Get(reportCountKey).Int64()
		if err == nil {
			reportDetail.TotalReports = int(reportCount)
		} else if err != redis.Nil {
			var count int64
			p.DB.Model(&models.Report{}).Where("reported_user_id = ?", report.ReportedUserID).Count(&count)
			reportDetail.TotalReports = int(count)
		}

		activePunishment, _ := p.GetActivePunishmentForUser(report.ReportedUserID)
		if activePunishment != nil {
			reportDetail.HasActivePunishment = true
		}

		var similarReports []models.Report
		p.DB.Where("reported_user_id = ? AND reason = ? AND id != ? AND handled = ?",
			report.ReportedUserID, report.Reason, report.ID, false).Find(&similarReports)

		var reporters []string
		for _, r := range similarReports {
			reporter, err := p.UserService.GetUserByUID(r.ReporterUserID)
			if err == nil {
				reporters = append(reporters, reporter.Username)
			}
		}
		reportDetail.OtherReporters = reporters
	}

	reporterUser, err := p.UserService.GetUserByUID(report.ReporterUserID)
	if err == nil {
		reportDetail.ReporterUsername = reporterUser.Username
	}

	return reportDetail, nil
}
