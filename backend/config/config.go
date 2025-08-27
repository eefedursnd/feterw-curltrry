package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/hazebio/haze.bio_backend/utils"
	"github.com/joho/godotenv"
)

var (
	HttpPort      int
	Environment   string
	APIKey        string
	Origin        string
	Origins       []string
	CookieDomain  string
	DatabaseURL   string
	SecretKey     string
	EncryptionKey string

	DiscordToken        string
	DiscordGuildID      string
	DiscordLinkedRoleID string
	DiscordPrefix       string
	DiscordClientID     string
	DiscordClientSecret string
	DiscordRedirectURI  string

	RedisAddr     string
	RedisPassword string
	RedisDB       int

	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
	SMTPTLSEnabled bool

	// File upload service configuration (backend communicates with file-upload service)
	R2URL    = os.Getenv("R2_URL")        // File upload service URL from env
	R2APIKey = os.Getenv("R2_API_KEY")    // File upload service API key

	HenrikApiKey string
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
	originsStr := os.Getenv("ORIGINS")
	if originsStr != "" {
		Origins = strings.Split(originsStr, ",")
		for i, origin := range Origins {
			Origins[i] = strings.TrimSpace(origin)
		}
	} else if Origin != "" {
		Origins = []string{Origin}
	} else {
		Origins = []string{"http://localhost:80", "http://localhost:5173"}
	}
	CookieDomain = os.Getenv("COOKIE_DOMAIN")
	DatabaseURL = os.Getenv("DATABASE_URL")
	SecretKey = os.Getenv("SECRET_KEY")
	EncryptionKey = os.Getenv("ENCRYPTION_KEY")

	DiscordToken = os.Getenv("DISCORD_TOKEN")
	DiscordGuildID = os.Getenv("DISCORD_GUILD_ID")
	DiscordLinkedRoleID = os.Getenv("DISCORD_LINKED_ROLE_ID")
	DiscordPrefix = os.Getenv("DISCORD_PREFIX")
	DiscordClientID = os.Getenv("DISCORD_CLIENT_ID")
	DiscordClientSecret = os.Getenv("DISCORD_CLIENT_SECRET")
	DiscordRedirectURI = os.Getenv("DISCORD_REDIRECT_URI")

	RedisAddr = os.Getenv("REDIS_ADDR")
	RedisPassword = os.Getenv("REDIS_PASSWORD")
	RedisDB = utils.StringToInt(os.Getenv("REDIS_DB"))

	SMTPHost = os.Getenv("SMTP_HOST")
	SMTPPort = os.Getenv("SMTP_PORT")
	SMTPUsername = os.Getenv("SMTP_USERNAME")
	SMTPPassword = os.Getenv("SMTP_PASSWORD")
	SMTPTLSEnabled = os.Getenv("SMTP_TLS_ENABLED") == "true"

	R2URL = os.Getenv("R2_URL")
	R2APIKey = os.Getenv("R2_API_KEY")

	HenrikApiKey = os.Getenv("HENRIK_API_KEY")

	return nil
}
