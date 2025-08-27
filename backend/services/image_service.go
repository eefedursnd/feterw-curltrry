package services

import (
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"io"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/golang/freetype/truetype"
	"github.com/hazebio/haze.bio_backend/config"
	"github.com/hazebio/haze.bio_backend/models"
	"golang.org/x/image/font"
	"golang.org/x/image/math/fixed"
)

type ImageService struct {
	BaseURL string
}

func NewImageService() *ImageService {
	return &ImageService{
		BaseURL: config.R2PublicURL,
	}
}

func (is *ImageService) GenerateUserCard(user *models.User, profile *models.UserProfile) (string, error) {
	width := 1200
	height := 630
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	var bgDrawn bool
	if profile != nil && profile.BackgroundURL != "" {
		bgImg, err := loadImageFromURL(profile.BackgroundURL)
		if err == nil {
			bgBounds := bgImg.Bounds()
			bgWidth, bgHeight := bgBounds.Dx(), bgBounds.Dy()
			scaleX := float64(width) / float64(bgWidth)
			scaleY := float64(height) / float64(bgHeight)
			scale := scaleX
			if scaleY > scaleX {
				scale = scaleY
			}
			scaledWidth := int(float64(bgWidth) * scale)
			scaledHeight := int(float64(bgHeight) * scale)
			offsetX := (width - scaledWidth) / 2
			offsetY := (height - scaledHeight) / 2
			for y := 0; y < height; y++ {
				for x := 0; x < width; x++ {
					srcX := int(float64(x-offsetX) / scale)
					srcY := int(float64(y-offsetY) / scale)
					if srcX >= 0 && srcX < bgWidth && srcY >= 0 && srcY < bgHeight {
						img.Set(x, y, bgImg.At(srcX+bgBounds.Min.X, srcY+bgBounds.Min.Y))
					} else {
						if profile.BackgroundColor != "" {
							r, _ := strconv.ParseUint(profile.BackgroundColor[1:3], 16, 8)
							g, _ := strconv.ParseUint(profile.BackgroundColor[3:5], 16, 8)
							b, _ := strconv.ParseUint(profile.BackgroundColor[5:7], 16, 8)
							img.Set(x, y, color.RGBA{uint8(r), uint8(g), uint8(b), 255})
						} else {
							img.Set(x, y, color.RGBA{40, 40, 40, 255})
						}
					}
				}
			}
			bgDrawn = true
		}
	}
	if !bgDrawn {
		var bgColor color.RGBA
		if profile != nil && profile.BackgroundColor != "" && len(profile.BackgroundColor) >= 7 {
			r, _ := strconv.ParseUint(profile.BackgroundColor[1:3], 16, 8)
			g, _ := strconv.ParseUint(profile.BackgroundColor[3:5], 16, 8)
			b, _ := strconv.ParseUint(profile.BackgroundColor[5:7], 16, 8)
			bgColor = color.RGBA{uint8(r), uint8(g), uint8(b), 255}
		} else {
			bgColor = color.RGBA{40, 40, 40, 255}
		}
		for y := 0; y < height; y++ {
			for x := 0; x < width; x++ {
				img.Set(x, y, bgColor)
			}
		}
	}
	overlay := image.NewRGBA(image.Rect(0, 0, width, height))
	draw.Draw(overlay, overlay.Bounds(), image.NewUniform(color.RGBA{0, 0, 0, 120}), image.Point{}, draw.Src)
	draw.Draw(img, img.Bounds(), overlay, image.Point{}, draw.Over)
	poppinsRegular, _ := loadPoppinsFont("regular")
	poppinsBold, _ := loadPoppinsFont("bold")
	avatarSize := 320
	avatarX := width / 2
	avatarY := height/2 - 80

	if profile != nil && profile.AvatarURL != "" {
		avatarImg, err := loadImageFromURL(profile.AvatarURL)
		if err == nil {
			avatarRadius := 24

			if profile.AvatarShape == "rounded-full" {
				avatarRadius = avatarSize / 2
			} else if strings.HasPrefix(profile.AvatarShape, "rounded-") {
				radiusStr := strings.TrimPrefix(profile.AvatarShape, "rounded-")
				if radiusValue, err := strconv.Atoi(radiusStr); err == nil {
					avatarRadius = radiusValue * 4
				}
			}

			drawRoundedAvatar(img, avatarImg, avatarX-avatarSize/2, avatarY-avatarSize/2, avatarSize, avatarRadius)
		} else {
			avatarImg, err = loadImageFromURL(is.BaseURL + "/default_avatar.jpeg")
			if err != nil {
				return "", fmt.Errorf("failed to load default avatar: %w", err)
			}
			drawRoundedAvatar(img, avatarImg, avatarX-avatarSize/2, avatarY-avatarSize/2, avatarSize, avatarSize/2)
		}
	}
	displayNameSize := 64
	displayNameFace := truetype.NewFace(poppinsBold, &truetype.Options{Size: float64(displayNameSize), DPI: 96, Hinting: font.HintingFull})
	displayName := user.DisplayName
	if displayName == "" {
		displayName = user.Username
	}
	if len(displayName) > 20 {
		displayName = displayName[:17] + "..."
	}
	displayNameWidth := font.MeasureString(displayNameFace, displayName).Ceil()
	displayNameX := (width - displayNameWidth) / 2
	displayNameY := avatarY + avatarSize/2 + 80
	(&font.Drawer{Dst: img, Src: image.NewUniform(color.RGBA{0, 0, 0, 150}), Face: displayNameFace, Dot: fixed.P(displayNameX+2, displayNameY+2)}).DrawString(displayName)
	(&font.Drawer{Dst: img, Src: image.NewUniform(color.RGBA{255, 255, 255, 255}), Face: displayNameFace, Dot: fixed.P(displayNameX, displayNameY)}).DrawString(displayName)
	usernameSize := 36
	usernameFace := truetype.NewFace(poppinsRegular, &truetype.Options{Size: float64(usernameSize), DPI: 96, Hinting: font.HintingFull})
	username := "cutz.lol/" + user.Username
	usernameWidth := font.MeasureString(usernameFace, username).Ceil()
	usernameX := (width - usernameWidth) / 2
	usernameY := displayNameY + 70
	(&font.Drawer{Dst: img, Src: image.NewUniform(color.RGBA{0, 0, 0, 150}), Face: usernameFace, Dot: fixed.P(usernameX+2, usernameY+2)}).DrawString(username)
	(&font.Drawer{Dst: img, Src: image.NewUniform(color.RGBA{180, 180, 180, 255}), Face: usernameFace, Dot: fixed.P(usernameX, usernameY)}).DrawString(username)
	tmpDir := os.TempDir()
	outputPath := filepath.Join(tmpDir, fmt.Sprintf("user_card_%d_%d.png", user.UID, time.Now().Unix()))
	outputFile, err := os.Create(outputPath)
	if err != nil {
		return "", fmt.Errorf("failed to create output file: %w", err)
	}
	defer outputFile.Close()
	if err := png.Encode(outputFile, img); err != nil {
		return "", fmt.Errorf("failed to encode image: %w", err)
	}
	return outputPath, nil
}

