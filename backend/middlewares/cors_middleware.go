package middlewares

import (
	"log"
	"net/http"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/config"
)

func CORSMiddleware(router *mux.Router) http.Handler {
	corsHandler := handlers.CORS(
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization", "X-Requested-With"}),
		handlers.AllowedMethods([]string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions}),
		handlers.AllowedOrigins(config.Origins),
		handlers.AllowCredentials(),
	)

	log.Println("Allowed Origins:", config.Origins)

	return corsHandler(router)
}
