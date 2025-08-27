package config

import (
	"fmt"
	"os"

	"github.com/hazebio/haze.bio_file-upload/utils"
	"github.com/joho/godotenv"
)

var (
	HttpPort    int
	Environment string
	APIKey      string
	Origin      string

	// Cloudflare R2 Configuration
	R2Region          string
	R2AccessKeyId     string
	R2SecretAccessKey string
	R2BucketName      string
	R2Endpoint        string
)

func LoadConfig() error {
	err := godotenv.Load()
	if err != nil {
		return fmt.Errorf("error loading .env file: %w", err)
	}

	HttpPort = utils.StringToInt(os.Getenv("HTTP_PORT"))
	Environment = os.Getenv("ENVIRONMENT")
	APIKey = os.Getenv("API_KEY")
	Origin = os.Getenv("ORIGIN")

	R2Region = os.Getenv("R2_REGION")
	R2AccessKeyId = os.Getenv("R2_ACCESS_KEY_ID")
	R2SecretAccessKey = os.Getenv("R2_SECRET_ACCESS_KEY")
	R2BucketName = os.Getenv("R2_BUCKET_NAME")
	R2Endpoint = os.Getenv("R2_ENDPOINT")

	return nil
}
