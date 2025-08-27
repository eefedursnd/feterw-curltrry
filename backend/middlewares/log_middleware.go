package middlewares

import (
	"net/http"
	"time"

	"github.com/hazebio/haze.bio_backend/utils"
)

func LogMiddleware(next http.Handler) http.Handler {
	logger := utils.NewLogger()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		ww := &responseWriter{ResponseWriter: w}
		logger.LogRequest(r)

		next.ServeHTTP(ww, r)

		duration := time.Since(start)
		logger.LogResponse(ww.statusCode, duration)
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(statusCode int) {
	rw.statusCode = statusCode
	rw.ResponseWriter.WriteHeader(statusCode)
}
