package discord

import (
	"github.com/hazebio/haze.bio_backend/services"
)

type ServiceManager struct {
	Discord      *services.DiscordService
	Badge        *services.BadgeService
	User         *services.UserService
	Profile      *services.ProfileService
	Punish       *services.PunishService
	Redeem       *services.RedeemService
	Status       *services.StatusService
	Image        *services.ImageService
	AltAccount   *services.AltAccountService
	Event        *services.EventService
	Experimental *services.ExperimentalService
}
