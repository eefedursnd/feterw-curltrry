package main

import (
	"fmt"

	"github.com/hazebio/haze.bio_payment/app"
	"github.com/hazebio/haze.bio_payment/config"
)

func main() {
	if err := config.LoadConfig(); err != nil {
		fmt.Println(err)
		return
	}

	if err := app.StartServer(); err != nil {
		fmt.Println(err)
	}
}
