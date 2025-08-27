package utils

import (
	"mime"
	"path/filepath"
	"strconv"
	"strings"
)

func StringToInt(str string) int {
	i, err := strconv.Atoi(str)
	if err != nil {
		return 0
	}
	return i
}

func StringToUint(str string) uint {
	i, err := strconv.Atoi(str)
	if err != nil {
		return 0
	}
	return uint(i)
}

func UintToString(i uint) string {
	return strconv.Itoa(int(i))
}

func IntToString(i int) string {
	return strconv.Itoa(i)
}

func StringToBool(str string) bool {
	b, err := strconv.ParseBool(str)
	if err != nil {
		return false
	}
	return b
}

func GetContentType(filename string) string {
	mimeTypes := map[string]string{
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".gif":  "image/gif",
		".pdf":  "application/pdf",
		".doc":  "application/msword",
		".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".txt":  "text/plain",
	}

	ext := strings.ToLower(filepath.Ext(filename))
	if val, ok := mimeTypes[ext]; ok {
		return val
	}

	if mimeType := mime.TypeByExtension(ext); mimeType != "" {
		return mimeType
	}

	return "application/octet-stream"
}

func GetFileExtension(filename string) string {
	return strings.ToLower(filepath.Ext(filename))
}
