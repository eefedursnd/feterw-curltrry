package config

import (
	"fmt"
	"os"

	"github.com/hazebio/haze.bio_payment/utils"
	"github.com/joho/godotenv"
)

var (
	HttpPort    int
	Environment string
	SecretKey   string

	Origin  string
	BaseURL string

	StripeWebhookSecret string
	StripeSecretKey     string

	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
)

func LoadConfig() error {
	err := godotenv.Load()
	if err != nil {
		return fmt.Errorf("error loading .env file: %w", err)
	}

	HttpPort = utils.StringToInt(os.Getenv("HTTP_PORT"))
	Environment = os.Getenv("ENVIRONMENT")
	SecretKey = os.Getenv("SECRET_KEY")

	Origin = os.Getenv("ORIGIN")
	BaseURL = os.Getenv("BASE_URL")

	StripeWebhookSecret = os.Getenv("STRIPE_WEBHOOK_SECRET")
	StripeSecretKey = os.Getenv("STRIPE_SECRET_KEY")

	SMTPHost = os.Getenv("SMTP_HOST")
	SMTPPort = os.Getenv("SMTP_PORT")
	SMTPUsername = os.Getenv("SMTP_USERNAME")
	SMTPPassword = os.Getenv("SMTP_PASSWORD")

	return nil
}
