package models

type Social struct {
	URL    string
	Usable bool
}

var socials = map[string]Social{
	"snapchat":  {URL: "https://snapchat.com/add/username", Usable: true},
	"youtube":   {URL: "https://youtube.com/@username", Usable: true},
	"discord":   {URL: "https://discord.com/users/id", Usable: true},
	"spotify":   {URL: "https://open.spotify.com/user/username", Usable: true},
	"instagram": {URL: "https://instagram.com/username", Usable: true},
	"tiktok":    {URL: "https://tiktok.com/@username", Usable: true},
	"telegram":  {URL: "https://t.me/username", Usable: true},
	"github":    {URL: "https://github.com/username", Usable: true},
	"roblox":    {URL: "https://www.roblox.com/users/id", Usable: true},
	"gitlab":    {URL: "https://gitlab.com/username", Usable: true},
	"twitch":    {URL: "https://twitch.tv/username", Usable: true},
	"namemc":    {URL: "https://namemc.com/profile/username", Usable: true},
	"steam":     {URL: "https://steamcommunity.com/id/username", Usable: true},
	"kick":      {URL: "https://kick.com/username", Usable: true},
	"x":         {URL: "https://x.com/username", Usable: true},
	"behance":   {URL: "https://behance.net/username", Usable: true},
	"litecoin":  {Usable: true},
	"bitcoin":   {Usable: true},
	"ethereum":  {Usable: true},
	"monero":    {Usable: true},
	"solana":    {Usable: true},
	"paypal":    {URL: "https://paypal.me/username", Usable: true},
	"reddit":    {URL: "https://reddit.com/user/username", Usable: true},
	"facebook":  {URL: "https://facebook.com/username", Usable: true},
	"ko-fi":     {URL: "https://ko-fi.com/username", Usable: true},
	"email":     {Usable: true},
	"pinterest": {URL: "https://pinterest.com/username", Usable: true},
	"custom":    {URL: "", Usable: true},
}

func GetSocials() map[string]Social {
	return socials
}
