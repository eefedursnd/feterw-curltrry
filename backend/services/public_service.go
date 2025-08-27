package services

import (
	"encoding/json"
	"log"
	"sort"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"gorm.io/gorm"
)

type PublicService struct {
	DB     *gorm.DB
	Client *redis.Client
}

func NewPublicService(db *gorm.DB, client *redis.Client) *PublicService {
	return &PublicService{
		DB:     db,
		Client: client,
	}
}

type MarqueeUser struct {
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url"`
}

/* Get Marquee Users (Cached 30min) */
func (ps *PublicService) GetMarqueeUsers() ([]*MarqueeUser, error) {
	cacheKey := "marquee_users"
	var marqueeUsers []*MarqueeUser

	val, err := ps.Client.Get(cacheKey).Result()
	if err == nil {
		err = json.Unmarshal([]byte(val), &marqueeUsers)
		if err != nil {
			log.Printf("Error decoding marquee users from cache: %v", err)
			ps.Client.Del(cacheKey)
		} else {
			return marqueeUsers, nil
		}
	} else if err != redis.Nil {
		log.Printf("Error getting marquee users from cache: %v", err)
	}

	var bannedUserIDs []uint
	err = ps.DB.Model(&models.Punishment{}).
		Where("active = ? AND end_date > ?", true, time.Now()).
		Pluck("user_id", &bannedUserIDs).Error
	if err != nil {
		log.Printf("Error fetching banned users: %v", err)
	}

	bannedUsers := make(map[uint]bool)
	for _, uid := range bannedUserIDs {
		bannedUsers[uid] = true
	}

	var users []*models.User
	err = ps.DB.Preload("Profile").
		Joins("JOIN user_badges ON user_badges.uid = users.uid").
		Joins("JOIN badges ON badges.id = user_badges.badge_id").
		Where("badges.name = ?", "Featured").
		Find(&users).Error

	if err != nil {
		return nil, err
	}

	for _, user := range users {
		if _, isBanned := bannedUsers[user.UID]; isBanned {
			continue
		}

		marqueeUsers = append(marqueeUsers, &MarqueeUser{
			Username:    user.Username,
			DisplayName: user.DisplayName,
			AvatarURL:   user.Profile.AvatarURL,
		})
	}

	encoded, err := json.Marshal(marqueeUsers)
	if err != nil {
		log.Printf("Error encoding marquee users for cache: %v", err)
	} else {
		err = ps.Client.Set(cacheKey, string(encoded), time.Minute*30).Err()
		if err != nil {
			log.Printf("Error setting marquee users in cache: %v", err)
		}
	}

	return marqueeUsers, nil
}

type LeaderboardUser struct {
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url"`
	Views       uint   `json:"views"`
	Badges      int    `json:"badges"`
}

type SortBy string

const (
	SortByViews  SortBy = "views"
	SortByBadges SortBy = "badges"
)

/* Get Leaderboard Users (Top 50, Cached) */
func (ps *PublicService) GetLeaderboardUsers(sortBy SortBy) ([]*LeaderboardUser, error) {
	cacheKey := "leaderboard_users_" + string(sortBy)
	var leaderboardUsers []*LeaderboardUser

	val, err := ps.Client.Get(cacheKey).Result()
	if err == nil {
		err = json.Unmarshal([]byte(val), &leaderboardUsers)
		if err != nil {
			log.Printf("Error decoding leaderboard users from cache: %v", err)
			ps.Client.Del(cacheKey)
		} else {
			return leaderboardUsers, nil
		}
	} else if err != redis.Nil {
		log.Printf("Error getting leaderboard users from cache: %v", err)
	}

	var bannedUserIDs []uint
	err = ps.DB.Model(&models.Punishment{}).
		Where("active = ? AND end_date > ?", true, time.Now()).
		Pluck("user_id", &bannedUserIDs).Error
	if err != nil {
		log.Printf("Error fetching banned users: %v", err)
	}

	bannedUsers := make(map[uint]bool)
	for _, uid := range bannedUserIDs {
		bannedUsers[uid] = true
	}

	var users []*models.User
	err = ps.DB.Preload("Profile").Preload("Badges").Find(&users).Error
	if err != nil {
		return nil, err
	}

	for _, user := range users {
		if _, isBanned := bannedUsers[user.UID]; isBanned {
			continue
		}

		leaderboardUsers = append(leaderboardUsers, &LeaderboardUser{
			Username:    user.Username,
			DisplayName: user.DisplayName,
			AvatarURL:   user.Profile.AvatarURL,
			Views:       user.Profile.Views,
			Badges:      len(user.Badges),
		})
	}

	sort.Slice(leaderboardUsers, func(i, j int) bool {
		switch sortBy {
		case SortByViews:
			return leaderboardUsers[i].Views > leaderboardUsers[j].Views
		case SortByBadges:
			return leaderboardUsers[i].Badges > leaderboardUsers[j].Badges
		default:
			return leaderboardUsers[i].Views > leaderboardUsers[j].Views
		}
	})

	if len(leaderboardUsers) > 50 {
		leaderboardUsers = leaderboardUsers[:50]
	}

	encoded, err := json.Marshal(leaderboardUsers)
	if err != nil {
		log.Printf("Error encoding leaderboard users for cache: %v", err)
	} else {
		err = ps.Client.Set(cacheKey, string(encoded), time.Minute*30).Err()
		if err != nil {
			log.Printf("Error setting leaderboard users in cache: %v", err)
		}
	}

	return leaderboardUsers, nil
}
