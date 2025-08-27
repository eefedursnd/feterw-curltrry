package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_file-upload/handlers"
	"github.com/hazebio/haze.bio_file-upload/services"
	"github.com/hazebio/haze.bio_file-upload/utils"
)

func RegisterRoutes(router *mux.Router, r2Service *services.R2Service) {
	fileHandler := handlers.NewFileHandler(r2Service)

	apiRouter := router.PathPrefix("/api").Subrouter()

	apiRouter.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		utils.RespondSuccess(w, "Service is healthy", nil)
	}).Methods("GET")

	fileRouter := router.NewRoute().Subrouter()
	fileRouter.HandleFunc("/{key:.*}", fileHandler.HandleFileOperations).Methods("PUT", "DELETE")
}
