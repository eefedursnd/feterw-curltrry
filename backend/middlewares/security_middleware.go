package middlewares

import (
	"log"
	"net/http"
	"strings"

	"github.com/hazebio/haze.bio_backend/utils"
)

func SecurityMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		
		// Block access to sensitive files
		sensitivePatterns := []string{
			".git",
			".env",
			"config",
			"wp-config",
			"composer.json",
			"package.json",
			"yarn.lock",
			"package-lock.json",
			"go.mod",
			"go.sum",
			".htaccess",
			"web.config",
		}
		
		for _, pattern := range sensitivePatterns {
			if strings.Contains(strings.ToLower(path), strings.ToLower(pattern)) {
				log.Printf("SECURITY: Blocked access to sensitive file: %s from IP: %s", path, utils.ExtractIP(r))
				utils.RespondError(w, http.StatusForbidden, "Access Denied")
				return
			}
		}
		
		// Block suspicious user agents
		userAgent := r.Header.Get("User-Agent")
		suspiciousAgents := []string{
			"sqlmap",
			"nikto",
			"nmap",
			"dirb",
			"gobuster",
			"wfuzz",
			"burp",
			"zap",
		}
		
		for _, agent := range suspiciousAgents {
			if strings.Contains(strings.ToLower(userAgent), strings.ToLower(agent)) {
				log.Printf("SECURITY: Blocked suspicious user agent: %s from IP: %s", userAgent, utils.ExtractIP(r))
				utils.RespondError(w, http.StatusForbidden, "Access Denied")
				return
			}
		}
		
		next.ServeHTTP(w, r)
	})
}
