package utils

import (
	"regexp"
	"strconv"
	"time"
)

func StringToInt(str string) int {
	i, err := strconv.Atoi(str)
	if err != nil {
		return 0
	}
	return i
}

func IsMarkdownText(s string) bool {
	re := regexp.MustCompile(`^#+\s.*`)
	return re.MatchString(s)
}

func GetCurrentDate() string {
	return time.Now().Format("2006-01-02 15:04:05")
}
