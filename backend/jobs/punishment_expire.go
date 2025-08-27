package jobs

import (
	"log"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/services"
	"gorm.io/gorm"
)

type PunishmentExpireJob struct {
	DB            *gorm.DB
	Client        *redis.Client
	PunishService *services.PunishService
}

func NewPunishmentExpireJob(db *gorm.DB, client *redis.Client) *PunishmentExpireJob {
	punishService := services.NewPunishService(db, client)

	return &PunishmentExpireJob{
		DB:            db,
		Client:        client,
		PunishService: punishService,
	}
}

func (j *PunishmentExpireJob) Run() {
	log.Println("Running punishment expire job")

	j.checkExpiredPunishments()

	log.Println("Punishment expire job completed")
}

func (j *PunishmentExpireJob) checkExpiredPunishments() {
	log.Println("Checking for expired punishments")

	var activePunishments []struct {
		ID uint
	}

	err := j.DB.Table("punishments").
		Select("id").
		Where("active = ? AND end_date < ?", true, time.Now()).
		Scan(&activePunishments).Error

	if err != nil {
		log.Printf("Error finding expired punishments: %v", err)
		return
	}

	log.Printf("Found %d expired punishments to deactivate", len(activePunishments))

	for _, punishment := range activePunishments {
		if err := j.PunishService.DeactivatePunishment(punishment.ID, 0); err != nil {
			log.Printf("Error deactivating punishment ID %d: %v", punishment.ID, err)
		} else {
			log.Printf("Successfully deactivated expired punishment ID %d", punishment.ID)
		}
	}
}
