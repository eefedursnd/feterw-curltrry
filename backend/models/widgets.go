package models

var ValidWidgetTypes = map[string]bool{
	"discord_presence": true,
	"discord_server":   true,
	"github_profile":   true,
	"valorant_stats":   true,
	"audio_player":     true,
	"spotify":          true,
	"button":           true,
}

func IsValidWidgetType(widgetType string) bool {
	_, ok := ValidWidgetTypes[widgetType]
	return ok
}
