package models

import "errors"

type StripeProduct struct {
	ProductName string `json:"product_name"`
	PriceID     string `json:"price_id"`
}

var StripeProducts = map[string]StripeProduct{
	"Premium Upgrade": {
		ProductName: "Premium Upgrade",
		PriceID:     "price_123",
	},
	"Custom Badge Fee": {
		ProductName: "Custom Badge Fee",
		PriceID:     "price_123",
	},
}

func GetProductByName(name string) (*StripeProduct, error) {
	product, ok := StripeProducts[name]
	if !ok {
		return nil, errors.New("product not found")
	}
	return &product, nil
}
