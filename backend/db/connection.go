package db

import (
	"log"

	"github.com/hazebio/haze.bio_backend/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init() error {
	var err error
	DB, err = gorm.Open(postgres.Open(config.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent), //default: silent
	})
	if err != nil {
		return err
	}

	log.Println("Connected to database")
	return nil
}
