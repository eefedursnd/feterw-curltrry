package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"

	"github.com/hazebio/haze.bio_payment/config"
	"github.com/hazebio/haze.bio_payment/models"
	"github.com/hazebio/haze.bio_payment/services"
	"github.com/stripe/stripe-go/v72"
	"github.com/stripe/stripe-go/v72/checkout/session"
	"github.com/stripe/stripe-go/v72/webhook"
)

type StripeHandler struct {
	Mail *services.MailService
	Haze *services.HazeService
}

func NewStripeHandler(mail *services.MailService, haze *services.HazeService) *StripeHandler {
	return &StripeHandler{
		Mail: mail,
		Haze: haze,
	}
}

type StripeSessionCompletedPayload struct {
	ID              string `json:"id"`
	Created         int    `json:"created"`
	CustomerDetails struct {
		Email string `json:"email"`
	} `json:"customer_details"`
	Discounts []interface{} `json:"discounts"`
	Invoice   interface{}   `json:"invoice"`
	Metadata  struct {
		ProductName string `json:"product_name"`
		UserID      string `json:"user_id,omitempty"`
	} `json:"metadata"`
	Mode          string `json:"mode"`
	PaymentStatus string `json:"payment_status"`
}

func (sh *StripeHandler) HandleDynamicDelivery(w http.ResponseWriter, r *http.Request) {
	log.Println("----------------------------------------")
	log.Println("STRIPE WEBHOOK RECEIVED")

	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Println("ERROR: Failed to read request body:", err)
		log.Println("----------------------------------------")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	event, err := webhook.ConstructEvent(body, r.Header.Get("Stripe-Signature"), config.StripeWebhookSecret)
	if err != nil {
		log.Printf("ERROR: Verifying webhook signature: %v\n", err)
		http.Error(w, "Invalid signature", http.StatusBadRequest)
		return
	}

	if event.Type != "checkout.session.completed" {
		log.Printf("IGNORING: Unsupported event type: %s", event.Type)
		w.WriteHeader(http.StatusOK)
		return
	}

	var payload StripeSessionCompletedPayload
	if err := json.Unmarshal(event.Data.Raw, &payload); err != nil {
		log.Println("ERROR: Failed to parse payload:", err)
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	email := payload.CustomerDetails.Email
	sessionID := payload.ID
	status := payload.PaymentStatus

	var productName string
	if payload.Metadata.ProductName != "" {
		productName = payload.Metadata.ProductName
		log.Printf("Product from Metadata: %s", productName)
	}

	if productName == "" {
		log.Printf("ERROR: No product found for session %s", sessionID)
		http.Error(w, "No product found", http.StatusBadRequest)
		return
	}

	log.Printf("ProductName: %s", productName)

	product, ok := models.StripeProducts[productName]
	if !ok {
		log.Printf("ERROR: Unknown product: %s", productName)
		http.Error(w, "Unknown product", http.StatusBadRequest)
		return
	}

	var userID uint
	if payload.Metadata.UserID != "" {
		parsedID, err := strconv.ParseUint(payload.Metadata.UserID, 10, 32)
		if err != nil {
			log.Printf("ERROR: Invalid user_id in metadata: %s", payload.Metadata.UserID)
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}
		userID = uint(parsedID)
		log.Printf("Found user_id in metadata: %d", userID)
	} else {
		log.Printf("ERROR: No user_id in metadata for session %s", sessionID)
		http.Error(w, "No user ID provided", http.StatusBadRequest)
		return
	}

	switch status {
	case "paid":
		log.Printf("SUCCESSFUL PAYMENT for session %s by %s", sessionID, email)

		var invoiceID string
		if inv, ok := payload.Invoice.(string); ok {
			invoiceID = inv
		} else {
			invoiceID = "no-invoice"
		}

		log.Printf("INFO: Product purchase for %s: %s (User ID: %d)",
			email, product.ProductName, userID)
		log.Printf("INFO: Invoice ID: %s", invoiceID)

		err := sh.Haze.HandlePurchase(userID, productName)
		if err != nil {
			log.Printf("ERROR: Failed to process purchase: %v", err)
			http.Error(w, "Failed to process purchase", http.StatusInternalServerError)
			return
		}

		log.Printf("SUCCESS: Purchase processed successfully for user ID: %d", userID)

	case "refunded":
		log.Printf("INFO: Session %s was REFUNDED for customer %s", sessionID, email)

		log.Printf("WARNING: Applying chargeback punishment for user ID: %d", userID)

		err := sh.Haze.CreatePayPalChargebackPunishment(userID)
		if err != nil {
			log.Printf("ERROR: Failed to apply chargeback punishment: %v", err)
		} else {
			log.Printf("SUCCESS: Chargeback punishment applied for user ID: %d", userID)
		}

	default:
		log.Printf("IGNORED: Unsupported payment status: %s", status)
	}

	log.Println("----------------------------------------")
	w.WriteHeader(http.StatusOK)
}

func (sh *StripeHandler) CreateCheckoutURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		ProductName   string `json:"product_name"`
		CustomerEmail string `json:"customer_email,omitempty"`
		UserID        uint   `json:"user_id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		log.Printf("ERROR: Invalid request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	product, ok := models.StripeProducts[request.ProductName]
	if !ok {
		http.Error(w, "Unknown product", http.StatusBadRequest)
		return
	}

	successURL := "https://haze.bio/dashboard/"
	cancelURL := "https://haze.bio/error?message=Your payment was cancelled. Try again or contact support."

	stripe.Key = config.StripeSecretKey

	metadata := map[string]string{
		"product_name": request.ProductName,
	}

	if request.UserID > 0 {
		metadata["user_id"] = fmt.Sprintf("%d", request.UserID)
	}

	checkoutParams := &stripe.CheckoutSessionParams{
		SuccessURL: stripe.String(successURL),
		CancelURL:  stripe.String(cancelURL),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(product.PriceID),
				Quantity: stripe.Int64(1),
			},
		},
		Mode:                stripe.String(string(stripe.CheckoutSessionModePayment)),
		AllowPromotionCodes: stripe.Bool(true),
	}

	checkoutParams.Metadata = metadata

	if request.CustomerEmail != "" {
		checkoutParams.CustomerEmail = stripe.String(request.CustomerEmail)
	}

	result, err := session.New(checkoutParams)
	if err != nil {
		log.Printf("ERROR: Failed to create checkout session: %v", err)
		http.Error(w, "Failed to create checkout session", http.StatusInternalServerError)
		return
	}

	response := struct {
		URL       string `json:"url"`
		SessionID string `json:"session_id"`
	}{
		URL:       result.URL,
		SessionID: result.ID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
