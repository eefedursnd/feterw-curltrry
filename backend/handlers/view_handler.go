package handlers

import (
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type ViewHandler struct {
	ViewService *services.ViewService
}

func NewViewHandler(viewService *services.ViewService) *ViewHandler {
	return &ViewHandler{
		ViewService: viewService,
	}
}

/* Get user views data */
func (vh *ViewHandler) GetUserViewsData(w http.ResponseWriter, r *http.Request) {
	uid := middlewares.GetUserIDFromContext(r.Context())

	viewsData, err := vh.ViewService.GetViewsData(uid)
	if err != nil {
		log.Println("Error getting user views data:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Views data found", viewsData)
}

/* Increment view count */
func (vh *ViewHandler) IncrementViewCount(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	uidStr := vars["uid"]
	uid := utils.StringToUint(uidStr)

	ip := utils.ExtractIP(r)
	userAgent := r.Header.Get("User-Agent")

	if strings.Contains(ip, ":") {
		ipParts := strings.Split(ip, ":")
		if len(ipParts) > 4 {
			ip = strings.Join(ipParts[:4], ":")
		}
	}

	log.Printf("View request: IP=%s, UserAgent=%s", ip, userAgent)

	sessionID := utils.GenerateHash(ip + userAgent)

	headers := make(map[string]string)
	headers["CF-IPCountry"] = r.Header.Get("CF-IPCountry")
	headers["Referer"] = r.Header.Get("Referer")
	headers["User-Agent"] = r.Header.Get("User-Agent")

	err := vh.ViewService.IncrementViewCount(uid, sessionID, headers, ip)
	if err != nil {
		if err.Error() == "rate limit exceeded" {
			log.Printf("Rate limit exceeded for IP: %s", ip)
			utils.RespondError(w, http.StatusTooManyRequests, "Too many requests")
			return
		}

		log.Printf("Error incrementing view count: %v", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "View count incremented", nil)
}
