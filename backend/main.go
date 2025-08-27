package main

import (
	"fmt"
	"log"

	"github.com/hazebio/haze.bio_backend/app"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/db"
	"github.com/hazebio/haze.bio_backend/discord"
	"github.com/hazebio/haze.bio_backend/jobs"
	"github.com/hazebio/haze.bio_backend/redis"
)

func main() {
	if err := config.LoadConfig(); err != nil {
		fmt.Println(err)
		return
	}

	if err := db.Init(); err != nil {
		fmt.Println(err)
		return
	}

	if err := db.StartMigration(db.DB); err != nil {
		fmt.Println(err)
		return
	}

	redisClient, err := redis.Init()
	if err != nil {
		fmt.Println(err)
		return
	}

	jobScheduler := jobs.NewScheduler(db.DB, redisClient)
	go jobScheduler.Start()
	log.Println("Job scheduler initialized")

	discordBot, err := discord.NewBot(redisClient)
	if err != nil {
		fmt.Println(err)
		return
	}
	discordBot.Start()

	if err := app.StartServer(redisClient, discordBot); err != nil {
		fmt.Println(err)
		return
	}
}
