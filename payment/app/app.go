package app

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_payment/config"
	"github.com/hazebio/haze.bio_payment/middlewares"
	"github.com/hazebio/haze.bio_payment/routes"
)

func StartServer() error {
	r := mux.NewRouter()

	routes.RegisterRoutes(r)

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
