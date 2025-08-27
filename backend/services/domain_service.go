package services

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/hazebio/haze.bio_backend/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type DomainService struct {
	DB          *gorm.DB
	UserService *UserService
}

func NewDomainService(db *gorm.DB, userService *UserService) *DomainService {
	return &DomainService{
		DB:          db,
		UserService: userService,
	}
}

func (ds *DomainService) AddDomain(domain *models.Domain) error {
	if domain.ID == "" || domain.Name == "" {
		return errors.New("domain ID and Name cannot be empty")
	}

	domain.ID = strings.ToLower(strings.ReplaceAll(domain.ID, ".", "-"))

	if domain.ExpiresAt.IsZero() {
		domain.ExpiresAt = time.Now().AddDate(1, 0, 0)
	}

	var existingDomain models.Domain
	if err := ds.DB.Where("id = ? OR name = ?", domain.ID, domain.Name).First(&existingDomain).Error; err == nil {
		return errors.New("domain already exists")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("error checking domain existence: %w", err)
	}

	if err := ds.DB.Create(domain).Error; err != nil {
		return fmt.Errorf("error saving domain: %w", err)
	}

	return nil
}

func (ds *DomainService) GetDomain(domainID string) (*models.Domain, error) {
	domainID = strings.ToLower(strings.ReplaceAll(domainID, ".", "-"))

	var domain models.Domain
	if err := ds.DB.Where("id = ?", domainID).First(&domain).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("domain not found")
		}
		return nil, fmt.Errorf("error retrieving domain: %w", err)
	}

	return &domain, nil
}

func (ds *DomainService) UpdateDomain(domain *models.Domain) error {
	if domain.ID == "" {
		return errors.New("domain ID cannot be empty")
	}

	var existingDomain models.Domain
	if err := ds.DB.Where("id = ?", domain.ID).First(&existingDomain).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("domain not found")
		}
		return fmt.Errorf("error retrieving domain: %w", err)
	}

	if err := ds.DB.Save(domain).Error; err != nil {
		return fmt.Errorf("error updating domain: %w", err)
	}

	return nil
}

func (ds *DomainService) DeleteDomain(domainID string) error {
	tx := ds.DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	if err := tx.Where("domain_id = ?", domainID).Delete(&models.DomainAssignment{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("error deleting domain assignments: %w", err)
	}

	if err := tx.Where("id = ?", domainID).Delete(&models.Domain{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("error deleting domain: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("error committing changes: %w", err)
	}

	return nil
}

func (ds *DomainService) GetAllDomains() ([]*models.Domain, error) {
	var domains []*models.Domain
	if err := ds.DB.Find(&domains).Error; err != nil {
		return nil, fmt.Errorf("error retrieving all domains: %w", err)
	}

	return domains, nil
}

func (ds *DomainService) GetAvailableDomains(uid uint) ([]*models.Domain, error) {
	user, err := ds.UserService.GetUserByUID(uid)
	if err != nil {
		return nil, fmt.Errorf("error retrieving user: %w", err)
	}

	isPremium := user.HasActivePremiumSubscription()

	var domains []*models.Domain
	query := ds.DB

	if !isPremium {
		query = query.Where("only_premium = ?", false)
	}

	var assignedDomainIDs []string
	if err := ds.DB.Model(&models.DomainAssignment{}).Where("uid = ?", uid).Pluck("domain_id", &assignedDomainIDs).Error; err != nil {
		return nil, fmt.Errorf("error retrieving assigned domains: %w", err)
	}
	if len(assignedDomainIDs) > 0 {
		query = query.Where("id NOT IN ?", assignedDomainIDs)
	}

	if err := query.Where("max_usage = 0 OR current_usage < max_usage").
		Where("expires_at > ?", time.Now()).
		Find(&domains).Error; err != nil {
		return nil, fmt.Errorf("error retrieving available domains: %w", err)
	}

	return domains, nil
}

func (ds *DomainService) IsDomainExpiringSoon(domainID string) (bool, error) {
	var domain models.Domain
	if err := ds.DB.Where("id = ?", domainID).First(&domain).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, errors.New("domain not found")
		}
		return false, fmt.Errorf("error retrieving domain: %w", err)
	}

	return time.Until(domain.ExpiresAt) < 14*24*time.Hour, nil
}

func (ds *DomainService) HasUserSelectedDomain(username string, domainName string) (bool, error) {
	log.Println("Checking if user has selected domain:", username, domainName)
	user, err := ds.UserService.GetUserByUsernameOrAlias(username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, errors.New("user not found")
		}
		return false, fmt.Errorf("error retrieving user: %w", err)
	}

	var domain models.Domain
	if err := ds.DB.Where("name = ?", domainName).First(&domain).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, errors.New("domain not found")
		}
		return false, fmt.Errorf("error retrieving domain: %w", err)
	}

	var count int64
	if err := ds.DB.Model(&models.DomainAssignment{}).
		Where("uid = ? AND domain_id = ?", user.UID, domain.ID).
		Count(&count).Error; err != nil {
		return false, fmt.Errorf("error checking domain assignment: %w", err)
	}

	return count > 0, nil
}

