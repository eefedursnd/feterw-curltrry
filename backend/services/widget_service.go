package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/models"
	govapi "github.com/yldshv/go-valorant-api"
	"gorm.io/gorm"
)

type WidgetService struct {
	DB          *gorm.DB
	Client      *redis.Client
	UserService *UserService
}

func NewWidgetService(db *gorm.DB, client *redis.Client) *WidgetService {
	return &WidgetService{
		DB:          db,
		Client:      client,
		UserService: &UserService{DB: db, Client: client},
	}
}

type WidgetOrderUpdate struct {
	WidgetData string `json:"widget_data"`
	Order      int    `json:"order"`
}

/* Create a new widget */
func (s *WidgetService) CreateUserWidget(widget *models.UserWidget) error {
	var widgetData map[string]interface{}
	if err := json.Unmarshal([]byte(widget.WidgetData), &widgetData); err != nil {
		return fmt.Errorf("invalid widget data: %w", err)
	}

	widgetType, ok := widgetData["type"].(string)
	if !ok {
		return errors.New("widget type is missing or invalid")
	}

	if !models.IsValidWidgetType(widgetType) {
		return fmt.Errorf("invalid widget type: %s", widgetType)
	}

	user, err := s.UserService.GetUserByUIDNoCache(widget.UID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	premiumFeatures := models.NewPremiumFeatures()
	if premiumFeatures.IsWidgetPremium(widgetType) && !user.HasActivePremiumSubscription() {
		return errors.New("adding this widget requires premium")
	}

	if err := s.DB.Create(widget).Error; err != nil {
		log.Println("Error creating user widget:", err)
		return err
	}

	return nil
}

/* Get all widgets for a user */
func (s *WidgetService) GetUserWidgets(uid uint) ([]*models.UserWidget, error) {
	widgets := []*models.UserWidget{}

	err := s.DB.Where("uid = ?", uid).Order("sort ASC").Find(&widgets).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []*models.UserWidget{}, nil
		}
		log.Println("Error getting user widgets:", err)
		return nil, err
	}

	return widgets, nil
}

/* Update a widget */
func (s *WidgetService) UpdateUserWidget(widget *models.UserWidget) error {
	var widgetData map[string]interface{}
	if err := json.Unmarshal([]byte(widget.WidgetData), &widgetData); err != nil {
		return fmt.Errorf("invalid widget data: %w", err)
	}

	widgetType, ok := widgetData["type"].(string)
	if !ok {
		return errors.New("widget type is missing or invalid")
	}

	if !models.IsValidWidgetType(widgetType) {
		return fmt.Errorf("invalid widget type: %s", widgetType)
	}

	user, err := s.UserService.GetUserByUIDNoCache(widget.UID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	premiumFeatures := models.NewPremiumFeatures()
	if premiumFeatures.IsWidgetPremium(widgetType) && !user.HasActivePremiumSubscription() {
		return errors.New("updating this widget requires premium")
	}

	log.Println("Updating widget:", widget.ID)

	err = s.DB.Model(widget).Where("uid = ? AND id = ?", widget.UID, widget.ID).Updates(widget).Error
	if err != nil {
		return err
	}

	return nil
}

/* Delete a widget */
func (s *WidgetService) DeleteUserWidget(uid uint, widgetID string) error {
	if err := s.DB.Where("uid = ? AND id = ?", uid, widgetID).Delete(&models.UserWidget{}).Error; err != nil {
		return err
	}

	return nil
}

/* Reorder widgets */
func (s *WidgetService) ReorderUserWidgets(uid uint, updates []WidgetOrderUpdate) error {
	tx := s.DB.Begin()
	for _, update := range updates {
		err := tx.Model(&models.UserWidget{}).
			Where("uid = ? AND widget_data = ?", uid, update.WidgetData).
			Update("sort", update.Order).Error
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	tx.Commit()
	return nil
}

/* Get Github Data */
func (s *WidgetService) GetGithubData(username string) (interface{}, error) {
	url := fmt.Sprintf("https://api.github.com/users/%s", username)

	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var user models.GitHubUser
	err = json.Unmarshal(body, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

/* Get Valorant Rank */
func (s *WidgetService) GetValorantRank(name string, tag string) (interface{}, error) {
	cacheKey := fmt.Sprintf("valorant_rank:%s:%s", name, tag)
	cachedRank, err := s.getValorantRankFromCache(cacheKey)
	if err == nil && cachedRank != nil {
		return cachedRank, nil
	}

	vapi := govapi.New(govapi.WithKey(config.HenrikApiKey))

	acc, err := vapi.GetAccountByName(govapi.GetAccountByNameParams{
		Name: name,
		Tag:  tag,
	})
	if err != nil {
		log.Println("Error getting account by name:", err)
		return nil, err
	}

	mmr, err := vapi.GetMMRByPUUIDv2(govapi.GetMMRByPUUIDv2Params{
		Affinity: acc.Data.Region,
		Puuid:    acc.Data.Puuid,
	})
	if err != nil {
		return nil, err
	}

	valorantDataModel := &models.ValorantRankData{
		Name:   name,
		Tag:    tag,
		Region: acc.Data.Region,
		Rank:   mmr.Data.HighestRank.PatchedTier,
		RR:     mmr.Data.CurrentData.RankingInTier,
	}

	if err := s.cacheValorantRank(cacheKey, valorantDataModel); err != nil {
		log.Printf("failed to cache valorant rank: %v", err)
	}

	return valorantDataModel, nil
}

func (s *WidgetService) cacheValorantRank(key string, data *models.ValorantRankData) error {
	dataJSON, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal valorant rank data: %w", err)
	}

	err = s.Client.Set(key, dataJSON, time.Minute*30).Err()
	if err != nil {
		return fmt.Errorf("failed to set cache: %w", err)
	}

	return nil
}

func (s *WidgetService) getValorantRankFromCache(key string) (*models.ValorantRankData, error) {
	dataJSON, err := s.Client.Get(key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get from cache: %w", err)
	}

	var data models.ValorantRankData
	err = json.Unmarshal([]byte(dataJSON), &data)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal valorant rank data: %w", err)
	}

	return &data, nil
}
