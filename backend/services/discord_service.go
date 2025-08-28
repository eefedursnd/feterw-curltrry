package services

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/models"
	"gorm.io/gorm"
)

type DiscordService struct {
	DB          *gorm.DB
	Client      *redis.Client
	UserService *UserService
	BotSession  *discordgo.Session
}

func NewDiscordService(db *gorm.DB, client *redis.Client, userService *UserService, botSession *discordgo.Session) *DiscordService {
	return &DiscordService{
		DB:          db,
		Client:      client,
		UserService: userService,
		BotSession:  botSession,
	}
}

/* Create OAuth2 URL */
func (ds *DiscordService) CreateOAuth2URL(login bool) string {
	params := url.Values{}
	params.Add("client_id", config.DiscordClientID)

	var redirectURI string
	if login {
		redirectURI = config.DiscordRedirectURI + "/callback"
	} else {
		redirectURI = config.DiscordRedirectURI + "/link/callback"
	}

	params.Add("redirect_uri", redirectURI)
	params.Add("response_type", "code")
	params.Add("scope", "identify")

	authURL := fmt.Sprintf("https://discord.com/oauth2/authorize?%s", params.Encode())
	return authURL
}

/* Handle OAuth2 callback */
func (ds *DiscordService) HandleOAuth2Callback(UID uint, code string, login bool) (string, error) {
	token, err := ds.getAccessToken(code, login)
	if err != nil {
		return "", fmt.Errorf("failed to get access token: %w", err)
	}

	discordID, err := ds.getDiscordUserInfo(token)
	if err != nil {
		return "", fmt.Errorf("failed to get user info: %w", err)
	}

	if !login {
		if err := ds.LinkDiscordAccount(UID, discordID); err != nil {
			return "", fmt.Errorf("failed to link discord account: %w", err)
		}

		// if err := ds.PushMetadata(UID, token); err != nil {
		// 	return "", fmt.Errorf("failed to push metadata: %w", err)
		// }
	}

	return discordID, nil
}

/* Link Discord account to user */
func (ds *DiscordService) LinkDiscordAccount(uid uint, discordID string) error {
	existingUser, err := ds.GetUserByDiscordID(discordID)
	if err == nil && existingUser.UID != uid {
		return fmt.Errorf("this Discord account is already linked to another haze.bio account")
	}

	user, err := ds.UserService.GetUserByUIDNoCache(uid)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	fields := make(map[string]interface{})
	fields["discord_id"] = discordID
	fields["login_with_discord"] = true
	fields["linked_at"] = time.Now()

	err = ds.UserService.UpdateUserFields(user.UID, fields)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

/* Unlink Discord account from user */
func (ds *DiscordService) UnlinkDiscordAccount(uid uint) error {
	user, err := ds.UserService.GetUserByUIDNoCache(uid)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	fields := make(map[string]interface{})
	fields["discord_id"] = ""
	fields["login_with_discord"] = false
	fields["linked_at"] = time.Time{}

	err = ds.UserService.UpdateUserFields(user.UID, fields)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

/* Get user by Discord ID */
func (ds *DiscordService) GetUserByDiscordID(discordID string) (*models.User, error) {
	var user models.User
	err := ds.DB.Where("discord_id = ?", discordID).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found with discord id: %s", discordID)
		}
		return nil, fmt.Errorf("failed to get user by discord id: %w", err)
	}

	return &user, nil
}

/* Check if Discord ID is already linked to a user */
func (ds *DiscordService) CheckDiscordIDExists(discordID uint) bool {
	var user models.User
	err := ds.DB.Where("discord_id = ?", discordID).First(&user).Error
	return err == nil
}

/* Delete Discord ID for a user */
func (ds *DiscordService) DeleteDiscordID(uid uint) error {
	user, err := ds.UserService.GetUserByUIDNoCache(uid)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	fields := make(map[string]interface{})
	fields["discord_id"] = ""
	fields["linked_at"] = time.Time{}

	err = ds.UserService.UpdateUserFields(user.UID, fields)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

/* Check if user is linked with Discord */
func (ds *DiscordService) IsLinkedWithDiscord(uid uint) bool {
	user, err := ds.UserService.GetUserByUIDNoCache(uid)
	if err != nil {
		log.Printf("failed to get user: %v", err)
		return false
	}

	return user.LoginWithDiscord
}

/* Get Access Token from Discord */
func (ds *DiscordService) getAccessToken(code string, login bool) (string, error) {
	data := url.Values{}
	data.Set("client_id", config.DiscordClientID)
	data.Set("client_secret", config.DiscordClientSecret)
	data.Set("grant_type", "authorization_code")
	data.Set("code", code)
	if login {
		data.Set("redirect_uri", config.DiscordRedirectURI+"/login")
	} else {
		data.Set("redirect_uri", config.DiscordRedirectURI+"/link")
	}

	resp, err := http.PostForm("https://discord.com/api/oauth2/token", data)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to get access token, status: %d, response: %s", resp.StatusCode, string(body))
	}

	var tokenResponse struct {
		AccessToken string `json:"access_token"`
	}

	if err := json.Unmarshal(body, &tokenResponse); err != nil {
		return "", err
	}

	if tokenResponse.AccessToken == "" {
		return "", fmt.Errorf("access token is empty, response: %s", string(body))
	}

	return tokenResponse.AccessToken, nil
}

