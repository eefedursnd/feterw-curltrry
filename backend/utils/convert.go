package utils

import (
	"encoding/hex"
	"fmt"
	"math"
	"math/rand"
	"mime"
	"path/filepath"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"time"

	"golang.org/x/net/html"
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

func GenerateAESKey() (string, error) {
	key := make([]byte, 32) // 32 Bytes für AES-256
	_, err := rand.Read(key)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(key), nil
}

func GenerateRedeemCode() string {
	var prefixes = []string{
		"FOG", "MISTY", "CLOUD", "NEBULA", "HORIZON", "VORTEX",
		"TWILIGHT", "ECLIPSE", "AETHER", "SHIMMER", "OBSCURE", "PHANTOM",
		"WHISPER", "GLIMMER", "LUNAR", "NIGHTFALL", "WRAITH", "HALCYON",
		"STORM", "ZEPHYR", "AURORA", "DAWN", "GLOOM", "VEIL",
	}

	var suffixes = []string{
		"REALM", "NOVA", "DREAM", "ECHO", "SHADOW", "VEIL",
		"HORIZON", "OBLIVION", "MIRAGE", "SANCTUM", "VOID", "EMBER",
		"HALO", "RIFT", "SPECTER", "WHISPER", "DUSK", "CRYPT",
		"REQUIEM", "SERENITY", "FATHOM", "MAELSTROM", "NEXUS", "ELYSIUM",
	}

	randomBytes := make([]byte, 10)
	_, err := rand.Read(randomBytes)
	if err != nil {
		return "ERROR-ERROR-ERROR"
	}
	return fmt.Sprintf("%s-%s-%x",
		prefixes[rand.Intn(len(prefixes))],
		suffixes[rand.Intn(len(suffixes))],
		randomBytes)
}

func ParseTime(timeString string) time.Time {
	timeString = strings.Trim(timeString, "\"")

	loc, err := time.LoadLocation("Europe/Berlin")
	if err != nil {
		fmt.Printf("Error loading Europe/Berlin timezone: %v\n", err)
		return time.Time{}
	}

	layouts := []string{
		"2006-01-02 15:04",
		"2006-01-02 15:04:05",
	}

	for _, layout := range layouts {
		t, err := time.ParseInLocation(layout, timeString, loc)
		if err == nil {
			return t.UTC()
		}
	}

	fmt.Printf("Error parsing time '%s': %v\n", timeString, err)
	return time.Time{}
}

func ToLowerCase(str string) string {
	return strings.ToLower(str)
}

func IsPlainText(s string) bool {
	re := regexp.MustCompile(`^[a-zA-Z0-9\s]*$`)
	return re.MatchString(s)
}

func ContainsHTML(s string) bool {
	re := regexp.MustCompile(`<[^>]*>`)
	return re.MatchString(s)
}

func StripHTML(s string) string {
	var text strings.Builder
	tokenizer := html.NewTokenizer(strings.NewReader(s))
	var prevTokenType html.TokenType

	for {
		tokenType := tokenizer.Next()
		switch tokenType {
		case html.ErrorToken:
			err := tokenizer.Err()
			if err != nil {
				if err.Error() == "EOF" {
					return text.String()
				}
				fmt.Println("Error tokenizing HTML:", err)
				return ""
			}
			return text.String()
		case html.TextToken:
			text.WriteString(string(tokenizer.Text()))
		case html.StartTagToken, html.EndTagToken, html.SelfClosingTagToken, html.CommentToken, html.DoctypeToken:
			if prevTokenType == html.TextToken {
				text.WriteString(" ")
			}
		}
		prevTokenType = tokenType
	}
}

func IsMarkdownText(s string) bool {
	re := regexp.MustCompile(`^#+\s.*`)
	return re.MatchString(s)
}

func GenerateRandomNumericCode(length int) string {
	var code strings.Builder
	for i := 0; i < length; i++ {
		code.WriteString(strconv.Itoa(rand.Intn(10)))
	}
	return code.String()
}

func IsValidEmail(email string) bool {
	re := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return re.MatchString(email)
}

func GenerateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func FormatDate(date time.Time) string {
	return date.Format("2006-01-02 15:04") // YYYY-MM-DD HH:MM
}

func SliceToString(slice []string) string {
	if len(slice) == 0 {
		return ""
	}

	result := slice[0]
	for i := 1; i < len(slice); i++ {
		result += ", " + slice[i]
	}
	return result
}

func GetFieldValueByName(obj interface{}, fieldName string) interface{} {
	val := reflect.ValueOf(obj)

	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}

	if val.Kind() != reflect.Struct {
		return nil
	}

	fieldName = ToSnakeCase(fieldName)

	for i := 0; i < val.NumField(); i++ {
		typeField := val.Type().Field(i)

		tag := typeField.Tag.Get("json")
		if tag == "" {
			tag = ToSnakeCase(typeField.Name)
		}

		if strings.EqualFold(tag, fieldName) || strings.EqualFold(ToSnakeCase(typeField.Name), fieldName) {
			return val.Field(i).Interface()
		}
	}

	return nil
}

func ToSnakeCase(s string) string {
	var result strings.Builder
	for i, r := range s {
		if i > 0 && r >= 'A' && r <= 'Z' {
			result.WriteRune('_')
		}
		result.WriteRune(r)
	}
	return strings.ToLower(result.String())
}

func MaskUsername(username string) string {
	if len(username) <= 3 {
		return "***"
	}

	visible := int(math.Min(3, float64(len(username)/2)))
	return username[:visible] + strings.Repeat("*", len(username)-visible)
}
