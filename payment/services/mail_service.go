package services

import (
	"log"
	"net/smtp"

	"github.com/hazebio/haze.bio_payment/config"
	"github.com/hazebio/haze.bio_payment/utils"
	"github.com/jordan-wright/email"
	"github.com/russross/blackfriday/v2"
)

type MailService struct {
}

func NewMailService() *MailService {
	return &MailService{}
}

type EmailContent struct {
	From    string            `json:"from"`
	To      string            `json:"to"`
	Subject string            `json:"subject"`
	Body    string            `json:"body"`
	Data    map[string]string `json:"data,omitempty"`
}

func (ms *MailService) SendTemplateEmail(content *EmailContent) error {
	templateContent, err := utils.FetchTemplateFromGitHub(content.Body)
	if err != nil {
		return err
	}

	emailBody := utils.ReplaceTemplatePlaceholders(string(templateContent), content.Data)

	if utils.IsMarkdownText(emailBody) {
		emailBody = string(blackfriday.Run([]byte(emailBody)))
	}

	emailToSend := &EmailContent{
		To:      content.To,
		Subject: content.Subject,
		Body:    emailBody,
	}

	return ms.SendEmail(emailToSend)
}

func (ms *MailService) SendEmail(content *EmailContent) error {
	e := email.NewEmail()
	e.From = ms.formatFromAddress()
	e.To = []string{content.To}
	e.Subject = content.Subject
	e.HTML = []byte(content.Body)

	if err := e.Send(ms.formatSMTPServer(), ms.createSMTPAuth()); err != nil {
		log.Printf("Error sending email: %v", err)
		return err
	}

	return nil
}

func (ms *MailService) formatFromAddress() string {
	return "Support <" + config.SMTPUsername + ">"
}

func (ms *MailService) formatSMTPServer() string {
	return config.SMTPHost + ":" + config.SMTPPort
}

func (ms *MailService) createSMTPAuth() smtp.Auth {
	return smtp.PlainAuth(
		"",
		config.SMTPUsername,
		config.SMTPPassword,
		config.SMTPHost,
	)
}