/* Get User Info from Discord */
func (ds *DiscordService) getDiscordUserInfo(token string) (string, error) {
	req, _ := http.NewRequest("GET", "https://discord.com/api/users/@me", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var userInfo struct {
		ID string `json:"id"`
	}
	body, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return "", err
	}

	return userInfo.ID, nil
}

/* Push Metadata "views" to user */
// func (ds *DiscordService) PushMetadata(UID uint, accessToken string) error {
// 	user, err := ds.UserService.GetUserByUID(UID)
// 	if err != nil {
// 		return fmt.Errorf("failed to get user: %w", err)
// 	}

// 	ts, _ := discordgo.New("Bearer " + accessToken)

// 	u, err := ts.User("@me")
// 	if err != nil {
// 		return fmt.Errorf("failed to get user: %w", err)
// 	}

// 	metadata := map[string]string{
// 		"views": fmt.Sprintf("%d", user.Profile.Views),
// 	}

// 	st, err := ts.UserApplicationRoleConnectionUpdate(config.DiscordClientID, &discordgo.ApplicationRoleConnection{
// 		PlatformName:     "HAZE BIO",
// 		PlatformUsername: u.Username,
// 		Metadata:         metadata,
// 	})
// 	if err != nil {
// 		return fmt.Errorf("failed to push metadata: %w", err)
// 	}

// 	prettyJSON, _ := json.MarshalIndent(st, "", "    ")
// 	log.Println(string(prettyJSON))

// 	return nil
// }

// func (ds *DiscordService) CreateLinkedRoles() error {
// 	metaData := []*discordgo.ApplicationRoleConnectionMetadata{
// 		{
// 			Type:        discordgo.ApplicationRoleConnectionMetadataIntegerGreaterThanOrEqual,
// 			Key:         "views",
// 			Name:        "Views",
// 			Description: "The number of views the user has",
// 		},
// 	}

// 	_, err := ds.BotSession.ApplicationRoleConnectionMetadataUpdate(config.DiscordClientID, metaData)
// 	if err != nil {
// 		return fmt.Errorf("failed to create linked roles: %w", err)
// 	}

// 	return nil
// }

/*
Push metadata to user
*/

/* Get User Decoration URL */
func (ds *DiscordService) GetUserDecorationURL(UID uint) (string, error) {
	user, err := ds.UserService.GetUserByUID(UID)
	if err != nil {
		return "", fmt.Errorf("failed to get user: %w", err)
	}

	if user.DiscordID == "" {
		return "", fmt.Errorf("user is not linked with Discord")
	}

	req, err := http.NewRequest("GET", "https://discord.com/api/v10/users/"+user.DiscordID, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bot "+config.DiscordToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to get user from Discord API: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to get user from Discord API, status: %d, response: %s", resp.StatusCode, string(body))
	}

	type avatarDecorationData struct {
		Asset string `json:"asset"`
		SkuID string `json:"sku_id"`
	}

	type discordUser struct {
		ID                   string                `json:"id"`
		Username             string                `json:"username"`
		Avatar               string                `json:"avatar"`
		AvatarDecorationData *avatarDecorationData `json:"avatar_decoration_data"`
	}

	var discordUserData discordUser
	if err := json.Unmarshal(body, &discordUserData); err != nil {
		return "", fmt.Errorf("failed to parse user info: %w", err)
	}

	if discordUserData.AvatarDecorationData == nil || discordUserData.AvatarDecorationData.Asset == "" {
		return "", fmt.Errorf("user has no avatar decoration")
	}

	decorationURL := fmt.Sprintf("https://cdn.discordapp.com/avatar-decoration-presets/%s.png", discordUserData.AvatarDecorationData.Asset)

	return decorationURL, nil
}

