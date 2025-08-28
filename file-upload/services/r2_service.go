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
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsConfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/aws/smithy-go"
	"github.com/hazebio/haze.bio_file-upload/config"
	"github.com/hazebio/haze.bio_file-upload/utils"
)

type FileMetadata struct {
	ExpiresAt    *time.Time `json:"expiresAt,omitempty"`
	PasswordHash string     `json:"passwordHash,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
}

type R2Service struct {
	s3Client *s3.Client
}

func NewR2Service() (*R2Service, error) {
	var cfg aws.Config
	var err error

	// Cloudflare R2 uses S3-compatible API
	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL: config.R2Endpoint,
		}, nil
	})

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second) // 30 seconds for config loading
	defer cancel()
	
	cfg, err = awsConfig.LoadDefaultConfig(ctx,
		awsConfig.WithRegion(config.R2Region),
		awsConfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			config.R2AccessKeyId,
			config.R2SecretAccessKey,
			"",
		)),
		awsConfig.WithEndpointResolverWithOptions(customResolver),
	)

	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %w", err)
	}

	// Create custom HTTP client with extended timeout
	httpClient := &http.Client{
		Timeout: 300 * time.Second, // 5 minutes timeout
	}

	return &R2Service{
		s3Client: s3.NewFromConfig(cfg, func(o *s3.Options) {
			o.HTTPClient = httpClient
		}),
	}, nil
}

func (s *R2Service) UploadFile(key string, body io.Reader) error {
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
	} else {
		bodyBytes, err := io.ReadAll(body)
		if err != nil {
			return fmt.Errorf("failed to read body: %w", err)
		}
		bodyToUse = bytes.NewReader(bodyBytes)
		contentLength = int64(len(bodyBytes))
	}

	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Second) // 5 minutes timeout
	defer cancel()
	
	_, err := s.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(config.R2BucketName),
		Key:           aws.String(key),
		Body:          bodyToUse,
		ContentLength: aws.Int64(contentLength),
		ContentType:   aws.String(utils.GetContentType(key)),
	})
	return err
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
	} else {
		bodyBytes, err := io.ReadAll(body)
		if err != nil {
			return fmt.Errorf("failed to read body: %w", err)
		}
		bodyToUse = bytes.NewReader(bodyBytes)
		contentLength = int64(len(bodyBytes))
	}

	metadata := map[string]string{
		"file-metadata": metadataJSON,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Second) // 5 minutes timeout
	defer cancel()
	
	_, err := s.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(config.R2BucketName),
		Key:           aws.String(key),
		Body:          bodyToUse,
		ContentLength: aws.Int64(contentLength),
		ContentType:   aws.String(utils.GetContentType(key)),
		Metadata:      metadata,
	})
	return err
}

func (s *R2Service) GetFile(key string) (*s3.GetObjectOutput, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second) // 1 minute timeout
	defer cancel()
	
	result, err := s.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(config.R2BucketName),
		Key:    aws.String(key),
	})
	return result, err
}

func (s *R2Service) GetFileInfo(key string) (*s3.HeadObjectOutput, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second) // 30 seconds timeout
	defer cancel()
	
	input := &s3.HeadObjectInput{
		Bucket: aws.String(config.R2BucketName),
		Key:    aws.String(key),
	}

	return s.s3Client.HeadObject(ctx, input)
}

func (s *R2Service) GetFileRange(key string, start, end int64) (*s3.GetObjectOutput, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second) // 1 minute timeout
	defer cancel()
	
	rangeString := fmt.Sprintf("bytes=%d-%d", start, end)
	result, err := s.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(config.R2BucketName),
		Key:    aws.String(key),
		Range:  aws.String(rangeString),
	})
	return result, err
}

func (s *R2Service) DeleteFile(key string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second) // 30 seconds timeout
	defer cancel()
	
	_, err := s.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(config.R2BucketName),
		Key:    aws.String(key),
	})
	return err
}

func (s *R2Service) FileExists(key string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second) // 30 seconds timeout
	defer cancel()
	
	_, err := s.s3Client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(config.R2BucketName),
		Key:    aws.String(key),
	})

	if err != nil {
		var apiErr smithy.APIError
		if errors.As(err, &apiErr) {
			if apiErr.ErrorCode() == "NotFound" {
				return false, nil
			}
		}
		return false, err
	}
	return true, nil
}

func (s *R2Service) GetFileMetadata(key string) (*FileMetadata, error) {
	headObj, err := s.GetFileInfo(key)
	if err != nil {
		return nil, err
	}

	if metadataJSON, ok := headObj.Metadata["file-metadata"]; ok {
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

func (s *R2Service) S3Client() *s3.Client {
	return s.s3Client
}

func (s *R2Service) FixContentTypes() error {
	paginator := s3.NewListObjectsV2Paginator(s.s3Client, &s3.ListObjectsV2Input{
		Bucket: aws.String(config.R2BucketName),
	})

	for paginator.HasMorePages() {
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second) // 1 minute timeout
		page, err := paginator.NextPage(ctx)
		cancel()
		if err != nil {
			return err
		}

		for _, obj := range page.Contents {
			key := *obj.Key
			contentType := utils.GetContentType(key)

			ctx2, cancel2 := context.WithTimeout(context.Background(), 30*time.Second) // 30 seconds timeout
			_, err := s.s3Client.CopyObject(ctx2, &s3.CopyObjectInput{
				Bucket:            aws.String(config.R2BucketName),
				CopySource:        aws.String(config.R2BucketName + "/" + key),
				Key:               aws.String(key),
				ContentType:       aws.String(contentType),
				MetadataDirective: types.MetadataDirectiveReplace,
			})
			cancel2()
			if err != nil {
				log.Printf("Error updating Content-Type for %s: %v", key, err)
			} else {
				log.Printf("Updated Content-Type for %s to %s", key, contentType)
			}
		}
	}
	return nil
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
	paginator := s3.NewListObjectsV2Paginator(s.s3Client, &s3.ListObjectsV2Input{
		Bucket: aws.String(config.R2BucketName),
	})

	for paginator.HasMorePages() {
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second) // 1 minute timeout
		page, err := paginator.NextPage(ctx)
		cancel()
		if err != nil {
			return err
		}

		for _, obj := range page.Contents {
			key := *obj.Key

			metadata, err := s.GetFileMetadata(key)
			if err != nil {
				log.Printf("Error getting metadata for %s: %v", key, err)
				continue
			}

			if metadata.ExpiresAt != nil && metadata.ExpiresAt.Before(time.Now()) {
				log.Printf("Deleting expired file: %s (expired at %v)", key, metadata.ExpiresAt)

				if err := s.DeleteFile(key); err != nil {
					log.Printf("Error deleting expired file %s: %v", key, err)
				}
			}
		}
	}

	return nil
}

func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}
