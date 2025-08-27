package utils

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

func NewLogger() *Logger {
	logDir := "./logs"
	if err := os.MkdirAll(logDir, os.ModePerm); err != nil {
		log.Fatal("Error creating log directory:", err)
	}

	logFile, err := os.OpenFile(fmt.Sprintf("%s/requests.log", logDir), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		log.Fatal("Error opening log file:", err)
	}

	fileLogger := log.New(logFile, "", log.LstdFlags)
	consoleLogger := log.New(os.Stdout, "", log.LstdFlags)

	env := os.Getenv("ENVIRONMENT")
	var logger *log.Logger
	if env == "development" {
		logger = log.New(io.MultiWriter(fileLogger.Writer(), consoleLogger.Writer()), "", log.LstdFlags)
	} else {
		logger = fileLogger
	}

	return &Logger{logger}
}

type Logger struct {
	*log.Logger
}

func (l *Logger) LogRequest(r *http.Request) {
	l.Printf("%s %s %s", r.Method, r.URL.Path, r.RemoteAddr)
}

func (l *Logger) LogResponse(statusCode int, duration time.Duration) {
	l.Printf("Completed %d in %v", statusCode, duration)
}