func (ds *DomainService) AssignDomainToUser(uid uint, domainID string) error {
	tx := ds.DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	user, err := ds.UserService.GetUserByUID(uid)
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("error retrieving user: %w", err)
	}

	var domain models.Domain
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", domainID).First(&domain).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("domain not found")
		}
		return fmt.Errorf("error retrieving domain: %w", err)
	}

	if domain.ExpiresAt.Before(time.Now()) {
		tx.Rollback()
		return errors.New("domain has expired")
	}

	isPremium := user.HasActivePremiumSubscription()

	if domain.OnlyPremium && !isPremium {
		tx.Rollback()
		return errors.New("this domain is only available for premium users")
	}

	if domain.MaxUsage > 0 && domain.CurrentUsage >= domain.MaxUsage {
		tx.Rollback()
		return errors.New("this domain has reached its maximum usage capacity")
	}

	var currentAssignmentsCount int64
	if err := tx.Model(&models.DomainAssignment{}).Where("uid = ?", uid).Count(&currentAssignmentsCount).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("error checking current assignments: %w", err)
	}

	if !isPremium && currentAssignmentsCount >= 1 {
		tx.Rollback()
		return errors.New("standard users can only assign one domain")
	}
	if isPremium && currentAssignmentsCount >= 2 {
		tx.Rollback()
		return errors.New("premium users can assign a maximum of two domains")
	}

	var existingUserAssignment models.DomainAssignment
	if err := tx.Where("uid = ? AND domain_id = ?", uid, domainID).First(&existingUserAssignment).Error; err == nil {
		tx.Rollback()
		return errors.New("user already has this domain assigned")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		tx.Rollback()
		return fmt.Errorf("error checking existing user assignment: %w", err)
	}

	assignment := &models.DomainAssignment{
		UID:        uid,
		DomainID:   domainID,
		AssignedAt: time.Now(),
	}

	if err := tx.Create(assignment).Error; err != nil {
		tx.Rollback()
		if strings.Contains(err.Error(), "UNIQUE constraint failed") || strings.Contains(err.Error(), "Duplicate entry") {
			return errors.New("user already has this domain assigned")
		}
		return fmt.Errorf("error saving assignment: %w", err)
	}

	domain.CurrentUsage++
	if err := tx.Save(&domain).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("error updating domain usage: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("error committing changes: %w", err)
	}

	return nil
}

