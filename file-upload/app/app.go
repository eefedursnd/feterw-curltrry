package app

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_file-upload/config"
	"github.com/hazebio/haze.bio_file-upload/middlewares"
	"github.com/hazebio/haze.bio_file-upload/routes"
	"github.com/hazebio/haze.bio_file-upload/services"
)

func StartServer() error {
	r2Service, err := services.NewR2Service()
	if err != nil {
		return fmt.Errorf("failed to initialize R2 service: %w", err)
	}

	startCleanupTask(r2Service)

	r := mux.NewRouter()
	routes.RegisterRoutes(r, r2Service)

	log.Println("Server started on port:", config.HttpPort)
	log.Println("Environment:", config.Environment)
	log.Println("R2 Bucket:", config.R2BucketName)
	log.Println("R2 Region:", config.R2Region)

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", config.HttpPort),
		Handler:      middlewares.CORSMiddleware(r),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 120 * time.Second,
	}

	return server.ListenAndServe()
}

func startCleanupTask(r2Service *services.R2Service) {
	go func() {
		log.Println("Running initial cleanup of expired files...")
		if err := r2Service.CleanupExpiredFiles(); err != nil {
			log.Printf("Error during initial cleanup of expired files: %v", err)
		}
	}()

	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()
	go func() {
		for range ticker.C {
			log.Println("Running scheduled cleanup of expired files...")
			if err := r2Service.CleanupExpiredFiles(); err != nil {
				log.Printf("Error cleaning up expired files: %v", err)
			} else {
				log.Println("Completed expired files cleanup")
			}
		}
	}()

	log.Println("Scheduled cleanup task for expired files started (runs hourly)")
}
