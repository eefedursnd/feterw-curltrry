package services

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/go-redis/redis"
	"github.com/hazebio/haze.bio_backend/models"
	"gorm.io/gorm"
)

const (
	ExperimentListKey    = "experiments:active"
	ExperimentUserPrefix = "experiment:users:"
)

type ExperimentalService struct {
	DB     *gorm.DB
	Client *redis.Client
}

func NewExperimentalService(db *gorm.DB, client *redis.Client) *ExperimentalService {
	service := &ExperimentalService{
		DB:     db,
		Client: client,
	}

	return service
}

func (es *ExperimentalService) CreateExperiment(name, featureKey, description string, startDate, endDate time.Time, initialUserCount int) error {
	experiment := &models.Experiment{
		Name:             name,
		FeatureKey:       featureKey,
		Description:      description,
		StartDate:        startDate,
		EndDate:          endDate,
		InitialUserCount: initialUserCount,
	}

	experimentData, err := json.Marshal(experiment)
	if err != nil {
		return fmt.Errorf("failed to marshal experiment data: %w", err)
	}

	err = es.Client.HSet(ExperimentListKey, featureKey, string(experimentData)).Err()
	if err != nil {
		return fmt.Errorf("failed to save experiment: %w", err)
	}

	now := time.Now()
	if now.After(startDate) || now.Equal(startDate) {
		if err := es.assignInitialUsers(featureKey, initialUserCount); err != nil {
			log.Printf("Warning: Failed to assign initial users to experiment %s: %v", featureKey, err)
		}
	}

	log.Printf("Created experiment: %s (%s)", name, featureKey)
	return nil
}

func (es *ExperimentalService) GetUserExperimentalFeatures(uid uint) ([]string, error) {
	activeExperiments, err := es.getActiveExperiments()
	if err != nil {
		return nil, fmt.Errorf("failed to get active experiments: %w", err)
	}

	userFeatures := []string{}
	for _, exp := range activeExperiments {
		userKey := fmt.Sprintf("%s%s", ExperimentUserPrefix, exp.FeatureKey)
		isMember, err := es.Client.SIsMember(userKey, uid).Result()
		if err != nil {
			log.Printf("Warning: Error checking if user %d is in experiment %s: %v", uid, exp.FeatureKey, err)
			continue
		}

		if isMember {
			userFeatures = append(userFeatures, exp.FeatureKey)
		}
	}

	return userFeatures, nil
}

func (es *ExperimentalService) ProcessExperiments() error {
	experimentsData, err := es.Client.HGetAll(ExperimentListKey).Result()
	if err != nil {
		return fmt.Errorf("failed to get experiments: %w", err)
	}

	now := time.Now()
	for featureKey, expData := range experimentsData {
		var experiment models.Experiment
		if err := json.Unmarshal([]byte(expData), &experiment); err != nil {
			log.Printf("Warning: Failed to unmarshal experiment data for %s: %v", featureKey, err)
			continue
		}

		if now.After(experiment.EndDate) {
			err = es.makeExperimentAvailableToAll(featureKey)
			if err != nil {
				log.Printf("Warning: Failed to make experiment %s available to all: %v", featureKey, err)
			}
			continue
		}

		if now.Before(experiment.StartDate) {
			continue
		}

		totalDuration := experiment.EndDate.Sub(experiment.StartDate)
		elapsed := now.Sub(experiment.StartDate)
		progress := float64(elapsed) / float64(totalDuration)

		var totalUsers int64
		if err := es.DB.Model(&models.User{}).Count(&totalUsers).Error; err != nil {
			log.Printf("Warning: Error counting users: %v", err)
			continue
		}

		userKey := fmt.Sprintf("%s%s", ExperimentUserPrefix, featureKey)
		currentUserCount, err := es.Client.SCard(userKey).Result()
		if err != nil {
			log.Printf("Warning: Error getting user count for experiment %s: %v", featureKey, err)
			continue
		}

		targetUserCount := int64(float64(experiment.InitialUserCount) +
			progress*(float64(totalUsers)-float64(experiment.InitialUserCount)))

		if targetUserCount > currentUserCount {
			usersToAdd := targetUserCount - currentUserCount
			log.Printf("Adding %d more users to experiment %s (progress: %.2f%%)",
				usersToAdd, featureKey, progress*100)

			err = es.assignAdditionalUsers(featureKey, int(usersToAdd))
			if err != nil {
				log.Printf("Warning: Error assigning additional users to experiment %s: %v", featureKey, err)
			}
		}
	}

	return nil
}

