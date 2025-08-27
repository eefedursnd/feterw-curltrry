package middlewares

import (
	"net/http"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_payment/config"
)

func CORSMiddleware(router *mux.Router) http.Handler {
	corsHandler := handlers.CORS(
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization", "X-Requested-With"}),
		handlers.AllowedMethods([]string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions}),
		handlers.AllowedOrigins([]string{config.Origin}),
		handlers.AllowCredentials(),
	)

	return corsHandler(router)
}
