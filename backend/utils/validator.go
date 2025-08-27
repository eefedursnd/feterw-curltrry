package utils

import (
	"errors"
	"strconv"
	"strings"
)

type ValidationOptions struct {
	MinLength         int
	MaxLength         int
	AllowSpaces       bool
	AllowNonPlainText bool
	ReservedWords     []string
}

func Validate(input string, validateType string, options ValidationOptions) error {
	reservedUsernames := []string{"dashboard", "login", "analytics", "register", "easter", "legal", "moderation", "report", "reports", "users", "admin", "api", "static", "user", "profile", "settings", "logout", "home", "explore", "about", "contact", "help", "terms", "privacy", "blog", "news", "status", "pricing", "team", "jobs", "careers", "press", "partners", "developers"}

	if options.ReservedWords != nil {
		reservedUsernames = options.ReservedWords
	}

	inputLower := ToLowerCase(input)

	if len(input) < options.MinLength || len(input) > options.MaxLength {
		return errors.New(validateType + " must be between " + strconv.Itoa(options.MinLength) + " and " + strconv.Itoa(options.MaxLength) + " characters")
	}

	if !options.AllowSpaces && strings.Contains(input, " ") {
		return errors.New(validateType + " cannot contain spaces")
	}

	if !options.AllowNonPlainText && !IsPlainText(input) {
		return errors.New(validateType + " must be plain text")
	}

	for _, reserved := range reservedUsernames {
		if inputLower == reserved {
			return errors.New(validateType + " is a reserved word")
		}
		if strings.Contains(inputLower, reserved) {
			return errors.New(validateType + " contains a reserved word")
		}
	}

	return nil
}
