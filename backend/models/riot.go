package models

import "strings"

type ValorantRankData struct {
	Name   string `json:"name"`
	Tag    string `json:"tag"`
	Region string `json:"region"`
	Rank   string `json:"rank"`
	RR     int    `json:"rr"`
}

func ParseValorantName(username string) (string, string, error) {
	name := username[:strings.Index(username, "#")]
	tag := username[strings.Index(username, "#")+1:]

	return name, tag, nil
}
