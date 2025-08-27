package app

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-redis/redis"
	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/db"
	"github.com/hazebio/haze.bio_backend/discord"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/routes"
)

func StartServer(redisClient *redis.Client, bot *discord.Bot) error {
	r := mux.NewRouter()

	r.Use(middlewares.LogMiddleware)

	routes.RegisterRoutes(r, db.DB, redisClient, bot)

	log.Println("Server started on port:", config.HttpPort)
	log.Println("Environment:", config.Environment)

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", config.HttpPort),
		Handler:      middlewares.CORSMiddleware(r),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 120 * time.Second,
	}

	return server.ListenAndServe()
}
