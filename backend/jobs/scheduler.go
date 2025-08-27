package jobs

import (
	"log"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/services"
	"gorm.io/gorm"
)

type Scheduler struct {
	DB                  *gorm.DB
	Client              *redis.Client
	UserService         *services.UserService
	ProfileService      *services.ProfileService
	BadgeService        *services.BadgeService
	PunishService       *services.PunishService
}

func NewScheduler(db *gorm.DB, client *redis.Client) *Scheduler {
	userService := &services.UserService{DB: db, Client: client}
	badgeService := &services.BadgeService{DB: db, Client: client}
	profileService := &services.ProfileService{
		DB:          db,
		Client:      client,
		UserService: userService,
	}

	punishService := services.NewPunishService(db, client)

	return &Scheduler{
		DB:                  db,
		Client:              client,
		UserService:         userService,
		ProfileService:      profileService,
		BadgeService:        badgeService,

		PunishService:       punishService,
	}
}

func (s *Scheduler) Start() {


	go s.scheduleJob(15*time.Minute, func() {
		job := &PunishmentExpireJob{
			DB:            s.DB,
			Client:        s.Client,
			PunishService: s.PunishService,
		}
		job.Run()
	})

	go s.scheduleJob(1*time.Hour, func() {
		// job := &PremiumExpireJob{
		// 	DB:             s.DB,
		// 	Client:         s.Client,
		// 	UserService:    s.UserService,
		// 	ProfileService: s.ProfileService,
		// 	BadgeService:   s.BadgeService,
		// }
		// job.Run()
	})

	log.Println("Job scheduler started")
}

func (s *Scheduler) scheduleJob(interval time.Duration, jobFunc func()) {
	for {
		jobFunc()
		time.Sleep(interval)
	}
}

func (s *Scheduler) RunOnce() {


	job2 := &PunishmentExpireJob{
		DB:            s.DB,
		Client:        s.Client,
		PunishService: s.PunishService,
	}
	job2.Run()

	// job3 := &PremiumExpireJob{
	// 	DB:             s.DB,
	// 	Client:         s.Client,
	// 	UserService:    s.UserService,
	// 	ProfileService: s.ProfileService,
	// 	BadgeService:   s.BadgeService,
	// }
	// job3.Run()

	log.Println("All jobs executed once")
}