/* Discord Presence */
func (ds *DiscordService) GetDiscordPresence(UID uint) (map[string]interface{}, error) {
	log.Println("Getting presence for user:", UID)

	user, err := ds.UserService.GetUserByUID(UID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	member, err := ds.BotSession.GuildMember(config.DiscordGuildID, user.DiscordID)
	if err != nil {
		return nil, fmt.Errorf("failed to get member from Discord API: %w", err)
	}

	presence, err := ds.BotSession.State.Presence(config.DiscordGuildID, user.DiscordID)
	if err != nil {
		log.Printf("Presence not found for user %s (possibly offline or uncached): %v\n", user.DiscordID, err)
		presence = &discordgo.Presence{
			User:   &discordgo.User{ID: user.DiscordID},
			Status: discordgo.StatusOffline,
		}
	}

	status := string(presence.Status)
	activities := presence.Activities
	activityText := "N/A"
	state := "N/A"
	details := "N/A"
	coverImage := "N/A"
	description := "N/A"
	customEmoji := "N/A"
	emojiID := "N/A"
	emojiName := "N/A"
	emojiAnimated := false
	largeText := "N/A"

	priority := map[discordgo.ActivityType]int{
		discordgo.ActivityTypeStreaming: 0,
		discordgo.ActivityTypeGame:      1,
		discordgo.ActivityTypeListening: 2,
		discordgo.ActivityTypeWatching:  3,
		discordgo.ActivityTypeCustom:    4,
	}

	sort.SliceStable(activities, func(i, j int) bool {
		return priority[activities[i].Type] < priority[activities[j].Type]
	})

	prettyJson, _ := json.MarshalIndent(presence, "", "    ")
	log.Println("Presence JSON:", string(prettyJson))

	for _, act := range activities {
		if act.Type == discordgo.ActivityTypeCustom {
			if act.State != "" {
				description = act.State
			}

			if act.Emoji.Name != "" {
				emojiName = act.Emoji.Name
				customEmoji = act.Emoji.Name
			}

			if act.Emoji.ID != "" {
				emojiID = act.Emoji.ID
				emojiAnimated = act.Emoji.Animated

				if emojiAnimated {
					customEmoji = fmt.Sprintf("https://cdn.discordapp.com/emojis/%s.gif", emojiID)
				} else {
					customEmoji = fmt.Sprintf("https://cdn.discordapp.com/emojis/%s.png", emojiID)
				}
			}
			continue
		}

		state = act.State
		details = act.Details

		switch act.Type {
		case discordgo.ActivityTypeGame, discordgo.ActivityTypeWatching:
			activityText = act.Name
		case discordgo.ActivityTypeStreaming:
			activityText = fmt.Sprintf("Streaming %s", act.Name)
		case discordgo.ActivityTypeListening:
			if strings.HasPrefix(act.Assets.LargeImageID, "spotify:") {
				activityText = fmt.Sprintf("Listening to %s by %s", act.Details, act.State)
				coverImage = fmt.Sprintf("https://i.scdn.co/image/%s", strings.TrimPrefix(act.Assets.LargeImageID, "spotify:"))
			} else {
				activityText = fmt.Sprintf("Listening to %s", act.Name)
			}
		}
		asset := act.Assets
		if asset.LargeImageID != "" {
			if strings.HasPrefix(asset.LargeImageID, "mp:external/") {
				externalID := strings.TrimPrefix(asset.LargeImageID, "mp:external/")
				coverImage = fmt.Sprintf("https://media.discordapp.net/external/%s", externalID)
			} else {
				appID := act.ApplicationID
				coverImage = fmt.Sprintf("https://cdn.discordapp.com/app-assets/%s/%s.png", appID, asset.LargeImageID)
			}

			if asset.LargeText != "" {
				largeText = asset.LargeText
			}
		}

		if act.Assets.LargeImageID != "" && act.Assets.SmallImageID != "" {
			largeText = act.Assets.LargeText
		}
		break
	}

	if activityText == "N/A" && description != "N/A" {
		activityText = description
	}

	badges, _ := ds.GetUserBadges(member)

	result := map[string]interface{}{
		"avatar":         member.AvatarURL("512"),
		"username":       member.User.Username,
		"status":         status,
		"description":    description,
		"emoji":          customEmoji,
		"emoji_id":       emojiID,
		"emoji_name":     emojiName,
		"emoji_animated": emojiAnimated,
		"activity":       activityText,
		"state":          state,
		"details":        details,
		"cover_image":    coverImage,
		"badges":         badges,
		"large_text":     largeText,
	}

	return result, nil
}

func (ds *DiscordService) GetUserBadges(member *discordgo.Member) ([]map[string]string, error) {
	if member == nil || member.User == nil {
		return nil, fmt.Errorf("invalid member or user data")
	}

	badgeOrder := map[string]int{
		"Discord Staff":                0,
		"Verified Bot":                 1,
		"Early Verified Bot Developer": 2,
		"Partnered Server Owner":       3,
		"Moderator Programs Alumni":    4,
		"Bug Hunter Level 2":           5,
		"Early Supporter":              6,
		"Nitro":                        7,
		"HypeSquad Events":             8,
		"HypeSquad Bravery":            9,
		"HypeSquad Brilliance":         10,
		"HypeSquad Balance":            11,
		"Active Developer":             12,
	}

	badgeBits := map[int]map[string]string{
		1 << 0: {
			"name": "Discord Staff",
			"url":  "https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png",
		},
		1 << 1: {
			"name": "Partnered Server Owner",
			"url":  "https://cdn.discordapp.com/badge-icons/3f9748e53446a137a052f3454e2de41e.png",
		},
		1 << 2: {
			"name": "HypeSquad Events",
			"url":  "https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png",
		},
		1 << 6: {
			"name": "HypeSquad Bravery",
			"url":  "https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png",
		},
		1 << 7: {
			"name": "HypeSquad Brilliance",
			"url":  "https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png",
		},
		1 << 8: {
			"name": "HypeSquad Balance",
			"url":  "https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png",
		},
		1 << 9: {
			"name": "Early Supporter",
			"url":  "https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png",
		},
		1 << 14: {
			"name": "Bug Hunter Level 2",
			"url":  "https://cdn.discordapp.com/badge-icons/848f79194d4be5ff5f81505cbd0ce1e6.png",
		},
		1 << 16: {
			"name": "Verified Bot",
			"url":  "https://cdn.discordapp.com/badge-icons/6df5892e0f35b051f8b61eace34f4967.png",
		},
		1 << 17: {
			"name": "Early Verified Bot Developer",
			"url":  "https://cdn.discordapp.com/badge-icons/6df5892e0f35b051f8b61eace34f4967.png",
		},
		1 << 18: {
			"name": "Moderator Programs Alumni",
			"url":  "https://cdn.discordapp.com/badge-icons/fee1624003e2fee35cb398e125dc479b.png",
		},
		1 << 19: {
			"name": "Active Developer",
			"url":  "https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png",
		},
	}

	var badges []map[string]string

	for bit, badge := range badgeBits {
		if member.User.PublicFlags&discordgo.UserFlags(bit) != 0 {
			badges = append(badges, badge)
		}
	}

	isPremium := member.User.PremiumType > 0 || member.User.Avatar != "" || member.User.Discriminator != "0"
	if isPremium {
		badges = append(badges, map[string]string{
			"name": "Nitro",
			"url":  "https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png",
		})
	}

	sort.Slice(badges, func(i, j int) bool {
		orderI, existsI := badgeOrder[badges[i]["name"]]
		orderJ, existsJ := badgeOrder[badges[j]["name"]]

		if !existsI {
			orderI = 999
		}
		if !existsJ {
			orderJ = 999
		}

		return orderI < orderJ
	})

	return badges, nil
}

/* Get Discord Server */
func (ds *DiscordService) GetDiscordServer(serverInvite string) (map[string]interface{}, error) {
	cachedServer, err := ds.getDiscordServerFromCache(serverInvite)
	if err == nil && cachedServer != nil {
		return cachedServer, nil
	}

	prefixes := []string{"https://discord.gg/", "https://discord.com/invite/", "/"}

	for _, prefix := range prefixes {
		serverInvite = strings.TrimPrefix(serverInvite, prefix)
	}

	st, err := ds.BotSession.InviteWithCounts(serverInvite)
	if err != nil {
		return nil, fmt.Errorf("invite does not exist: %w", err)
	}

	server := map[string]interface{}{
		"name":         st.Guild.Name,
		"avatar":       st.Guild.IconURL("512"),
		"online_count": st.ApproximatePresenceCount,
		"total_count":  st.ApproximateMemberCount,
	}

	err = ds.cacheDiscordServer(serverInvite, server)
	if err != nil {
		log.Printf("failed to cache discord server: %v", err)
	}

	return server, nil
}

func (ds *DiscordService) cacheDiscordServer(invite string, server map[string]interface{}) error {
	key := fmt.Sprintf("discord_server:%s", invite)
	serverJSON, err := json.Marshal(server)
	if err != nil {
		return fmt.Errorf("failed to marshal server info: %w", err)
	}

	err = ds.Client.Set(key, serverJSON, time.Minute*15).Err()
	if err != nil {
		return fmt.Errorf("failed to set cache: %w", err)
	}

	return nil
}

func (ds *DiscordService) getDiscordServerFromCache(invite string) (map[string]interface{}, error) {
	key := fmt.Sprintf("discord_server:%s", invite)
	serverJSON, err := ds.Client.Get(key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get from cache: %w", err)
	}

	var server map[string]interface{}
	err = json.Unmarshal([]byte(serverJSON), &server)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal server info: %w", err)
	}

	return server, nil
}
