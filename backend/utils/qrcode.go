package utils

import "github.com/skip2/go-qrcode"

func GenerateQRCodeImage(URL string) ([]byte, error) {
	var png []byte
	png, err := qrcode.Encode(URL, qrcode.Medium, 256)
	if err != nil {
		return nil, err
	}
	return png, nil
}
