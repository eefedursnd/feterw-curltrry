package models

type Stats struct {
	Users         int   `json:"users"`
	Premium       int   `json:"premium"`
	TotalViews    int64 `json:"total_views"`
	DiscordLinked int   `json:"discord_linked"`
}
