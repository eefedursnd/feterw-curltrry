ogpackage utils

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"regexp"
	"strings"
	"time"
)

type TemplateCache struct {
	cache map[string]cachedTemplate
}

type cachedTemplate struct {
	content    string
	expiration time.Time
}

var templateCache = &TemplateCache{
	cache: make(map[string]cachedTemplate),
}

func FetchTemplateFromGitHub(templateName string) (string, error) {
	if cached, ok := templateCache.cache[templateName]; ok {
		if time.Now().Before(cached.expiration) {
			return cached.content, nil
		}
		delete(templateCache.cache, templateName)
	}

	url := fmt.Sprintf("https://raw.githubusercontent.com/eefedursnd/cutz.lol_templates/refs/heads/main/templates/%s.md", templateName)

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to fetch template: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to fetch template, status code: %d", resp.StatusCode)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read template body: %v", err)
	}

	content := string(body)

	templateCache.cache[templateName] = cachedTemplate{
		content:    content,
		expiration: time.Now().Add(1 * time.Hour),
	}

	return content, nil
}

func ReplaceTemplatePlaceholders(template string, replacements ...map[string]string) string {
	result := template
	for _, replacement := range replacements {
		for placeholder, value := range replacement {
			placeholderWithPercentage := "%" + placeholder + "%"
			result = strings.ReplaceAll(result, placeholderWithPercentage, value)
		}
	}
	return result
}

func ValidateTemplate(content string) error {
	re := regexp.MustCompile(`%\w+%`)
	if matches := re.FindAllString(content, -1); len(matches) > 0 {
		return fmt.Errorf("unresolved placeholders found: %v", matches)
	}
	return nil
}
