package handlers

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"

	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type MFAHandler struct {
	MFAService     *services.MFAService
	UserService    *services.UserService
	SessionService *services.SessionService
}

func NewMFAHandler(mfaService *services.MFAService, userService *services.UserService) *MFAHandler {
	return &MFAHandler{
		MFAService:     mfaService,
		UserService:    userService,
		SessionService: &services.SessionService{DB: userService.DB, Client: userService.Client},
	}
}

type GenerateMFASecretResponse struct {
	Secret    string `json:"secret"`
	QRCodeURL string `json:"qr_code_url"`
}

/* Generate a new MFA secret */
func (mh *MFAHandler) GenerateMFASecret(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	user, err := mh.UserService.GetUserByUID(uid)
	if err != nil {
		log.Println("Error getting user:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get user")
		return
	}

	secret, qrCodeURL, err := mh.MFAService.GenerateMFASecret(user.Username)
	if err != nil {
		log.Println("Error generating MFA secret:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to generate MFA secret")
		return
	}

	qrCodeImage, err := utils.GenerateQRCodeImage(qrCodeURL)
	if err != nil {
		log.Println("Error generating QR code image:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to generate QR code image")
		return
	}

	qrCodeBase64 := base64.StdEncoding.EncodeToString(qrCodeImage)

	response := GenerateMFASecretResponse{
		Secret:    secret,
		QRCodeURL: "data:image/png;base64," + qrCodeBase64,
	}

	utils.RespondSuccess(w, "MFA secret generated", response)
}

type EnableMFARequest struct {
	Secret string `json:"secret"`
	Code   string `json:"code"`
}

/* Enable MFA for a user */
func (mh *MFAHandler) EnableMFA(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	var enableMFARequest EnableMFARequest
	if err := json.NewDecoder(r.Body).Decode(&enableMFARequest); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := mh.MFAService.EnableMFA(uid, enableMFARequest.Secret, enableMFARequest.Code); err != nil {
		log.Println("Error enabling MFA:", err)
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.RespondSuccess(w, "MFA enabled successfully", nil)
}

/* Disable MFA for a user */
func (mh *MFAHandler) DisableMFA(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	if err := mh.MFAService.DisableMFA(uid); err != nil {
		log.Println("Error disabling MFA:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to disable MFA")
		return
	}

	utils.RespondSuccess(w, "MFA disabled successfully", nil)
}

type VerifyMFARequest struct {
	UID  uint   `json:"uid"`
	Code string `json:"code"`
}

/* Verify MFA code */
func (mh *MFAHandler) VerifyMFA(w http.ResponseWriter, r *http.Request) {
	var verifyMFARequest VerifyMFARequest
	if err := json.NewDecoder(r.Body).Decode(&verifyMFARequest); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := mh.MFAService.VerifyMFA(verifyMFARequest.UID, verifyMFARequest.Code); err != nil {
		if err.Error() == "invalid MFA code" {
			utils.RespondError(w, http.StatusBadRequest, "Invalid MFA code")
			return
		}

		log.Println("Error verifying MFA:", err)
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	sessionToken, err := utils.GenerateJWT(verifyMFARequest.UID, config.SecretKey, true)
	if err != nil {
		log.Println("Error generating token for user:", verifyMFARequest.UID, err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to generate token")
	}

	userAgent := r.Header.Get("User-Agent")
	Country := r.Header.Get("CF-IPCountry")
	ip := utils.ExtractIP(r)
	if err := mh.SessionService.CreateSession(verifyMFARequest.UID, sessionToken, userAgent, ip, Country); err != nil {
		log.Println("Error creating session:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}
	utils.RespondSessionTokenCookie(w, sessionToken, false)
	utils.RespondSuccess(w, "MFA verified successfully", nil)
}
