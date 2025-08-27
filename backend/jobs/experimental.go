package jobs

import (
	"log"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/services"
	"gorm.io/gorm"
)

type ExperimentProcessJob struct {
	DB                  *gorm.DB
	Client              *redis.Client
	ExperimentalService *services.ExperimentalService
}

func NewExperimentProcessJob(db *gorm.DB, client *redis.Client) *ExperimentProcessJob {
	return &ExperimentProcessJob{
		DB:                  db,
		Client:              client,
		ExperimentalService: services.NewExperimentalService(db, client),
	}
}

func (j *ExperimentProcessJob) Run() {
	log.Println("Running experiment process job")

	err := j.ExperimentalService.ProcessExperiments()
	if err != nil {
		log.Printf("Error processing experiments: %v", err)
		return
	}

	log.Println("Experiment process job completed successfully")
}
