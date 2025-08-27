package models

type GitHubUser struct {
	Login     string `json:"login"`
	AvatarURL string `json:"avatar_url"`
	Followers int    `json:"followers"`
	Repos     int    `json:"public_repos"`
}