func (es *ExperimentalService) getActiveExperiments() ([]models.Experiment, error) {
	experimentsData, err := es.Client.HGetAll(ExperimentListKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get experiments: %w", err)
	}

	now := time.Now()
	activeExperiments := []models.Experiment{}

	for _, expData := range experimentsData {
		var experiment models.Experiment
		if err := json.Unmarshal([]byte(expData), &experiment); err != nil {
			continue
		}

		if now.After(experiment.StartDate) && now.Before(experiment.EndDate) {
			activeExperiments = append(activeExperiments, experiment)
		}
	}

	return activeExperiments, nil
}

func (es *ExperimentalService) assignInitialUsers(featureKey string, count int) error {
	var adminUserIDs []uint
	if err := es.DB.Model(&models.User{}).Where("staff_level = 4").Pluck("uid", &adminUserIDs).Error; err != nil {
		log.Printf("Warning: Error fetching admin users: %v", err)
	}

	var regularUserIDs []uint
	if err := es.DB.Model(&models.User{}).Where("staff_level < 4 OR staff_level IS NULL").Pluck("uid", &regularUserIDs).Error; err != nil {
		return fmt.Errorf("failed to get regular user IDs: %w", err)
	}

	userKey := fmt.Sprintf("%s%s", ExperimentUserPrefix, featureKey)
	adminCount := len(adminUserIDs)

	for _, uid := range adminUserIDs {
		err := es.Client.SAdd(userKey, uid).Err()
		if err != nil {
			log.Printf("Warning: Error adding admin user %d to experiment %s: %v", uid, featureKey, err)
		} else {
			log.Printf("Added admin user %d to experiment %s", uid, featureKey)
		}
	}

	regularUsersNeeded := count - adminCount
	if regularUsersNeeded <= 0 {
		log.Printf("All %d spots in experiment %s filled by admins", count, featureKey)
		return nil
	}

	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(regularUserIDs), func(i, j int) {
		regularUserIDs[i], regularUserIDs[j] = regularUserIDs[j], regularUserIDs[i]
	})

	if regularUsersNeeded > len(regularUserIDs) {
		regularUsersNeeded = len(regularUserIDs)
	}

	selectedRegularUsers := regularUserIDs[:regularUsersNeeded]
	for _, uid := range selectedRegularUsers {
		err := es.Client.SAdd(userKey, uid).Err()
		if err != nil {
			log.Printf("Warning: Error adding regular user %d to experiment %s: %v", uid, featureKey, err)
		}
	}

	log.Printf("Assigned %d users (%d admins + %d regular) to experiment %s",
		adminCount+regularUsersNeeded, adminCount, regularUsersNeeded, featureKey)
	return nil
}

