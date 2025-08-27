package models

import (
	"time"
)

type DataExport struct {
	ID              uint       `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID          uint       `json:"user_id" gorm:"index;not null;constraint:OnDelete:CASCADE;"`
	Status          string     `json:"status" gorm:"not null"` // requested, processing, completed, failed
	FileURL         string     `json:"file_url" gorm:"default:null"`
	FileName        string     `json:"file_name" gorm:"default:null"`
	FilePassword    string     `json:"file_password" gorm:"default:null"`
	ExpiresAt       time.Time  `json:"expires_at"`
	DownloadedAt    *time.Time `json:"downloaded_at" gorm:"default:null"`
	RequestedAt     time.Time  `json:"requested_at" gorm:"autoCreateTime"`
	CompletedAt     *time.Time `json:"completed_at" gorm:"default:null"`
	LastRequestedAt time.Time  `json:"last_requested_at" gorm:"not null"`
}

type DataExportRequest struct {
	UserID uint `json:"user_id" binding:"required"`
}

type DataExportResponse struct {
	Message      string    `json:"message"`
	Status       string    `json:"status"`
	RequestedAt  time.Time `json:"requested_at"`
	EstimatedETA string    `json:"estimated_eta"`
	ExportId     uint      `json:"export_id"`
}

type DataExportDownloadRequest struct {
	ExportID uint   `json:"export_id" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type DataExportDownloadResponse struct {
	DownloadURL string    `json:"download_url"`
	ExpiresAt   time.Time `json:"expires_at"`
	Password    string    `json:"password"`
}

const (
	DataExportStatusRequested  = "requested"
	DataExportStatusProcessing = "processing"
	DataExportStatusCompleted  = "completed"
	DataExportStatusFailed     = "failed"
)
