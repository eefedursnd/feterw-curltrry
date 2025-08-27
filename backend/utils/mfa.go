package utils

import "github.com/pquerna/otp/totp"

func GenerateMFA(username string) (string, string, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "haze.bio",
		AccountName: username,
	})
	if err != nil {
		return "", "", err
	}
	return key.Secret(), key.URL(), nil
}

func ValidateMFA(secret, code string) bool {
	return totp.Validate(code, secret)
}
