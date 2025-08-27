package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/hazebio/haze.bio_payment/config"
	"github.com/hazebio/haze.bio_payment/models"
)

type HazeService struct {
}

func NewHazeService() *HazeService {
	return &HazeService{}
}

func (e *HazeService) CreateRedeemCode(invoiceId string, product *models.StripeProduct) (string, error) {
	payload, err := json.Marshal(product)
	if err != nil {
		return "", fmt.Errorf("failed to marshal product: %w", err)
	}

	req, err := http.NewRequest("POST", config.BaseURL+"/internal/redeem/"+invoiceId, bytes.NewBuffer(payload))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.SecretKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var response struct {
		Data struct {
			Code string `json:"code"`
		} `json:"data"`
	}

	err = json.NewDecoder(resp.Body).Decode(&response)
	if err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	return response.Data.Code, nil
}

func (e *HazeService) HandlePurchase(userID uint, productName string) error {
	payload := struct {
		UserID      uint   `json:"user_id"`
		ProductName string `json:"product_name"`
	}{
		UserID:      userID,
		ProductName: productName,
	}

	requestData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal purchase request: %w", err)
	}

	req, err := http.NewRequest("POST", config.BaseURL+"/internal/purchase", bytes.NewBuffer(requestData))
	if err != nil {
		return fmt.Errorf("failed to create purchase request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+config.SecretKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send purchase request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code from purchase API: %d", resp.StatusCode)
	}

	return nil
}

func (e *HazeService) CreatePayPalChargebackPunishment(userID uint) error {
	req, err := http.NewRequest("POST", config.BaseURL+"/internal/punish/paypal_chargeback/"+strconv.FormatUint(uint64(userID), 10), nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+config.SecretKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}
