package routes

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_payment/handlers"
	"github.com/hazebio/haze.bio_payment/services"
)

func RegisterRoutes(router *mux.Router) {
	/* Initialize handlers */
	mailService := services.NewMailService()
	hazeService := services.NewHazeService()
	stripeHandler := handlers.NewStripeHandler(mailService, hazeService)

	/* Public routes (do not require authentication) */
	apiRoutes := router.PathPrefix("/api").Subrouter()
	apiRoutes.HandleFunc("/stripe/webhook", stripeHandler.HandleDynamicDelivery).Methods("POST")
	apiRoutes.HandleFunc("/stripe/checkout", stripeHandler.CreateCheckoutURL).Methods("POST")

	apiRoutes.HandleFunc("/debug/body", func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Could not read request body", http.StatusInternalServerError)
			return
		}
		defer r.Body.Close()

		log.Println("Received body:", string(body))

		var prettyJSON bytes.Buffer
		if err := json.Indent(&prettyJSON, body, "", "  "); err == nil {
			log.Println("Formatted JSON:", prettyJSON.String())
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Body received"))
	}).Methods("POST")
}
