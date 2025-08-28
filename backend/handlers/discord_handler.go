package handlers

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type DiscordHandler struct {
	DiscordService *services.DiscordService
	UserService    *services.UserService
	SessionService *services.SessionService
}

func NewDiscordHandler(discordService *services.DiscordService, userService *services.UserService) *DiscordHandler {
	return &DiscordHandler{
		DiscordService: discordService,
		UserService:    userService,
		SessionService: &services.SessionService{DB: userService.DB, Client: userService.Client},
	}
}

type LinkDiscordRequest struct {
	DiscordID uint `json:"discord_id"`
}

/* Get OAuth2 URL */
func (dh *DiscordHandler) GetOAuth2URL(w http.ResponseWriter, r *http.Request) {
	login := utils.StringToBool(r.URL.Query().Get("login"))
	authURL := dh.DiscordService.CreateOAuth2URL(login)
	utils.RespondSuccess(w, "OAuth2 URL created", map[string]string{"url": authURL})
}

func (dh *DiscordHandler) OAuth2Login(w http.ResponseWriter, r *http.Request) {
	dh.OAuth2Callback(w, r, true)
}

func (dh *DiscordHandler) OAuth2Link(w http.ResponseWriter, r *http.Request) {
	dh.OAuth2Callback(w, r, false) // This will handle linking, not login
}

/* Callback for Discord OAuth2 */
func (dh *DiscordHandler) OAuth2Callback(w http.ResponseWriter, r *http.Request, login bool) {
	uid := middlewares.GetUserIDFromContext(r.Context())
	code := r.URL.Query().Get("code")

	log.Printf("Discord OAuth2 Callback - Login: %v, UID from context: %d", login, uid)

	if code == "" {
		utils.RespondError(w, http.StatusBadRequest, "Code is required")
		return
	}

	// For linking (not login), we need to get UID from session cookie if not in context
	if !login && uid == 0 {
		log.Printf("No UID in context, checking session cookies...")
		sessionToken := r.Cookies()
		for _, cookie := range sessionToken {
			if cookie.Name == "sessionToken" {
				log.Printf("Found sessionToken cookie")
				// Parse session token to get UID
				claims, err := utils.ValidateToken(cookie.Value, config.SecretKey)
				if err == nil {
					uid = claims.UserID
					log.Printf("Successfully parsed session token, UID: %d", uid)
				} else {
					log.Printf("Failed to parse session token: %v", err)
				}
				break
			}
		}
		
		if uid == 0 {
			log.Printf("No valid session found, redirecting to login")
			// Redirect to login if no valid session
			loginURL := fmt.Sprintf("%s/login?redirect=%s", config.Origin, url.QueryEscape(r.URL.String()))
			http.Redirect(w, r, loginURL, http.StatusSeeOther)
			return
		}
	}

	log.Printf("Final UID for Discord callback: %d", uid)

	discordID, err := dh.DiscordService.HandleOAuth2Callback(uid, code, login)
	if err != nil {
		log.Println("Error handling OAuth2 callback:", err)

		if strings.Contains(err.Error(), "already linked to another") {
			errorURL := fmt.Sprintf("%s/error?message=%s", config.Origin, "This Discord account is already linked to another cutz.lol account.")
			http.Redirect(w, r, errorURL, http.StatusSeeOther)
			return
		}

		utils.RespondError(w, http.StatusInternalServerError, "Failed to handle OAuth2 callback")
		return
	}

	if !login {
		http.Redirect(w, r, config.Origin+"/dashboard/settings?linked=true", http.StatusSeeOther)
		return
	}

	/* Login with Discord */
	user, err := dh.DiscordService.GetUserByDiscordID(discordID)
	if err != nil {
		log.Println("Error getting user by Discord ID:", err)
		errorURL := fmt.Sprintf("%s/error?message=%s", config.Origin, url.QueryEscape("You have not linked your Discord account with your cutz.lol account."))
		http.Redirect(w, r, errorURL, http.StatusSeeOther)
		return
	}

	if user == nil {
		utils.RespondError(w, http.StatusNotFound, "User not found")
		return
	}

	if !user.LoginWithDiscord {
		errorURL := fmt.Sprintf("%s/error?message=%s", config.Origin, url.QueryEscape("Discord login is not enabled for this account."))
		http.Redirect(w, r, errorURL, http.StatusSeeOther)
		return
	}

	token, err := utils.GenerateJWT(user.UID, config.SecretKey, true)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	userAgent := r.Header.Get("User-Agent")
	Country := r.Header.Get("CF-IPCountry")
	ip := utils.ExtractIP(r)
	if err := dh.SessionService.CreateSession(user.UID, token, userAgent, ip, Country); err != nil {
		log.Println("Error creating session:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSessionTokenCookie(w, token, false)
	http.Redirect(w, r, config.Origin+"/dashboard", http.StatusSeeOther)
}

/* Unlink Discord account from user */
func (dh *DiscordHandler) UnlinkDiscordAccount(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	if err := dh.DiscordService.UnlinkDiscordAccount(uid); err != nil {
		log.Println("Error unlinking Discord account:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to unlink Discord account")
		return
	}

	utils.RespondSuccess(w, "Discord account unlinked successfully", nil)
}

/* Discord Presence */
func (dh *DiscordHandler) GetDiscordPresence(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	UID := vars["uid"]

	presence, err := dh.DiscordService.GetDiscordPresence(utils.StringToUint(UID))
	if err != nil {
		log.Println("Error getting Discord presence:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get Discord presence")
		return
	}

	utils.RespondSuccess(w, "Discord presence fetched", presence)
}

/* Get Discord Server */
func (dh *DiscordHandler) GetDiscordServer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	serverInvite := vars["invite"]

	server, err := dh.DiscordService.GetDiscordServer(serverInvite)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to get Discord server")
		return
	}

	utils.RespondSuccess(w, "Discord server fetched", server)
}
