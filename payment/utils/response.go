package utils

import (
	"encoding/json"
	"net/http"
	"os"
	"time"
)

type ApiResponse struct {
	Status  string      `json:"status"`
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

const (
	StatusSuccess = "success"
	StatusError   = "error"
)

func RespondSuccess(w http.ResponseWriter, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	apiResponse := ApiResponse{
		Status:  StatusSuccess,
		Code:    http.StatusOK,
		Message: message,
		Data:    data,
	}
	json.NewEncoder(w).Encode(apiResponse)
}

func RespondError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)

	apiResponse := ApiResponse{
		Status:  StatusError,
		Code:    code,
		Message: message,
		Data:    nil,
	}
	json.NewEncoder(w).Encode(apiResponse)
}

func RespondSessionTokenCookie(w http.ResponseWriter, sessionToken string, expire bool) {
	expires := time.Now().Add(24 * time.Hour)
	if expire {
		expires = time.Now().Add(-24 * time.Hour)
	}

	cookie := &http.Cookie{
		Name:     "sessionToken",
		Value:    sessionToken,
		Path:     "/",
		Domain:   os.Getenv("COOKIE_DOMAIN"),
		HttpOnly: true,
		Secure:   os.Getenv("ENVIRONMENT") == "production",
		Expires:  expires,
	}
	if os.Getenv("ENVIRONMENT") == "development" {
		cookie.SameSite = http.SameSiteLaxMode
	} else {
		cookie.SameSite = http.SameSiteNoneMode
	}

	http.SetCookie(w, cookie)
}