func drawRoundedAvatar(dst draw.Image, src image.Image, x, y, size, radius int) {
	srcBounds := src.Bounds()
	srcWidth, srcHeight := srcBounds.Dx(), srcBounds.Dy()

	destRect := image.Rect(x, y, x+size, y+size)

	mask := image.NewRGBA(image.Rect(0, 0, size, size))

	scaleX := float64(size) / float64(srcWidth)
	scaleY := float64(size) / float64(srcHeight)
	scale := scaleX
	if scaleY < scaleX {
		scale = scaleY
	}

	scaledWidth := int(float64(srcWidth) * scale)
	scaledHeight := int(float64(srcHeight) * scale)
	offsetX := (size - scaledWidth) / 2
	offsetY := (size - scaledHeight) / 2

	for iy := 0; iy < size; iy++ {
		for ix := 0; ix < size; ix++ {
			mask.Set(ix, iy, color.RGBA{0, 0, 0, 0})
		}
	}

	fullRounded := radius >= size/2

	for iy := 0; iy < size; iy++ {
		for ix := 0; ix < size; ix++ {
			dx := float64(ix - size/2)
			dy := float64(iy - size/2)
			distance := math.Sqrt(dx*dx + dy*dy)

			if fullRounded {
				if distance <= float64(size/2) {
					srcX := int(float64(ix-offsetX) / scale)
					srcY := int(float64(iy-offsetY) / scale)

					if srcX >= 0 && srcX < srcWidth && srcY >= 0 && srcY < srcHeight {
						mask.Set(ix, iy, src.At(srcX+srcBounds.Min.X, srcY+srcBounds.Min.Y))
					}
				}
			} else {
				inRadius := false

				inCorner := false
				cornerX, cornerY := 0, 0

				if ix < radius && iy < radius {
					inCorner = true
					cornerX, cornerY = radius, radius
				} else if ix >= (size-radius) && iy < radius {
					inCorner = true
					cornerX, cornerY = size-radius, radius
				} else if ix < radius && iy >= (size-radius) {
					inCorner = true
					cornerX, cornerY = radius, size-radius
				} else if ix >= (size-radius) && iy >= (size-radius) {
					inCorner = true
					cornerX, cornerY = size-radius, size-radius
				}

				if inCorner {
					cornerDx := float64(ix - cornerX)
					cornerDy := float64(iy - cornerY)
					cornerDistance := math.Sqrt(cornerDx*cornerDx + cornerDy*cornerDy)

					if cornerDistance <= float64(radius) {
						inRadius = true
					}
				} else {
					inRadius = true
				}

				if inRadius {
					srcX := int(float64(ix-offsetX) / scale)
					srcY := int(float64(iy-offsetY) / scale)

					if srcX >= 0 && srcX < srcWidth && srcY >= 0 && srcY < srcHeight {
						mask.Set(ix, iy, src.At(srcX+srcBounds.Min.X, srcY+srcBounds.Min.Y))
					}
				}
			}
		}
	}

	draw.Draw(dst, destRect, mask, image.Point{0, 0}, draw.Over)
}

var fontCache = make(map[string][]byte)

func loadPoppinsFont(style string) (*truetype.Font, error) {
	capitalizedStyle := strings.ToUpper(style[:1]) + style[1:]
	if cachedFontData, ok := fontCache[capitalizedStyle]; ok {
		return truetype.Parse(cachedFontData)
	}
	url := fmt.Sprintf("https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-%s.ttf", capitalizedStyle)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	fontData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	fontCache[capitalizedStyle] = fontData
	return truetype.Parse(fontData)
}

func loadImageFromURL(url string) (image.Image, error) {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	img, _, err := image.Decode(resp.Body)
	if err != nil {
		return nil, err
	}
	return img, nil
}
