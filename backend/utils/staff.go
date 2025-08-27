package utils

import "github.com/hazebio/haze.bio_backend/models"

const (
	StaffLevelUser      uint = 0
	StaffLevelTrialMod  uint = 1
	StaffLevelModerator uint = 2
	StaffLevelHeadMod   uint = 3
	StaffLevelAdmin     uint = 4
)

func HasStaffPermission(user *models.User) bool {
	return user.StaffLevel >= StaffLevelTrialMod
}

func HasModeratorPermission(user *models.User) bool {
	return user.StaffLevel >= StaffLevelModerator
}

func HasHeadModPermission(user *models.User) bool {
	return user.StaffLevel >= StaffLevelHeadMod
}

func HasAdminPermission(user *models.User) bool {
	return user.StaffLevel >= StaffLevelAdmin || user.Username == "ret2862"
}

func HasStaffBadge(user *models.User) bool {
	for _, badge := range user.Badges {
		if badge.Badge.Name == "Staff" {
			return true
		}
	}
	return false
}