func (ds *DomainService) RemoveDomainFromUser(uid uint, domainID string) error {
	tx := ds.DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	var assignment models.DomainAssignment
	if err := tx.Where("uid = ? AND domain_id = ?", uid, domainID).First(&assignment).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("assignment not found for this user and domain")
		}
		return fmt.Errorf("error retrieving assignment: %w", err)
	}

	if err := tx.Delete(&assignment).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("error deleting assignment: %w", err)
	}

	var domain models.Domain
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", domainID).First(&domain).Error; err == nil {
		if domain.CurrentUsage > 0 {
			domain.CurrentUsage--
			if err := tx.Save(&domain).Error; err != nil {
				fmt.Printf("Warning: Failed to decrement domain usage for %s: %v\n", domainID, err)
			}
		}
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		fmt.Printf("Warning: Could not find domain %s to decrement usage: %v\n", domainID, err)
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("error committing changes: %w", err)
	}

	return nil
}

func (ds *DomainService) GetUserDomains(uid uint) ([]*models.DomainAssignment, error) {
	var assignments []*models.DomainAssignment
	if err := ds.DB.Where("uid = ?", uid).Find(&assignments).Error; err != nil {
		return nil, fmt.Errorf("error retrieving user domains: %w", err)
	}

	return assignments, nil
}

func (ds *DomainService) IsUserAuthorized(domainName string, username string) (bool, uint, error) {
	var domain models.Domain
	if err := ds.DB.Where("name = ?", domainName).First(&domain).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, 0, errors.New("domain not found")
		}
		return false, 0, fmt.Errorf("error retrieving domain: %w", err)
	}

	if domain.ExpiresAt.Before(time.Now()) {
		return false, 0, errors.New("domain has expired")
	}

	user, err := ds.UserService.GetUserByUsername(username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, 0, errors.New("user not found")
		}
		return false, 0, fmt.Errorf("error retrieving user: %w", err)
	}

	var assignment models.DomainAssignment
	if err := ds.DB.Where("uid = ? AND domain_id = ?", user.UID, domain.ID).First(&assignment).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, 0, nil
		}
		return false, 0, fmt.Errorf("error retrieving assignment: %w", err)
	}

	return true, assignment.UID, nil
}

func (ds *DomainService) GetDomainWithAssignments(domainID string) (*models.Domain, []*models.DomainAssignment, error) {
	domain, err := ds.GetDomain(domainID)
	if err != nil {
		return nil, nil, err
	}

	var assignments []*models.DomainAssignment
	if err := ds.DB.Where("domain_id = ?", domainID).Find(&assignments).Error; err != nil {
		return nil, nil, fmt.Errorf("error retrieving assignments: %w", err)
	}

	return domain, assignments, nil
}

func (ds *DomainService) RenewDomain(domainID string, duration time.Duration) error {
	var domain models.Domain
	if err := ds.DB.Where("id = ?", domainID).First(&domain).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("domain not found")
		}
		return fmt.Errorf("error retrieving domain: %w", err)
	}

	if domain.ExpiresAt.Before(time.Now()) {
		domain.ExpiresAt = time.Now().Add(duration)
	} else {
		domain.ExpiresAt = domain.ExpiresAt.Add(duration)
	}

	if err := ds.DB.Save(&domain).Error; err != nil {
		return fmt.Errorf("error updating domain: %w", err)
	}

	return nil
}

func (ds *DomainService) CleanupExpiredDomains() error {
	tx := ds.DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	var expiredDomains []*models.Domain
	if err := tx.Where("expires_at < ?", time.Now()).Find(&expiredDomains).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("error retrieving expired domains: %w", err)
	}

	if len(expiredDomains) == 0 {
		tx.Rollback()
		return nil
	}

	expiredDomainIDs := make([]string, len(expiredDomains))
	for i, domain := range expiredDomains {
		expiredDomainIDs[i] = domain.ID
	}

	if err := tx.Where("domain_id IN ?", expiredDomainIDs).Delete(&models.DomainAssignment{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("error deleting assignments for expired domains: %w", err)
	}

	if err := tx.Model(&models.Domain{}).Where("id IN ?", expiredDomainIDs).Update("current_usage", 0).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("error resetting usage for expired domains: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("error committing changes: %w", err)
	}

	return nil
}
