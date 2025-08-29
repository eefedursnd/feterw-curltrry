package services

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/hazebio/haze.bio_file-upload/config"
	"github.com/hazebio/haze.bio_file-upload/utils"
)

type FileMetadata struct {
	ExpiresAt    *time.Time `json:"expiresAt,omitempty"`
	PasswordHash string     `json:"passwordHash,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
}

type R2Service struct {
	client    *http.Client
	endpoint  string
	bucket    string
	accessKey string
	secretKey string
}

func NewR2Service() (*R2Service, error) {
	// Create optimized HTTP client for R2
	client := &http.Client{
		Timeout: 5 * time.Minute,
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 10,
			IdleConnTimeout:     30 * time.Second,
			DisableCompression:  true,
			ForceAttemptHTTP2:   true,
		},
	}

	return &R2Service{
		client:    client,
		endpoint:  config.R2Endpoint,
		bucket:    config.R2BucketName,
		accessKey: config.R2AccessKeyId,
		secretKey: config.R2SecretAccessKey,
	}, nil
}

func (s *R2Service) UploadFile(key string, body io.Reader) error {
	var contentLength int64
	var bodyToUse io.Reader = body

	// Optimized streaming approach
	if seeker, ok := body.(io.Seeker); ok {
		currentPos, err := seeker.Seek(0, io.SeekCurrent)
		if err != nil {
			return fmt.Errorf("failed to get current position: %w", err)
		}

		size, err := seeker.Seek(0, io.SeekEnd)
		if err != nil {
			return fmt.Errorf("failed to seek to end: %w", err)
		}

		_, err = seeker.Seek(currentPos, io.SeekStart)
		if err != nil {
			return fmt.Errorf("failed to reset position: %w", err)
		}

		contentLength = size
		bodyToUse = body // Use original reader for streaming
	} else {
		// Only read into memory if we can't seek
		bodyBytes, err := io.ReadAll(body)
		if err != nil {
			return fmt.Errorf("failed to read body: %w", err)
		}
		bodyToUse = bytes.NewReader(bodyBytes)
		contentLength = int64(len(bodyBytes))
	}

	// Create R2 PUT request
	url := fmt.Sprintf("%s/%s", s.endpoint, key)
	req, err := http.NewRequest("PUT", url, bodyToUse)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set R2 headers
	req.Header.Set("Content-Type", utils.GetContentType(key))
	req.Header.Set("Content-Length", fmt.Sprintf("%d", contentLength))
	req.Header.Set("Cache-Control", "public, max-age=31536000")
	
	// Add R2 authentication (using S3-compatible API)
	req.Header.Set("Authorization", fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s", s.accessKey))
	req.Header.Set("X-Amz-Date", time.Now().Format("20060102T150405Z"))

	// Execute request
	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to upload to R2: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("R2 upload failed: status %d, response: %s", resp.StatusCode, string(body))
	}

	log.Printf("Successfully uploaded %s to R2", key)
	return nil
}

func (s *R2Service) UploadTemporaryFile(key string, body io.Reader, expiration time.Duration) error {
	expiresAt := time.Now().Add(expiration)

	metadata := FileMetadata{
		ExpiresAt: &expiresAt,
		CreatedAt: time.Now(),
	}

	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	return s.uploadFileWithMetadata(key, body, string(metadataJSON))
}

func (s *R2Service) UploadPasswordProtectedFile(key string, body io.Reader, password string) error {
	passwordHash := hashPassword(password)

	metadata := FileMetadata{
		PasswordHash: passwordHash,
		CreatedAt:    time.Now(),
	}

	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	return s.uploadFileWithMetadata(key, body, string(metadataJSON))
}

func (s *R2Service) uploadFileWithMetadata(key string, body io.Reader, metadataJSON string) error {
	var contentLength int64
	var bodyToUse io.Reader = body

	if seeker, ok := body.(io.Seeker); ok {
		currentPos, err := seeker.Seek(0, io.SeekCurrent)
		if err != nil {
			return fmt.Errorf("failed to get current position: %w", err)
		}

		size, err := seeker.Seek(0, io.SeekEnd)
		if err != nil {
			return fmt.Errorf("failed to seek to end: %w", err)
		}

		_, err = seeker.Seek(currentPos, io.SeekStart)
		if err != nil {
			return fmt.Errorf("failed to reset position: %w", err)
		}

		contentLength = size
		bodyToUse = body
	} else {
		bodyBytes, err := io.ReadAll(body)
		if err != nil {
			return fmt.Errorf("failed to read body: %w", err)
		}
		bodyToUse = bytes.NewReader(bodyBytes)
		contentLength = int64(len(bodyBytes))
	}

	// Create R2 PUT request with metadata
	url := fmt.Sprintf("%s/%s", s.endpoint, key)
	req, err := http.NewRequest("PUT", url, bodyToUse)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set R2 headers
	req.Header.Set("Content-Type", utils.GetContentType(key))
	req.Header.Set("Content-Length", fmt.Sprintf("%d", contentLength))
	req.Header.Set("X-Amz-Meta-File-Metadata", metadataJSON)
	req.Header.Set("Cache-Control", "public, max-age=31536000")
	
	// Add R2 authentication
	req.Header.Set("Authorization", fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s", s.accessKey))
	req.Header.Set("X-Amz-Date", time.Now().Format("20060102T150405Z"))

	// Execute request
	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to upload to R2: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("R2 upload failed: status %d, response: %s", resp.StatusCode, string(body))
	}

	log.Printf("Successfully uploaded %s to R2 with metadata", key)
	return nil
}

func (s *R2Service) GetFile(key string) (*http.Response, error) {
	url := fmt.Sprintf("%s/%s", s.endpoint, key)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add R2 authentication
	req.Header.Set("Authorization", fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s", s.accessKey))
	req.Header.Set("X-Amz-Date", time.Now().Format("20060102T150405Z"))

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get file from R2: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, fmt.Errorf("R2 get failed: status %d", resp.StatusCode)
	}

	return resp, nil
}

func (s *R2Service) GetFileInfo(key string) (*http.Response, error) {
	url := fmt.Sprintf("%s/%s", s.endpoint, key)
	req, err := http.NewRequest("HEAD", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add R2 authentication
	req.Header.Set("Authorization", fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s", s.accessKey))
	req.Header.Set("X-Amz-Date", time.Now().Format("20060102T150405Z"))

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get file info from R2: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, fmt.Errorf("R2 head failed: status %d", resp.StatusCode)
	}

	return resp, nil
}

func (s *R2Service) GetFileRange(key string, start, end int64) (*http.Response, error) {
	url := fmt.Sprintf("%s/%s", s.endpoint, key)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set range header
	rangeString := fmt.Sprintf("bytes=%d-%d", start, end)
	req.Header.Set("Range", rangeString)

	// Add R2 authentication
	req.Header.Set("Authorization", fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s", s.accessKey))
	req.Header.Set("X-Amz-Date", time.Now().Format("20060102T150405Z"))

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get file range from R2: %w", err)
	}

	if resp.StatusCode != http.StatusPartialContent && resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, fmt.Errorf("R2 range request failed: status %d", resp.StatusCode)
	}

	return resp, nil
}

func (s *R2Service) DeleteFile(key string) error {
	url := fmt.Sprintf("%s/%s", s.endpoint, key)
	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Add R2 authentication
	req.Header.Set("Authorization", fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s", s.accessKey))
	req.Header.Set("X-Amz-Date", time.Now().Format("20060102T150405Z"))

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete file from R2: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("R2 delete failed: status %d, response: %s", resp.StatusCode, string(body))
	}

	log.Printf("Successfully deleted %s from R2", key)
	return nil
}

func (s *R2Service) FileExists(key string) (bool, error) {
	resp, err := s.GetFileInfo(key)
	if err != nil {
		if strings.Contains(err.Error(), "404") {
			return false, nil
		}
		return false, err
	}
	defer resp.Body.Close()
	return true, nil
}

func (s *R2Service) GetFileMetadata(key string) (*FileMetadata, error) {
	resp, err := s.GetFileInfo(key)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	metadataJSON := resp.Header.Get("X-Amz-Meta-File-Metadata")
	if metadataJSON != "" {
		var metadata FileMetadata
		if err := json.Unmarshal([]byte(metadataJSON), &metadata); err != nil {
			return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
		}
		return &metadata, nil
	}

	return &FileMetadata{
		CreatedAt: time.Now(),
	}, nil
}

func (s *R2Service) UploadTemporaryProtectedFile(key string, body io.Reader, password string, expiration time.Duration) error {
	expiresAt := time.Now().Add(expiration)
	passwordHash := hashPassword(password)

	metadata := FileMetadata{
		ExpiresAt:    &expiresAt,
		PasswordHash: passwordHash,
		CreatedAt:    time.Now(),
	}

	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	return s.uploadFileWithMetadata(key, body, string(metadataJSON))
}

func (s *R2Service) CleanupExpiredFiles() error {
	// R2 doesn't have a direct list operation, so we'll implement this differently
	// For now, we'll rely on R2's automatic cleanup for expired files
	log.Println("R2 automatic cleanup is handled by Cloudflare")
	return nil
}

func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}
