package middlewares

import (
	"net/http"

	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

func StaffMiddleware(userService *services.UserService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			uid := GetUserIDFromContext(r.Context())

			user, err := userService.GetUserByUID(uid)
			if err != nil {
				utils.RespondError(w, http.StatusInternalServerError, "Failed to retrieve user information")
				return
			}

			if !utils.HasStaffPermission(user) {
				utils.RespondError(w, http.StatusForbidden, "You do not have staff permission")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func ModeratorMiddleware(userService *services.UserService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			uid := GetUserIDFromContext(r.Context())

			user, err := userService.GetUserByUID(uid)
			if err != nil {
				utils.RespondError(w, http.StatusInternalServerError, "Failed to retrieve user information")
				return
			}

			if !utils.HasModeratorPermission(user) {
				utils.RespondError(w, http.StatusForbidden, "You do not have moderator permission")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
