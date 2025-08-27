package handlers

import (
	"io"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type ImageHandler struct {
	ImageService    *services.ImageService
	UserService     *services.UserService
	ProfileService  *services.ProfileService
	TemplateService *services.TemplateService
}

func NewImageHandler(imageService *services.ImageService, userService *services.UserService, profileService *services.ProfileService, templateService *services.TemplateService) *ImageHandler {
	return &ImageHandler{
		ImageService:    imageService,
		UserService:     userService,
		ProfileService:  profileService,
		TemplateService: templateService,
	}
}

func (ih *ImageHandler) GenerateUserCard(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	identifier := vars["identifier"]

	user, err := ih.ProfileService.GetPublicProfileByUID(utils.StringToUint(identifier))
	if err != nil {
		log.Println("Error getting user profile:", err)
		utils.RespondError(w, http.StatusNotFound, "User not found")
		return
	}

	imagePath, err := ih.ImageService.GenerateUserCard(user, user.Profile)
	if err != nil {
		log.Printf("Error generating user card: %v", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to generate image")
		return
	}
	defer os.Remove(imagePath)

	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Content-Disposition", "inline; filename=\""+user.Username+"-c2ard.png\"")

	imgFile, err := os.Open(imagePath)
	if err != nil {
		log.Printf("Error opening image file: %v", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to read image")
		return
	}
	defer imgFile.Close()

	_, err = io.Copy(w, imgFile)
	if err != nil {
		log.Printf("Error sending image: %v", err)
		return
	}
}
