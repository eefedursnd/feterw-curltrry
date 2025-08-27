package handlers

import (
	"log"
	"net/http"

	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type PublicHandler struct {
	PublicService *services.PublicService
}

func NewPublicHandler(publicService *services.PublicService) *PublicHandler {
	return &PublicHandler{
		PublicService: publicService,
	}
}

/* Get Marquee Users */
func (ph *PublicHandler) GetMarqueeUsers(w http.ResponseWriter, r *http.Request) {
	marqueeUsers, err := ph.PublicService.GetMarqueeUsers()
	if err != nil {
		log.Println("Error getting marquee users:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Marquee users found", marqueeUsers)
}

/* Get Leaderboard Users by Views */
func (ph *PublicHandler) GetLeaderboardUsersByViews(w http.ResponseWriter, r *http.Request) {
	leaderboardUsers, err := ph.PublicService.GetLeaderboardUsers(services.SortByViews)
	if err != nil {
		log.Println("Error getting leaderboard users by views:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Leaderboard users (views) found", leaderboardUsers)
}

/* Get Leaderboard Users by Badges */
func (ph *PublicHandler) GetLeaderboardUsersByBadges(w http.ResponseWriter, r *http.Request) {
	leaderboardUsers, err := ph.PublicService.GetLeaderboardUsers(services.SortByBadges)
	if err != nil {
		log.Println("Error getting leaderboard users by badges:", err)
		utils.RespondError(w, http.StatusInternalServerError, "Something went wrong. Please try again later")
		return
	}

	utils.RespondSuccess(w, "Leaderboard users (badges) found", leaderboardUsers)
}
