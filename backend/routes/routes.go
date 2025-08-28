package routes

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-redis/redis"
	"github.com/gorilla/mux"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/discord"
	"github.com/hazebio/haze.bio_backend/handlers"
	"github.com/hazebio/haze.bio_backend/middlewares"
	"github.com/hazebio/haze.bio_backend/services"
	"github.com/hazebio/haze.bio_backend/utils"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"gorm.io/gorm"
)

func RegisterRoutes(router *mux.Router, db *gorm.DB, redisClient *redis.Client, bot *discord.Bot) {
	eventService := services.NewEventService(db, redisClient, bot.Session)

	userService := services.NewUserService(db, redisClient, bot.Session)
	userService.EventService = eventService

	emailService := services.NewEmailService(db, redisClient, eventService)
	emailService.UserService = userService

	altAccountService := services.NewAltAccountService(db, redisClient, eventService)

	userService.EmailService = emailService
	userService.AltAccountService = altAccountService
	emailService.AltAccountService = altAccountService

	emailHandler := handlers.NewEmailHandler(emailService)
	userHandler := handlers.NewUserHandler(userService, emailService)
	discordService := services.NewDiscordService(db, redisClient, userService, bot.Session)
	discordHandler := handlers.NewDiscordHandler(discordService, userService)
	profileService := services.NewProfileService(db, redisClient, bot.Session, discordService)
	profileHandler := handlers.NewProfileHandler(profileService)
	socialService := services.NewSocialService(db, redisClient)
	socialHandler := handlers.NewSocialHandler(socialService)
	mfaService := services.NewMFAService(db, redisClient, userService)
	mfaHandler := handlers.NewMFAHandler(mfaService, userService)
	widgetService := services.NewWidgetService(db, redisClient)
	widgetHandler := handlers.NewWidgetHandler(widgetService)
	badgeService := services.NewBadgeService(db, redisClient)
	badgeHandler := handlers.NewBadgeHandler(badgeService)
	fileService := services.NewFileService(db, redisClient)
	fileHandler := handlers.NewFileHandler(fileService)
	analyticsService := services.NewAnalyticsService(db, redisClient)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)
	viewService := services.NewViewService(db, redisClient, profileService, analyticsService)
	viewHandler := handlers.NewViewHandler(viewService)
	redeemService := services.NewRedeemService(db, redisClient)
	redeemHandler := handlers.NewRedeemHandler(redeemService, userService)
	punishService := services.NewPunishService(db, redisClient)
	punishHandler := handlers.NewPunishHandler(punishService, redeemService)
	sessionService := services.NewSessionService(db, redisClient)
	sessionHandler := handlers.NewSessionHandler(sessionService)
	publicService := services.NewPublicService(db, redisClient)
	publicHandler := handlers.NewPublicHandler(publicService)
	statusService := services.NewStatusService(db)
	statusHandler := handlers.NewStatusHandler(statusService)
	passwordService := services.NewPasswordService(db, redisClient, userService, emailService)
	passwordHandler := handlers.NewPasswordHandler(passwordService, userService, emailService)
	templateService := services.NewTemplateService(db, redisClient)
	templateHandler := handlers.NewTemplateHandler(templateService)
	imageService := services.NewImageService()
	imageHandler := handlers.NewImageHandler(imageService, userService, profileService, templateService)
	applyService := services.NewApplyService(db, redisClient, emailService, userService)
	applyHandler := handlers.NewApplyHandler(applyService, userService)

	dataExportService := services.NewDataExportService(db, redisClient)
	dataExportHandler := handlers.NewDataExportHandler(dataExportService)

	shutdownstatsservice := services.NewShutdownStatsService(db, redisClient)
	stats, _ := shutdownstatsservice.GenerateShutdownStats()

	prettyJsonStats, _ := json.MarshalIndent(stats, "", "  ")
	log.Println("Shutdown stats", string(prettyJsonStats))



	/* Public routes (do not require authentication) */
	apiRoutes := router.PathPrefix("/api").Subrouter()
	apiRoutes.HandleFunc("/register", userHandler.Register).Methods("POST")
	apiRoutes.HandleFunc("/login", userHandler.Login).Methods("POST")
	apiRoutes.HandleFunc("/mfa/verify", mfaHandler.VerifyMFA).Methods("POST")
	apiRoutes.HandleFunc("/discord/oauth2", discordHandler.GetOAuth2URL).Methods("GET")
	apiRoutes.HandleFunc("/discord/oauth2/login", discordHandler.OAuth2Login).Methods("GET")
	apiRoutes.HandleFunc("/discord/presence/{uid}", discordHandler.GetDiscordPresence).Methods("GET")
	apiRoutes.HandleFunc("/discord/server/{invite}", discordHandler.GetDiscordServer).Methods("GET")
	apiRoutes.HandleFunc("/widget/github/{username}", widgetHandler.GetGitHubRepos).Methods("GET")
	apiRoutes.HandleFunc("/widget/valorant/{name}/{tag}", widgetHandler.GetValorantData).Methods("GET")
	apiRoutes.HandleFunc("/views/{uid}/increment", viewHandler.IncrementViewCount).Methods("POST")
	apiRoutes.HandleFunc("/profile/{identifier}", profileHandler.GetPublicProfile).Methods("GET")
	apiRoutes.HandleFunc("/marquee_users", publicHandler.GetMarqueeUsers).Methods("GET")
	apiRoutes.HandleFunc("/leaderboard/views", publicHandler.GetLeaderboardUsersByViews).Methods("GET")
	apiRoutes.HandleFunc("/leaderboard/badges", publicHandler.GetLeaderboardUsersByBadges).Methods("GET")
	apiRoutes.HandleFunc("/stats", userHandler.GetStats).Methods("GET")
	apiRoutes.HandleFunc("/status", statusHandler.GetActiveStatus).Methods("GET")
	apiRoutes.HandleFunc("/status/upcoming", statusHandler.GetUpcomingStatus).Methods("GET")
	apiRoutes.HandleFunc("/password/request-reset", passwordHandler.RequestPasswordReset).Methods("POST")
	apiRoutes.HandleFunc("/password/verify-token", passwordHandler.VerifyResetToken).Methods("GET")
	apiRoutes.HandleFunc("/password/reset", passwordHandler.ResetPassword).Methods("POST")
	apiRoutes.HandleFunc("/email/verify-registration", emailHandler.VerifyRegistration).Methods("GET")
	apiRoutes.HandleFunc("/email/complete-registration", emailHandler.CompleteRegistration).Methods("POST")
	apiRoutes.HandleFunc("/templates/shareable", templateHandler.GetShareableTemplates).Methods("GET")
	apiRoutes.HandleFunc("/templates/stats", templateHandler.GetTemplateStats).Methods("GET")
	apiRoutes.HandleFunc("/analytics/social-click", analyticsHandler.TrackSocialClick).Methods("POST")
	apiRoutes.HandleFunc("/images/user/{identifier}", imageHandler.GenerateUserCard).Methods("GET")
	//apiRoutes.HandleFunc("/images/template/{templateID}", imageHandler.GenerateTemplateCard).Methods("GET")
	apiRoutes.HandleFunc("/applications/positions", applyHandler.GetActivePositions).Methods("GET")
	apiRoutes.HandleFunc("/applications/positions/{id}", applyHandler.GetPositionByID).Methods("GET")

	apiRoutes.HandleFunc("/data-export/{exportID}/download", dataExportHandler.DownloadExport).Methods("POST")

	apiRoutes.HandleFunc("/shutdown-stats", func(w http.ResponseWriter, r *http.Request) {
		stats, err := shutdownstatsservice.GetOrGenerateShutdownStats()
		if err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Failed to generate shutdown stats")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stats)
	}).Methods("GET")

	apiRoutes.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		secretToken := r.URL.Query().Get("token")
		if secretToken != config.APIKey {
			utils.RespondError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		promhttp.Handler().ServeHTTP(w, r)
	}).Methods("GET")

	/* Internal routes (require internal authentication) */
	apiRoutes.HandleFunc("/internal/redeem/{invoice_id}", redeemHandler.CreateRedeemCode).Methods("POST")
	apiRoutes.HandleFunc("/internal/purchase", redeemHandler.HandlePurchase).Methods("POST")
	apiRoutes.HandleFunc("/internal/punish/paypal_chargeback/{user_id}", punishHandler.CreatePayPalChargebackPunishment).Methods("POST")

	/* Private routes (require authentication) */
	privateRoutes := apiRoutes.NewRoute().Subrouter()
	authMiddleware := middlewares.AuthMiddleware(sessionService)
	privateRoutes.Use(authMiddleware)
	privateRoutes.HandleFunc("/user", userHandler.UpdateUser).Methods("PUT")
	privateRoutes.HandleFunc("/logout", userHandler.Logout).Methods("POST")
	privateRoutes.HandleFunc("/@me", userHandler.GetCurrentUser).Methods("GET")
	privateRoutes.HandleFunc("/password", userHandler.UpdatePassword).Methods("PUT")
	privateRoutes.HandleFunc("/me/delete", userHandler.DeleteAccount).Methods("POST")

	/* Routes that should be blocked for partial restrictions */
	restrictedRoutes := privateRoutes.NewRoute().Subrouter()
	restrictionMiddleware := middlewares.RestrictionMiddleware(userService)
	restrictedRoutes.Use(restrictionMiddleware)

	/* Profile Routes */
	restrictedRoutes.HandleFunc("/profile", profileHandler.UpdateUserProfile).Methods("PUT")

	/* Data Export Routes */
	privateRoutes.HandleFunc("/data-export/request", dataExportHandler.RequestDataExport).Methods("POST")
	privateRoutes.HandleFunc("/data-export/latest", dataExportHandler.GetLatestExportStatus).Methods("GET")
	privateRoutes.HandleFunc("/data-export/{exportID}/status", dataExportHandler.GetExportStatus).Methods("GET")

	/* Social Routes */
	restrictedRoutes.HandleFunc("/socials", socialHandler.CreateUserSocial).Methods("POST")
	restrictedRoutes.HandleFunc("/socials/{socialID}", socialHandler.UpdateUserSocial).Methods("PUT")
	restrictedRoutes.HandleFunc("/socials/{socialID}", socialHandler.DeleteUserSocial).Methods("DELETE")
	restrictedRoutes.HandleFunc("/socials", socialHandler.ReorderUserSocial).Methods("PUT")

	/* MFA Routes */
	restrictedRoutes.HandleFunc("/mfa/generate", mfaHandler.GenerateMFASecret).Methods("POST")
	restrictedRoutes.HandleFunc("/mfa/enable", mfaHandler.EnableMFA).Methods("POST")
	restrictedRoutes.HandleFunc("/mfa/disable", mfaHandler.DisableMFA).Methods("POST")

	/* Discord Routes */
	restrictedRoutes.HandleFunc("/discord/oauth2/link", discordHandler.OAuth2Link).Methods("GET")
	restrictedRoutes.HandleFunc("/discord/oauth2/unlink", discordHandler.UnlinkDiscordAccount).Methods("DELETE")

	/* Widget Routes */
	restrictedRoutes.HandleFunc("/widgets", widgetHandler.CreateUserWidget).Methods("POST")
	restrictedRoutes.HandleFunc("/widgets/{id}", widgetHandler.UpdateUserWidget).Methods("PUT")
	restrictedRoutes.HandleFunc("/widgets/{id}", widgetHandler.DeleteUserWidget).Methods("DELETE")
	restrictedRoutes.HandleFunc("/widgets", widgetHandler.ReorderUserWidget).Methods("PUT")

	/* Badge Routes */
	restrictedRoutes.HandleFunc("/badges", badgeHandler.ReorderUserBadge).Methods("PUT")
	restrictedRoutes.HandleFunc("/badges/{badgeID}/hide", badgeHandler.HideUserBadge).Methods("PUT")
	restrictedRoutes.HandleFunc("/badges/custom/{badgeID}", badgeHandler.EditCustomBadge).Methods("PUT")

	/* File Routes */
	restrictedRoutes.HandleFunc("/files/upload", fileHandler.UploadFile).Methods("POST")
	restrictedRoutes.HandleFunc("/files/delete", fileHandler.DeleteFile).Methods("POST")

	/* View Routes */
	privateRoutes.HandleFunc("/views", viewHandler.GetUserViewsData).Methods("GET")

	/* Redeem Routes */
	privateRoutes.HandleFunc("/redeem/{code}", redeemHandler.RedeemCode).Methods("POST")

	/* Session Routes */
	privateRoutes.HandleFunc("/sessions/logout-all", sessionHandler.LogoutAllSessions).Methods("POST")
	privateRoutes.HandleFunc("/sessions/{session_token}", sessionHandler.DeleteSession).Methods("DELETE")
	privateRoutes.HandleFunc("/sessions", sessionHandler.GetAllSessions).Methods("GET")

	/* Email Routes */
	privateRoutes.HandleFunc("/email/send-verification", emailHandler.SendVerificationEmail).Methods("POST")
	privateRoutes.HandleFunc("/email/verify", emailHandler.VerifyEmailCode).Methods("POST")

	/* Template Routes */
	restrictedRoutes.HandleFunc("/templates", templateHandler.CreateTemplate).Methods("POST")
	privateRoutes.HandleFunc("/templates", templateHandler.GetUserTemplates).Methods("GET")
	privateRoutes.HandleFunc("/templates/{templateID}", templateHandler.GetTemplate).Methods("GET")
	restrictedRoutes.HandleFunc("/templates/{templateID}", templateHandler.UpdateTemplate).Methods("PUT")
	restrictedRoutes.HandleFunc("/templates/{templateID}", templateHandler.DeleteTemplate).Methods("DELETE")
	restrictedRoutes.HandleFunc("/templates/{templateID}/apply", templateHandler.ApplyTemplate).Methods("POST")



	/* Analytics Routes */
	privateRoutes.HandleFunc("/analytics", analyticsHandler.GetAnalytics).Methods("GET")

	/* Application Routes */
	privateRoutes.HandleFunc("/applications", applyHandler.GetUserApplications).Methods("GET")
	restrictedRoutes.HandleFunc("/applications/start", applyHandler.StartApplication).Methods("POST")
	restrictedRoutes.HandleFunc("/applications/answer", applyHandler.SaveAnswer).Methods("POST")
	restrictedRoutes.HandleFunc("/applications/submit", applyHandler.SubmitApplication).Methods("POST")

	/* Report routes */
	privateRoutes.HandleFunc("/reports", punishHandler.CreateReport).Methods("POST")

	/* Moderation routes (based on staff level) */
	// Staff routes accessible to all staff members (trial mod+)
	staffRoutes := privateRoutes.NewRoute().Subrouter()
	staffMiddleware := middlewares.StaffMiddleware(userService)
	staffRoutes.Use(staffMiddleware)
	staffRoutes.HandleFunc("/moderation/search-users", punishHandler.SearchUsers).Methods("GET")
	staffRoutes.HandleFunc("/moderation/reports/count", punishHandler.GetOpenReportCount).Methods("GET")
	staffRoutes.HandleFunc("/moderation/reports", punishHandler.GetOpenReports).Methods("GET")

	// Moderator routes (full mod+)
	moderatorRoutes := privateRoutes.NewRoute().Subrouter()
	moderatorMiddleware := middlewares.ModeratorMiddleware(userService)
	moderatorRoutes.Use(moderatorMiddleware)
	moderatorRoutes.HandleFunc("/moderation/restrict", punishHandler.RestrictUser).Methods("POST")
	moderatorRoutes.HandleFunc("/moderation/unrestrict/{id}", punishHandler.UnrestrictUser).Methods("POST")
	moderatorRoutes.HandleFunc("/moderation/templates", punishHandler.GetPunishmentTemplates).Methods("GET")
	moderatorRoutes.HandleFunc("/moderation/reports/{id}/handle", punishHandler.HandleReport).Methods("POST")
	moderatorRoutes.HandleFunc("/moderation/reports/{id}", punishHandler.GetReport).Methods("GET")
	moderatorRoutes.HandleFunc("/moderation/reports/{id}/assign", punishHandler.AssignReportToStaff).Methods("POST")

	/* Routes that should be blocked for staff */
	adminRoutes := privateRoutes.NewRoute().Subrouter()
	adminMiddleware := middlewares.AdminMiddleware(userService)
	adminRoutes.Use(adminMiddleware)

	adminRoutes.HandleFunc("/moderation/applications/{status}", applyHandler.GetApplications).Methods("GET")
	adminRoutes.HandleFunc("/moderation/applications/detail/{id}", applyHandler.GetApplicationDetail).Methods("GET")
	adminRoutes.HandleFunc("/moderation/applications/review/{id}", applyHandler.ReviewApplication).Methods("POST")



}
