package models

import (
	"time"
)

type User struct {
	UID           uint    `json:"uid" gorm:"primaryKey;autoIncrement"`
	Email         *string `json:"email" gorm:"unique;default:null"`
	Username      string  `json:"username" gorm:"unique;not null"`
	DisplayName   string  `json:"display_name" gorm:"not null"`
	Alias         *string `json:"alias" gorm:"unique;default:null"`
	Password      string  `json:"password" gorm:"type:varchar(255);not null"`
	EmailVerified bool    `json:"email_verified" gorm:"default:false"`
	StaffLevel    uint    `json:"staff_level" gorm:"default:0"` // 0=User, 1=Trial Mod, 2=Mod, 3=Head Mod, 4=Admin

	/* Glow, Subscription and Badge Credits */
	Subscription     UserSubscription `json:"subscription" gorm:"foreignKey:UserID;references:UID;constraint:OnDelete:CASCADE"`
	BadgeEditCredits int              `json:"badge_edit_credits" gorm:"default:0"`

	/* MFA (Multi-Factor Authentication) */
	MFASecret  string `json:"mfa_secret" gorm:"default:null"`
	MFAEnabled bool   `json:"mfa_enabled" gorm:"default:false"`

	/* Discord */
	LoginWithDiscord bool      `json:"login_with_discord" gorm:"default:false"`
	DiscordID        string    `json:"discord_id" gorm:"default:null"`
	LinkedAt         time.Time `json:"linked_at" gorm:"default:null"`

	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`

	/* Relations */
	Profile     *UserProfile  `json:"profile" gorm:"foreignKey:UID;references:UID;constraint:OnDelete:CASCADE"`
	Badges      []UserBadge   `json:"badges" gorm:"foreignKey:UID;references:UID;constraint:OnDelete:CASCADE"`
	Socials     []UserSocial  `json:"socials" gorm:"foreignKey:UID;references:UID;constraint:OnDelete:CASCADE"`
	Widgets     []UserWidget  `json:"widgets" gorm:"foreignKey:UID;references:UID;constraint:OnDelete:CASCADE"`
	Punishments *[]Punishment `json:"punishments" gorm:"foreignKey:UserID;references:UID;constraint:OnDelete:CASCADE"`
	Sessions    []UserSession `json:"sessions" gorm:"foreignKey:UserID;references:UID;constraint:OnDelete:CASCADE"`

	/* Virtual fields */
	HasPremium           bool     `json:"has_premium" gorm:"-"`
	ExperimentalFeatures []string `json:"experimental_features,omitempty" gorm:"-"`

	UsernameCooldown    int `json:"username_cooldown,omitempty" gorm:"-"`
	AliasCooldown       int `json:"alias_cooldown,omitempty" gorm:"-"`
	DisplayNameCooldown int `json:"display_name_cooldown,omitempty" gorm:"-"`
}

func (u *User) GetActivePunishment() *Punishment {
	if u.Punishments == nil {
		return nil
	}

	for _, punishment := range *u.Punishments {
		if punishment.Active {
			return &punishment
		}
	}

	return nil
}

func (u *User) HasActivePunishment() bool {
	if u.Punishments == nil {
		return false
	}

	for _, punishment := range *u.Punishments {
		if punishment.Active {
			return true
		}
	}

	return false
}

func (u *User) HasActivePremiumSubscription() bool {
	return u.Subscription.Status == "active"
}

type UserProfile struct {
	UID                    uint    `json:"uid" gorm:"primaryKey"`
	Views                  uint    `json:"views" gorm:"default:0"`
	Description            string  `json:"description" gorm:"default:null"`
	Location               string  `json:"location" gorm:"default:null"`
	Occupation             string  `json:"occupation" gorm:"default:null"`
	AvatarURL              string  `json:"avatar_url" gorm:"default:null"`
	BackgroundURL          string  `json:"background_url" gorm:"default:null"`
	AudioURL               string  `json:"audio_url" gorm:"default:null"`
	CursorURL              string  `json:"cursor_url" gorm:"default:null"`
	BannerURL              string  `json:"banner_url" gorm:"default:null"`
	DecorationURL          string  `json:"decoration_url" gorm:"default:null"`
	AccentColor            string  `json:"accent_color" gorm:"default:null"`
	TextColor              string  `json:"text_color" gorm:"default:null"`
	BackgroundColor        string  `json:"background_color" gorm:"default:null"`
	GradientFromColor      string  `json:"gradient_from_color" gorm:"default:null"`
	GradientToColor        string  `json:"gradient_to_color" gorm:"default:null"`
	IconColor              string  `json:"icon_color" gorm:"default:null"`
	BadgeColor             string  `json:"badge_color" gorm:"default:null"`
	PageEnterText          string  `json:"page_enter_text" gorm:"default:null"`
	PageTransition         string  `json:"page_transition" gorm:"default:null"`
	PageTransitionDuration float32 `json:"page_transition_duration" gorm:"default:0.2"`
	TextFont               string  `json:"text_font" gorm:"default:null"`
	AvatarShape            string  `json:"avatar_shape" gorm:"default:rounded-2xl"`
	Template               string  `json:"template" gorm:"default:default"`
	MonochromeIcons        bool    `json:"monochrome_icons" gorm:"default:false"`
	MonochromeBadges       bool    `json:"monochrome_badges" gorm:"default:false"`
	HideJoinedDate         bool    `json:"hide_joined_date" gorm:"default:false"`
	HideViewsCount         bool    `json:"hide_views_count" gorm:"default:false"`
	CardOpacity            float32 `json:"card_opacity" gorm:"default:0.9"`
	CardBlur               float32 `json:"card_blur" gorm:"default:0.5"`
	CardBorderRadius       float32 `json:"card_border_radius" gorm:"default:15"`
	BackgroundBlur         float32 `json:"background_blur" gorm:"default:0.5"`
	ParallaxEffect         bool    `json:"parallax_effect" gorm:"default:false"`
	LayoutMaxWidth         uint    `json:"layout_max_width" gorm:"default:776"`
	UsernameEffects        string  `json:"username_effects" gorm:"default:null"`
	BackgroundEffects      string  `json:"background_effects" gorm:"default:null"`
	CursorEffects          string  `json:"cursor_effects" gorm:"default:null"`
	GlowUsername           bool    `json:"glow_username" gorm:"default:false"`
	GlowBadges             bool    `json:"glow_badges" gorm:"default:false"`
	GlowSocials            bool    `json:"glow_socials" gorm:"default:false"`
	ShowWidgetsOutside     bool    `json:"show_widgets_outside" gorm:"default:false"`
	ViewsAnimation         bool    `json:"views_animation" gorm:"default:false"`
	UseDiscordAvatar       bool    `json:"use_discord_avatar" gorm:"default:false"`
	UseDiscordDecoration   bool    `json:"use_discord_decoration" gorm:"default:false"`
}

type UserBadge struct {
	ID      uint  `json:"id" gorm:"primaryKey;autoIncrement"`
	UID     uint  `json:"uid" gorm:"not null;constraint:OnDelete:CASCADE;"`
	BadgeID uint  `json:"badge_id" gorm:"not null"`
	Sort    uint  `json:"sort" gorm:"default:0"`
	Hidden  bool  `json:"hidden" gorm:"default:false"`
	Badge   Badge `json:"badge" gorm:"foreignKey:BadgeID;references:ID"`
}

type UserSocial struct {
	ID         uint       `json:"id" gorm:"primaryKey;autoIncrement"`
	UID        uint       `json:"uid" gorm:"not null;constraint:OnDelete:CASCADE;"`
	Platform   string     `json:"platform" gorm:"not null"`
	Link       string     `json:"link" gorm:"not null"`
	Sort       uint       `json:"sort" gorm:"default:0"`
	Hidden     bool       `json:"hidden" gorm:"default:false"`
	SocialType SocialType `json:"social_type" gorm:"default:redirect"`
	ImageURL   string     `json:"image_url" gorm:"default:null"`
}

type SocialType string

const (
	SocialTypeRedirect SocialType = "redirect"
	SocialTypeCopyLink SocialType = "copy_text"
)

type UserWidget struct {
	ID         uint   `json:"id" gorm:"primaryKey;autoIncrement"`
	UID        uint   `json:"uid" gorm:"not null;constraint:OnDelete:CASCADE;"`
	WidgetData string `json:"widget_data" gorm:"not null"`
	Sort       uint   `json:"sort" gorm:"default:0"`
	Hidden     bool   `json:"hidden" gorm:"default:false"`
}

type UserSession struct {
	ID             uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID         uint      `json:"user_id" gorm:"index;constraint:OnDelete:CASCADE;"`
	SessionToken   string    `json:"session_token" gorm:"unique;not null"`
	UserAgent      string    `json:"user_agent"`
	IPAddress      string    `json:"ip_address"`
	Location       string    `json:"location" gorm:"default:null"`
	CurrentSession bool      `json:"current_session"`
	ExpiresAt      time.Time `json:"expires_at"`
	CreatedAt      time.Time `json:"created_at" gorm:"autoCreateTime"`
}

const (
	TransactionTypePurchase  = "Purchase"
	TransactionTypeTopup     = "Topup"
	TransactionTypeRefund    = "Refund"
	TransactionTypeAdmin     = "Admin"
	TransactionTypeCancelled = "Cancelled"
)

type UserSubscription struct {
	ID               uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID           uint      `json:"user_id" gorm:"index;constraint:OnDelete:CASCADE;"`
	SubscriptionType string    `json:"subscription_type" gorm:"not null"` // e.g., "monthly", "lifetime"
	Status           string    `json:"status" gorm:"not null"`            // e.g., "active", "canceled"
	NextPaymentDate  time.Time `json:"next_payment_date" gorm:"not null"`
	CreatedAt        time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt        time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
