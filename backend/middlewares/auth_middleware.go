package middlewares

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
)

type userContextKeyType string

const userContextKey userContextKeyType = "user"

type UserContext struct {
	UserID       uint
	SessionToken string
}

func AuthMiddleware(sessionService *services.SessionService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			sessionCookie, err := r.Cookie("sessionToken")
			if err != nil {
				utils.RespondError(w, http.StatusUnauthorized, "Unauthorized")
				return
			}

			decryptedClaims, err := utils.ValidateToken(sessionCookie.Value, config.SecretKey)
			if err != nil || time.Now().After(time.Unix(decryptedClaims.ExpiresAt, 0)) {
				utils.RespondError(w, http.StatusUnauthorized, "Invalid token")
				return
			}

			session, err := sessionService.GetSession(sessionCookie.Value)
			if err != nil {
				utils.RespondError(w, http.StatusUnauthorized, "Session not found")
				return
			}

			if time.Now().After(session.ExpiresAt) {
				sessionService.DeleteSession(session.UserID, session.SessionToken)
				utils.RespondError(w, http.StatusUnauthorized, "Session expired")
				return
			}

			userCtx := UserContext{
				UserID:       session.UserID,
				SessionToken: session.SessionToken,
			}
			ctx := context.WithValue(r.Context(), userContextKey, userCtx)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func PrettyJSON(v interface{}) string {
	requestMap := map[string]interface{}{
		"method":      v.(*http.Request).Method,
		"url":         v.(*http.Request).URL.String(),
		"headers":     v.(*http.Request).Header,
		"cookies":     v.(*http.Request).Cookies(),
		"remote_addr": v.(*http.Request).RemoteAddr,
	}

	jsonBytes, err := json.MarshalIndent(requestMap, "", "    ")
	if err != nil {
		return fmt.Sprintf("Error formatting JSON: %v", err)
	}
	return string(jsonBytes)
}

func GetUserIDFromContext(ctx context.Context) uint {
	userCtx, ok := ctx.Value(userContextKey).(UserContext)
	if !ok {
		return 0
	}
	return userCtx.UserID
}

func GetSessionTokenFromContext(ctx context.Context) string {
	userCtx, ok := ctx.Value(userContextKey).(UserContext)
	if !ok {
		return ""
	}
	return userCtx.SessionToken
}

func GetUserContextFromContext(ctx context.Context) (UserContext, bool) {
	userCtx, ok := ctx.Value(userContextKey).(UserContext)
	return userCtx, ok
}
