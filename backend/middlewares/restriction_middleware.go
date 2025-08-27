package middlewares

import (
	"net/http"

	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

func RestrictionMiddleware(userService *services.UserService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			uid := GetUserIDFromContext(r.Context())

			user, err := userService.GetUserByUID(uid)
			if err != nil {
				utils.RespondError(w, http.StatusInternalServerError, "Failed to retrieve user information")
				return
			}

			hasPartialRestriction := false
			if user.Punishments != nil {
				for _, punishment := range *user.Punishments {
					if punishment.Active && punishment.PunishmentType == "partial" {
						hasPartialRestriction = true
						break
					}
				}
			}

			if hasPartialRestriction {
				utils.RespondError(w, http.StatusForbidden, "Your account has a partial restriction and cannot perform this action")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