func (es *ExperimentalService) assignAdditionalUsers(featureKey string, count int) error {
	var adminUserIDs []uint
	if err := es.DB.Model(&models.User{}).Where("staff_level = 4").Pluck("uid", &adminUserIDs).Error; err != nil {
		log.Printf("Warning: Error fetching admin users: %v", err)
	}

	userKey := fmt.Sprintf("%s%s", ExperimentUserPrefix, featureKey)

	adminsToAdd := []uint{}
	for _, adminUID := range adminUserIDs {
		isMember, err := es.Client.SIsMember(userKey, adminUID).Result()
		if err != nil {
			log.Printf("Warning: Error checking if admin %d is in experiment %s: %v", adminUID, featureKey, err)
			continue
		}

		if !isMember {
			adminsToAdd = append(adminsToAdd, adminUID)
		}
	}

	for _, adminUID := range adminsToAdd {
		err := es.Client.SAdd(userKey, adminUID).Err()
		if err != nil {
			log.Printf("Warning: Error adding admin user %d to experiment %s: %v", adminUID, featureKey, err)
		} else {
			log.Printf("Added admin user %d to experiment %s", adminUID, featureKey)
			count--
		}
	}

	if count <= 0 {
		log.Printf("All additional users for experiment %s filled by admins", featureKey)
		return nil
	}

	var allUserIDs []uint
	if err := es.DB.Model(&models.User{}).Where("staff_level < 4 OR staff_level IS NULL").Pluck("uid", &allUserIDs).Error; err != nil {
		return fmt.Errorf("failed to get user IDs: %w", err)
	}

	currentUsers, err := es.Client.SMembers(userKey).Result()
	if err != nil {
		return fmt.Errorf("failed to get current users: %w", err)
	}

	currentUserMap := make(map[uint]bool)
	for _, userIDStr := range currentUsers {
		var userID uint
		if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err == nil {
			currentUserMap[userID] = true
		}
	}

	eligibleUsers := []uint{}
	for _, uid := range allUserIDs {
		if !currentUserMap[uid] {
			eligibleUsers = append(eligibleUsers, uid)
		}
	}

	rand.Shuffle(len(eligibleUsers), func(i, j int) {
		eligibleUsers[i], eligibleUsers[j] = eligibleUsers[j], eligibleUsers[i]
	})

	if count > len(eligibleUsers) {
		count = len(eligibleUsers)
	}

	selectedUsers := eligibleUsers[:count]
	for _, uid := range selectedUsers {
		err := es.Client.SAdd(userKey, uid).Err()
		if err != nil {
			log.Printf("Warning: Error adding user %d to experiment %s: %v", uid, featureKey, err)
		}
	}

	log.Printf("Added %d regular users to experiment %s", count, featureKey)
	return nil
}

func (es *ExperimentalService) makeExperimentAvailableToAll(featureKey string) error {
	log.Printf("Making experiment %s available to all users", featureKey)

	var adminUserIDs []uint
	if err := es.DB.Model(&models.User{}).Where("staff_level = 4").Pluck("uid", &adminUserIDs).Error; err != nil {
		log.Printf("Warning: Error fetching admin users: %v", err)
	}

	userKey := fmt.Sprintf("%s%s", ExperimentUserPrefix, featureKey)
	for _, uid := range adminUserIDs {
		err := es.Client.SAdd(userKey, uid).Err()
		if err != nil {
			log.Printf("Warning: Error adding admin user %d to experiment %s: %v", uid, featureKey, err)
		}
	}

	const batchSize = 1000
	var offset int64 = 0

	for {
		var userBatch []uint
		if err := es.DB.Model(&models.User{}).Offset(int(offset)).Limit(batchSize).Pluck("uid", &userBatch).Error; err != nil {
			return fmt.Errorf("failed to get user IDs (batch %d): %w", offset, err)
		}

		if len(userBatch) == 0 {
			break
		}

		for _, uid := range userBatch {
			err := es.Client.SAdd(userKey, uid).Err()
			if err != nil {
				log.Printf("Warning: Error adding user %d to experiment %s: %v", uid, featureKey, err)
			}
		}

		offset += int64(len(userBatch))
		log.Printf("Added batch of %d users to experiment %s (total: %d)", len(userBatch), featureKey, offset)

		if len(userBatch) < batchSize {
			break
		}
	}

	log.Printf("Made experiment %s available to all users", featureKey)
	return nil
}

func (es *ExperimentalService) DeleteExperiment(featureKey string) error {
	err := es.Client.HDel(ExperimentListKey, featureKey).Err()
	if err != nil {
		return fmt.Errorf("failed to delete experiment: %w", err)
	}

	userKey := fmt.Sprintf("%s%s", ExperimentUserPrefix, featureKey)
	err = es.Client.Del(userKey).Err()
	if err != nil {
		log.Printf("Warning: Failed to delete user set for experiment %s: %v", featureKey, err)
	}

	log.Printf("Deleted experiment: %s", featureKey)
	return nil
}

func (es *ExperimentalService) ExperimentExists(featureKey string) (bool, error) {
	exists, err := es.Client.HExists(ExperimentListKey, featureKey).Result()
	if err != nil {
		return false, fmt.Errorf("failed to check if experiment exists: %w", err)
	}
	return exists, nil
}
