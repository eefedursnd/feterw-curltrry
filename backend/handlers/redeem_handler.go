package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/models"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type RedeemHandler struct {
	RedeemService *services.RedeemService
	UserService   *services.UserService
}

func NewRedeemHandler(redeemService *services.RedeemService, userService *services.UserService) *RedeemHandler {
	return &RedeemHandler{
		RedeemService: redeemService,
		UserService:   userService,
	}
}

/* Create a new redeem code */
func (rh *RedeemHandler) CreateRedeemCode(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("Authorization") != "Bearer "+config.APIKey {
		utils.RespondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var productData models.StripeProduct
	if err := json.NewDecoder(r.Body).Decode(&productData); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	code, err := rh.RedeemService.CreateRedeemCode(productData)
	if err != nil {
		log.Println("Error creating redeem code:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Redeem code created", map[string]string{"code": code})
}

/* Process a direct purchase without gifting */
func (rh *RedeemHandler) HandlePurchase(w http.ResponseWriter, r *http.Request) {
	var request struct {
		UserID      uint   `json:"user_id"`
		ProductName string `json:"product_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if request.ProductName == "" {
		utils.RespondError(w, http.StatusBadRequest, "Product name is required")
		return
	}

	productData := models.StripeProduct{
		ProductName: request.ProductName,
	}

	err := rh.RedeemService.HandlePurchase(request.UserID, productData)
	if err != nil {
		log.Printf("Error processing purchase: %v", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to process purchase")
		return
	}

	response := map[string]interface{}{
		"product": request.ProductName,
		"success": true,
	}

	utils.RespondSuccess(w, "Purchase processed successfully", response)
}

/* Redeem a code */
func (rh *RedeemHandler) RedeemCode(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	code := vars["code"]

	if code == "" {
		utils.RespondError(w, http.StatusBadRequest, "Invalid code")
		return
	}

	uid := middlewares.GetUserIDFromContext(r.Context())
	productName, err := rh.RedeemService.RedeemCode(uid, code)
	if err != nil {
		log.Println("Error redeeming code:", err)
		utils.RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondSuccess(w, "Code redeemed successfully", map[string]interface{}{
		"product": productName,
	})
}
