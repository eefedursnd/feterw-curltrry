package models

import (
	"time"
)

type ApplicationStatus string

const (
	StatusDraft     ApplicationStatus = "draft"
	StatusSubmitted ApplicationStatus = "submitted"
	StatusInReview  ApplicationStatus = "in_review"
	StatusApproved  ApplicationStatus = "approved"
	StatusRejected  ApplicationStatus = "rejected"

	ApplicationRejectionCooldown = 7 // in days
)

type InputType string

const (
	InputTypeShortText InputType = "short_text"
	InputTypeLongText  InputType = "long_text"
	InputTypeSelect    InputType = "select"
	InputTypeCheckbox  InputType = "checkbox"
)

type Position struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Active      bool       `json:"active"`
	Questions   []Question `json:"questions"`
}

type Question struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Subtitle  string    `json:"subtitle"`
	InputType InputType `json:"input_type"`
	Required  bool      `json:"required"`
	Options   []string  `json:"options"` // input type
	SortOrder uint      `json:"sort_order"`
}

type Application struct {
	ID             uint              `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID         uint              `json:"user_id" gorm:"not null;index"`
	PositionID     string            `json:"position_id" gorm:"not null;index"`
	Status         ApplicationStatus `json:"status" gorm:"type:varchar(20);default:'draft'"`
	StartedAt      time.Time         `json:"started_at" gorm:"autoCreateTime"`
	LastUpdatedAt  time.Time         `json:"last_updated_at" gorm:"autoUpdateTime"`
	SubmittedAt    *time.Time        `json:"submitted_at"`
	ExpiresAt      time.Time         `json:"expires_at"`
	TimeToComplete int64             `json:"time_to_complete"` // Time in seconds
	ReviewedBy     *uint             `json:"reviewed_by"`
	ReviewedAt     *time.Time        `json:"reviewed_at"`
	FeedbackNote   string            `json:"feedback_note" gorm:"type:text"`
	Responses      []Response        `json:"responses" gorm:"foreignKey:ApplicationID;references:ID;constraint:OnDelete:CASCADE"`
}

type Response struct {
	ID            uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	ApplicationID uint      `json:"application_id" gorm:"not null;index"`
	QuestionID    string    `json:"question_id" gorm:"not null"`
	Answer        string    `json:"answer" gorm:"type:text"`
	TimeToAnswer  int64     `json:"time_to_answer"` // Time in seconds
	CreatedAt     time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type ApplicationSession struct {
	ApplicationID   uint              `json:"application_id"`
	UserID          uint              `json:"user_id"`
	PositionID      string            `json:"position_id"`
	CurrentQuestion int               `json:"current_question"`
	Answers         map[string]string `json:"answers"`
	TimePerQuestion map[string]int64  `json:"time_per_question"`
	StartTime       time.Time         `json:"start_time"`
	LastActiveTime  time.Time         `json:"last_active_time"`
	ExpiresAt       time.Time         `json:"expires_at"`
}

var AvailablePositions = []Position{
	{
		ID:          "moderator",
		Title:       "Community Moderator",
		Description: "Help maintain a healthy community by enforcing rules and assisting users.",
		Active:      true,
		Questions: []Question{
			{
				ID:        "mod_exp",
				Title:     "Previous Experience",
				Subtitle:  "Tell us about your experience as a moderator in other communities",
				InputType: InputTypeLongText,
				Required:  true,
				SortOrder: 1,
			},
			{
				ID:        "mod_age",
				Title:     "Age",
				Subtitle:  "How old are you?",
				InputType: InputTypeShortText,
				Required:  true,
				SortOrder: 2,
			},
			{
				ID:        "mod_device",
				Title:     "Device",
				Subtitle:  "Which device do you primarily use?",
				InputType: InputTypeSelect,
				Options:   []string{"Computer", "Smartphone", "Tablet", "Multiple devices"},
				Required:  true,
				SortOrder: 3,
			},
			{
				ID:        "mod_scenario",
				Title:     "Scenario Question",
				Subtitle:  "How would you handle a situation where two users are having a heated argument?",
				InputType: InputTypeLongText,
				Required:  true,
				SortOrder: 4,
			},
			{
				ID:        "mod_time",
				Title:     "Availability",
				Subtitle:  "How many hours per week can you dedicate to moderation?",
				InputType: InputTypeShortText,
				Required:  true,
				SortOrder: 5,
			},
			{
				ID:        "mod_timezone",
				Title:     "Timezone",
				Subtitle:  "What is your timezone?",
				InputType: InputTypeShortText,
				Required:  true,
				SortOrder: 6,
			},
			{
				ID:        "mod_rules",
				Title:     "Rules Understanding",
				Subtitle:  "Why are community guidelines important?",
				InputType: InputTypeLongText,
				Required:  true,
				SortOrder: 7,
			},
			{
				ID:        "mod_why",
				Title:     "Why Us?",
				Subtitle:  "Why do you want to moderate for our community?",
				InputType: InputTypeLongText,
				Required:  true,
				SortOrder: 8,
			},
			{
				ID:        "mod_challenges",
				Title:     "Biggest Challenge",
				Subtitle:  "What do you think is the biggest challenge in moderating an online community?",
				InputType: InputTypeLongText,
				Required:  true,
				SortOrder: 9,
			},
			{
				ID:        "mod_style",
				Title:     "Moderation Style",
				Subtitle:  "How would you describe your moderation style?",
				InputType: InputTypeLongText,
				Required:  true,
				SortOrder: 10,
			},
			{
				ID:        "mod_language",
				Title:     "Languages",
				Subtitle:  "Which languages do you speak?",
				InputType: InputTypeShortText,
				Required:  true,
				SortOrder: 11,
			},
			{
				ID:        "mod_availability_detail",
				Title:     "Availability Details",
				Subtitle:  "Are there specific days or times you're most available?",
				InputType: InputTypeLongText,
				Required:  false,
				SortOrder: 12,
			},
			{
				ID:        "mod_final",
				Title:     "Anything Else?",
				Subtitle:  "Is there anything else you'd like us to know?",
				InputType: InputTypeLongText,
				Required:  false,
				SortOrder: 13,
			},
		},
	},
	{
		ID:          "concept_creator",
		Title:       "Concept Creator",
		Description: "Develop creative and innovative concepts for new features or community events.",
		Active:      true,
		Questions: []Question{
			{
				ID:        "concept_exp",
				Title:     "Creative Experience",
				Subtitle:  "Tell us about your background in creative work or concept development",
				InputType: InputTypeLongText,
				Required:  true,
				SortOrder: 1,
			},
			{
				ID:        "concept_age",
				Title:     "Age",
				Subtitle:  "How old are you?",
				InputType: InputTypeShortText,
				Required:  true,
				SortOrder: 2,
			},
			{
				ID:        "concept_device",
				Title:     "Device",
				Subtitle:  "Which device do you primarily use?",
				InputType: InputTypeSelect,
				Options:   []string{"Computer", "Smartphone", "Tablet", "Multiple devices"},
				Required:  true,
				SortOrder: 3,
			},
			{
				ID:        "concept_example",
				Title:     "Your Best Concept",
				Subtitle:  "Describe a concept or idea you've developed that you're proud of",
				InputType: InputTypeLongText,
				Required:  true,
				SortOrder: 4,
			},
			{
				ID:        "concept_collab",
				Title:     "Collaboration",
				Subtitle:  "How do you usually collaborate with others on ideas?",
				InputType: InputTypeLongText,
				Required:  true,
				SortOrder: 5,
			},
			{
				ID:        "concept_timezone",
				Title:     "Timezone",
				Subtitle:  "What is your timezone?",
				InputType: InputTypeShortText,
				Required:  true,
				SortOrder: 6,
			},
			{
				ID:        "concept_feedback",
				Title:     "Handling Feedback",
				Subtitle:  "How do you handle criticism or feedback on your ideas?",
				InputType: InputTypeLongText,
				Required:  true,
				SortOrder: 7,
			},
			{
				ID:        "concept_tools",
				Title:     "Tools",
				Subtitle:  "What tools do you use to visualize or present your ideas?",
				InputType: InputTypeShortText,
				Required:  false,
				SortOrder: 8,
			},
			{
				ID:        "concept_pitch",
				Title:     "Idea Pitch",
				Subtitle:  "Pitch us a concept idea in a few sentences",
				InputType: InputTypeLongText,
				Required:  true,
				SortOrder: 9,
			},
			{
				ID:        "concept_why",
				Title:     "Why This Role?",
				Subtitle:  "Why do you want to be a concept creator with us?",
				InputType: InputTypeLongText,
				Required:  true,
				SortOrder: 10,
			},
			{
				ID:        "concept_language",
				Title:     "Languages",
				Subtitle:  "Which languages do you speak?",
				InputType: InputTypeShortText,
				Required:  true,
				SortOrder: 11,
			},
			{
				ID:        "concept_final",
				Title:     "Anything Else?",
				Subtitle:  "Is there anything else you'd like us to know?",
				InputType: InputTypeLongText,
				Required:  false,
				SortOrder: 12,
			},
		},
	},
}

func GetPositionByID(positionID string) *Position {
	for _, position := range AvailablePositions {
		if position.ID == positionID {
			return &position
		}
	}
	return nil
}

func GetQuestionByID(positionID string, questionID string) *Question {
	position := GetPositionByID(positionID)
	if position == nil {
		return nil
	}

	for _, question := range position.Questions {
		if question.ID == questionID {
			return &question
		}
	}
	return nil
}
