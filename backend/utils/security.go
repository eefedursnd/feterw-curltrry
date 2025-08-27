package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	UserID       uint
	MFACompleted bool
	jwt.StandardClaims
}

func getAESKey() ([]byte, error) {
	hexKey := os.Getenv("ENCRYPTION_KEY")
	key, err := hex.DecodeString(hexKey) // Hex -> Bytes
	if err != nil {
		return nil, fmt.Errorf("invalid encryption key: %v", err)
	}
	if len(key) != 32 {
		return nil, fmt.Errorf("encryption key must be 32 bytes (got %d)", len(key))
	}
	return key, nil
}

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func CheckPassword(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func GenerateJWT(userID uint, secretKey string, mfaCompleted bool) (string, error) {
	claims := Claims{
		UserID:       userID,
		MFACompleted: mfaCompleted,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Hour * 24).Unix(),
		},
	}

	claimsJSON, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	encryptedClaims, err := encryptAES(string(claimsJSON))
	if err != nil {
		return "", err
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"data": encryptedClaims,
	})

	return token.SignedString([]byte(secretKey))
}

func ValidateToken(tokenString, secretKey string) (*Claims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(secretKey), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	encryptedClaims, ok := claims["data"].(string)
	if !ok {
		return nil, fmt.Errorf("missing encrypted claims")
	}

	decryptedJSON, err := decryptAES(encryptedClaims)
	if err != nil {
		return nil, err
	}

	var decryptedClaims Claims
	err = json.Unmarshal([]byte(decryptedJSON), &decryptedClaims)
	if err != nil {
		return nil, err
	}

	return &decryptedClaims, nil
}

func encryptAES(plaintext string) (string, error) {
	key, err := getAESKey()
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := aesGCM.Seal(nil, nonce, []byte(plaintext), nil)
	return base64.URLEncoding.EncodeToString(append(nonce, ciphertext...)), nil
}

func decryptAES(encryptedData string) (string, error) {
	key, err := getAESKey()
	if err != nil {
		return "", err
	}

	data, err := base64.URLEncoding.DecodeString(encryptedData)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := aesGCM.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("invalid data size")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]

	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

func Encode(obj interface{}) (string, error) {
	bytes, err := json.Marshal(obj)
	if err != nil {
		fmt.Printf("Error encoding object to JSON: %v", err)
		return "", err
	}
	return string(bytes), nil
}

func Decode(str string, obj interface{}) error {
	err := json.Unmarshal([]byte(str), obj)
	if err != nil {
		fmt.Printf("Error decoding JSON to object: %v", err)
		return err
	}
	return nil
}

func GenerateHash(input string) string {
	hash := sha256.New()
	hash.Write([]byte(input))
	return hex.EncodeToString(hash.Sum(nil))
}

func ShortenIPv6(ip string) string {
	if strings.Contains(ip, ":") {
		ip = strings.Join(strings.FieldsFunc(ip, func(r rune) bool { return r == ':' }), ":")
	}
	return ip
}

func MaskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return email
	}

	username := parts[0]
	domain := parts[1]

	if len(username) <= 2 {
		return username + "@" + domain
	}

	maskedUsername := username[0:2] + strings.Repeat("*", len(username)-2)
	return maskedUsername + "@" + domain
}
