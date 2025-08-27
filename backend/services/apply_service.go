package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"gorm.io/gorm"
)

type ApplyService struct {
	DB           *gorm.DB
	Client       *redis.Client
	EmailService *EmailService
	UserService  *UserService
}

func NewApplyService(db *gorm.DB, client *redis.Client, emailService *EmailService, userService *UserService) *ApplyService {
	return &ApplyService{
		DB:           db,
		Client:       client,
		EmailService: emailService,
		UserService:  userService,
	}
}

func (as *ApplyService) GetActivePositions() []models.Position {
	var activePositions []models.Position
	for _, position := range models.AvailablePositions {
		if position.Active {
			activePositions = append(activePositions, position)
		}
	}
	return activePositions
}

func (as *ApplyService) GetPositionByID(id string) *models.Position {
	return models.GetPositionByID(id)
}

func (as *ApplyService) StartApplication(userID uint, positionID string) (*models.ApplicationSession, error) {
	position := models.GetPositionByID(positionID)
	if position == nil {
		return nil, errors.New("position not found")
	}

	var activeApplications []models.Application
	err := as.DB.Where("user_id = ? AND position_id = ? AND status IN (?, ?, ?)",
		userID, positionID, models.StatusSubmitted, models.StatusInReview, models.StatusApproved).Find(&activeApplications).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	if len(activeApplications) > 0 {
		return nil, errors.New("you already have an active application for this position")
	}

	var rejectedApplication models.Application
	cooldownCutoff := time.Now().AddDate(0, 0, -models.ApplicationRejectionCooldown)

	err = as.DB.Where("user_id = ? AND position_id = ? AND status = ? AND reviewed_at > ?",
		userID, positionID, models.StatusRejected, cooldownCutoff).
		Order("reviewed_at desc").
		First(&rejectedApplication).Error

	if err == nil {
		cooldownEnds := rejectedApplication.ReviewedAt.AddDate(0, 0, models.ApplicationRejectionCooldown)
		daysLeft := int(time.Until(cooldownEnds).Hours()/24) + 1

		return nil, fmt.Errorf("you were recently rejected for this position. Please wait %d more days before applying again", daysLeft)
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	sessionKey := fmt.Sprintf("application:session:%d:%s", userID, positionID)
	sessionData, err := as.Client.Get(sessionKey).Result()

	if err == nil {
		var session models.ApplicationSession
		err = json.Unmarshal([]byte(sessionData), &session)
		if err != nil {
			return nil, err
		}

		session.LastActiveTime = time.Now()
		sessionBytes, _ := json.Marshal(session)
		as.Client.Set(sessionKey, sessionBytes, 7*24*time.Hour) //7 days

		return &session, nil
	} else if err != redis.Nil {
		return nil, err
	}

	var existingApp models.Application
	err = as.DB.Where("user_id = ? AND position_id = ? AND status = ?",
		userID, positionID, models.StatusDraft).First(&existingApp).Error

	if err == nil {
		var responses []models.Response
		err = as.DB.Where("application_id = ?", existingApp.ID).Find(&responses).Error
		if err != nil {
			return nil, err
		}

		session := models.ApplicationSession{
			ApplicationID:   existingApp.ID,
			UserID:          userID,
			PositionID:      positionID,
			CurrentQuestion: 0,
			Answers:         make(map[string]string),
			TimePerQuestion: make(map[string]int64),
			StartTime:       existingApp.StartedAt,
			LastActiveTime:  time.Now(),
			ExpiresAt:       existingApp.ExpiresAt,
		}

		for _, resp := range responses {
			session.Answers[resp.QuestionID] = resp.Answer
			session.TimePerQuestion[resp.QuestionID] = resp.TimeToAnswer
		}

		sessionBytes, _ := json.Marshal(session)
		as.Client.Set(sessionKey, sessionBytes, 7*24*time.Hour) //7 days

		return &session, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	application := &models.Application{
		UserID:     userID,
		PositionID: positionID,
		Status:     models.StatusDraft,
		ExpiresAt:  time.Now().AddDate(0, 0, 7),
	}

	err = as.DB.Create(application).Error
	if err != nil {
		return nil, err
	}

	session := models.ApplicationSession{
		ApplicationID:   application.ID,
		UserID:          userID,
		PositionID:      positionID,
		CurrentQuestion: 0,
		Answers:         make(map[string]string),
		TimePerQuestion: make(map[string]int64),
		StartTime:       time.Now(),
		LastActiveTime:  time.Now(),
		ExpiresAt:       application.ExpiresAt,
	}

	sessionBytes, _ := json.Marshal(session)
	as.Client.Set(sessionKey, sessionBytes, 7*24*time.Hour) //7 days

	return &session, nil
}

func (as *ApplyService) SaveAnswer(userID uint, positionID string, questionID string, answer string, timeSpent int64) (*models.ApplicationSession, error) {
	sessionKey := fmt.Sprintf("application:session:%d:%s", userID, positionID)
	sessionData, err := as.Client.Get(sessionKey).Result()

	if err != nil {
		if err == redis.Nil {
			return nil, errors.New("no active application session found")
		}
		return nil, err
	}

	var session models.ApplicationSession
	err = json.Unmarshal([]byte(sessionData), &session)
	if err != nil {
		return nil, err
	}

	position := models.GetPositionByID(positionID)
	if position == nil {
		return nil, errors.New("position not found")
	}

	session.Answers[questionID] = answer
	session.TimePerQuestion[questionID] = timeSpent
	session.LastActiveTime = time.Now()

	sessionBytes, _ := json.Marshal(session)
	as.Client.Set(sessionKey, sessionBytes, 7*24*time.Hour) //7 days

	var existingResponse models.Response
	err = as.DB.Where("application_id = ? AND question_id = ?",
		session.ApplicationID, questionID).First(&existingResponse).Error

	if err == nil {
		existingResponse.Answer = answer
		existingResponse.TimeToAnswer = timeSpent
		err = as.DB.Save(&existingResponse).Error
		if err != nil {
			return nil, err
		}
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		response := models.Response{
			ApplicationID: session.ApplicationID,
			QuestionID:    questionID,
			Answer:        answer,
			TimeToAnswer:  timeSpent,
		}
		err = as.DB.Create(&response).Error
		if err != nil {
			return nil, err
		}
	} else {
		return nil, err
	}

	as.DB.Model(&models.Application{}).
		Where("id = ?", session.ApplicationID).
		Update("last_updated_at", time.Now())

	return &session, nil
}

func (as *ApplyService) SubmitApplication(userID uint, positionID string) error {
	sessionKey := fmt.Sprintf("application:session:%d:%s", userID, positionID)
	sessionData, err := as.Client.Get(sessionKey).Result()

	if err != nil {
		if err == redis.Nil {
			return errors.New("no active application session found")
		}
		return err
	}

	var session models.ApplicationSession
	err = json.Unmarshal([]byte(sessionData), &session)
	if err != nil {
		return err
	}

	position := models.GetPositionByID(positionID)
	if position == nil {
		return errors.New("position not found")
	}

	for _, question := range position.Questions {
		if question.Required {
			if answer, exists := session.Answers[question.ID]; !exists || answer == "" {
				return errors.New("not all required questions have been answered")
			}
		}
	}

	var totalTime int64 = 0
	for _, time := range session.TimePerQuestion {
		totalTime += time
	}

	now := time.Now()
	updates := map[string]interface{}{
		"status":           models.StatusSubmitted,
		"submitted_at":     now,
		"time_to_complete": totalTime,
	}

	err = as.DB.Model(&models.Application{}).
		Where("id = ?", session.ApplicationID).
		Updates(updates).Error

	if err != nil {
		return err
	}

	as.Client.Del(sessionKey)

	user, err := as.UserService.GetUserByUID(userID)
	if err != nil {
		log.Printf("Failed to get user for email notification: %v", err)
	} else if user.Email != nil {
		content := &models.EmailContent{
			To:      *user.Email,
			Subject: "Your application has been submitted",
			Body:    "application_submitted",
			Data: map[string]string{
				"Username":     user.DisplayName,
				"PositionName": position.Title,
			},
		}
		as.EmailService.SendTemplateEmail(content)
	}

	return nil
}

func (as *ApplyService) GetApplicationByID(id uint) (*models.Application, error) {
	var application models.Application
	err := as.DB.First(&application, id).Error
	if err != nil {
		return nil, err
	}

	var responses []models.Response
	err = as.DB.Where("application_id = ?", id).Find(&responses).Error
	if err != nil {
		return nil, err
	}

	application.Responses = responses

	return &application, nil
}

func (as *ApplyService) GetApplicationsByUserID(userID uint) ([]models.Application, error) {
	var applications []models.Application
	err := as.DB.Where("user_id = ?", userID).Find(&applications).Error
	if err != nil {
		return nil, err
	}

	for i := range applications {
		var responses []models.Response
		err = as.DB.Where("application_id = ?", applications[i].ID).Find(&responses).Error
		if err != nil {
			return nil, err
		}
		applications[i].Responses = responses
	}

	return applications, nil
}

func (as *ApplyService) GetApplicationsByStatus(status models.ApplicationStatus) ([]models.Application, error) {
	var applications []models.Application
	err := as.DB.Where("status = ?", status).Find(&applications).Error
	if err != nil {
		return nil, err
	}

	for i := range applications {
		var responses []models.Response
		err = as.DB.Where("application_id = ?", applications[i].ID).Find(&responses).Error
		if err != nil {
			return nil, err
		}
		applications[i].Responses = responses
	}

	return applications, nil
}

func (as *ApplyService) ReviewApplication(applicationID uint, reviewerID uint, status models.ApplicationStatus, feedbackNote string) error {
	log.Println("Reviewing application:", applicationID, "by reviewer:", reviewerID)
	log.Println("New status:", status)
	if status != models.StatusApproved &&
		status != models.StatusRejected &&
		status != models.StatusInReview {
		return errors.New("invalid review status")
	}

	application, err := as.GetApplicationByID(applicationID)
	if err != nil {
		return err
	}

	if application.Status != models.StatusSubmitted && application.Status != models.StatusInReview {
		return errors.New("application is not in a reviewable status")
	}

	now := time.Now()
	updates := map[string]interface{}{
		"status":        status,
		"reviewed_by":   reviewerID,
		"reviewed_at":   now,
		"feedback_note": feedbackNote,
	}

	err = as.DB.Model(&models.Application{}).Where("id = ?", applicationID).Updates(updates).Error
	if err != nil {
		return err
	}

	user, err := as.UserService.GetUserByUID(application.UserID)
	if err != nil {
		log.Printf("Failed to get user for email notification: %v", err)
		return nil
	}

	if user.Email == nil {
		return nil
	}

	position := models.GetPositionByID(application.PositionID)
	if position == nil {
		log.Printf("Position not found for email notification: %s", application.PositionID)
		return nil
	}

	var emailTemplate string
	var emailSubject string

	switch status {
	case models.StatusApproved:
		emailTemplate = "application_approved"
		emailSubject = "Your application has been approved"
	case models.StatusRejected:
		emailTemplate = "application_rejected"
		emailSubject = "Your application status"
	}

	content := &models.EmailContent{
		To:      *user.Email,
		Subject: emailSubject,
		Body:    emailTemplate,
		Data: map[string]string{
			"Username":     user.DisplayName,
			"PositionName": position.Title,
			"Feedback":     feedbackNote,
		},
	}

	as.EmailService.SendTemplateEmail(content)

	return nil
}

func (as *ApplyService) CleanupExpiredApplications() error {
	pattern := "application:session:*"
	keys, err := as.Client.Keys(pattern).Result()
	if err != nil {
		return err
	}

	now := time.Now()

	for _, key := range keys {
		sessionData, err := as.Client.Get(key).Result()
		if err != nil {
			continue
		}

		var session models.ApplicationSession
		err = json.Unmarshal([]byte(sessionData), &session)
		if err != nil {
			continue
		}

		if session.ExpiresAt.Before(now) {
			as.Client.Del(key)
		}
	}

	return as.DB.Where("status = ? AND expires_at < ?",
		models.StatusDraft, now).Delete(&models.Application{}).Error
}
