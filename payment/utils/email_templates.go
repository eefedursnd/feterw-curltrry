package utils

import "fmt"

// EmailTemplateService provides email templates as embedded strings
type EmailTemplateService struct{}

// NewEmailTemplateService creates a new email template service
func NewEmailTemplateService() *EmailTemplateService {
	return &EmailTemplateService{}
}

// GetTemplate returns the email template content by name
func (ets *EmailTemplateService) GetTemplate(templateName string) (string, error) {
	switch templateName {
	case "verify_email":
		return ets.getVerifyEmailTemplate(), nil
	case "password_reset":
		return ets.getPasswordResetTemplate(), nil
	case "data_export":
		return ets.getDataExportTemplate(), nil
	case "punishment_notification":
		return ets.getPunishmentNotificationTemplate(), nil
	case "application_status":
		return ets.getApplicationStatusTemplate(), nil
	case "welcome":
		return ets.getWelcomeTemplate(), nil
	default:
		return "", fmt.Errorf("template '%s' not found", templateName)
	}
}

// getVerifyEmailTemplate returns the email verification template
func (ets *EmailTemplateService) getVerifyEmailTemplate() string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email Address</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0a0a0a;
            margin: 0;
            padding: 20px;
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .header {
            background: #4c1d95;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #ffffff;
        }
        .content {
            padding: 40px 30px;
        }
        .intro-text {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #ffffff;
        }
        .button {
            display: inline-block;
            background: #4c1d95;
            color: #ffffff;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .fallback-text {
            font-size: 14px;
            color: #ffffff;
            margin: 20px 0 10px 0;
        }
        .fallback-url {
            background-color: #2a2a2a;
            padding: 15px;
            border-radius: 6px;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #ffffff;
            border: 1px solid #3a3a3a;
        }
        .expiration-notice {
            font-size: 14px;
            color: #ffffff;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #3a3a3a;
        }
        .footer {
            background-color: #0f0f0f;
            padding: 30px;
            text-align: center;
        }
        .help-links {
            margin-bottom: 20px;
        }
        .help-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
        }
        .help-links a:hover {
            text-decoration: underline;
        }
        .legal-links {
            margin-bottom: 15px;
        }
        .legal-links a {
            color: #ffffff;
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
        }
        .legal-links a:hover {
            text-decoration: underline;
        }
        .copyright {
            font-size: 12px;
            color: #808080;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Email Address</h1>
        </div>
        
        <div class="content">
            <p class="intro-text">
                Thanks for signing up for cutz.lol! To complete your registration, please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center;">
                <a href="https://cutz.lol/verify?token=%Code%" class="button">
                    Verify My Email
                </a>
            </div>
            
            <p class="fallback-text">
                If the button above doesn't work, copy and paste this URL into your browser:
            </p>
            
            <div class="fallback-url">
                https://cutz.lol/verify?token=%Code%
            </div>
            
            <p class="expiration-notice">
                This verification link will expire in 24 hours. If you didn't sign up for cutz.lol, you can safely ignore this email.
            </p>
        </div>
        
        <div class="footer">
            <div class="help-links">
                Need help? Contact us via <a href="https://discord.gg/cutz">Discord</a> or email <a href="mailto:help@cutz.lol">help@cutz.lol</a>
            </div>
            
            <div class="legal-links">
                <a href="https://cutz.lol/terms">Terms</a>
                <a href="https://cutz.lol/privacy">Privacy</a>
            </div>
            
            <div class="copyright">
                © 2025 cutz.lol. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>`
}

// getPasswordResetTemplate returns the password reset template
func (ets *EmailTemplateService) getPasswordResetTemplate() string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0a0a0a;
            margin: 0;
            padding: 20px;
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .header {
            background: #4c1d95;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #ffffff;
        }
        .content {
            padding: 40px 30px;
        }
        .intro-text {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #ffffff;
        }
        .button {
            display: inline-block;
            background: #4c1d95;
            color: #ffffff;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .fallback-text {
            font-size: 14px;
            color: #ffffff;
            margin: 20px 0 10px 0;
        }
        .fallback-url {
            background-color: #2a2a2a;
            padding: 15px;
            border-radius: 6px;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #ffffff;
            border: 1px solid #3a3a3a;
        }
        .expiration-notice {
            font-size: 14px;
            color: #ffffff;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #3a3a3a;
        }
        .footer {
            background-color: #0f0f0f;
            padding: 30px;
            text-align: center;
        }
        .help-links {
            margin-bottom: 20px;
        }
        .help-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
        }
        .help-links a:hover {
            text-decoration: underline;
        }
        .legal-links {
            margin-bottom: 15px;
        }
        .legal-links a {
            color: #ffffff;
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
        }
        .legal-links a:hover {
            text-decoration: underline;
        }
        .copyright {
            font-size: 12px;
            color: #808080;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        
        <div class="content">
            <p class="intro-text">
                You requested a password reset for your cutz.lol account. Click the button below to reset your password.
            </p>
            
                         <div style="text-align: center;">
                 <a href="%ResetLink%" class="button">
                     Reset Password
                 </a>
             </div>
             
             <p class="fallback-text">
                 If the button above doesn't work, copy and paste this URL into your browser:
             </p>
             
             <div class="fallback-url">
                 %ResetLink%
             </div>
            
            <p class="expiration-notice">
                This reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
        </div>
        
        <div class="footer">
            <div class="help-links">
                Need help? Contact us via <a href="https://discord.gg/cutz">Discord</a> or email <a href="mailto:help@cutz.lol">help@cutz.lol</a>
            </div>
            
            <div class="legal-links">
                <a href="https://cutz.lol/terms">Terms</a>
                <a href="https://cutz.lol/privacy">Privacy</a>
            </div>
            
            <div class="copyright">
                © 2025 cutz.lol. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>`
}

// getDataExportTemplate returns the data export template
func (ets *EmailTemplateService) getDataExportTemplate() string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Data Export is Ready</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0a0a0a;
            margin: 0;
            padding: 20px;
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #ffffff;
        }
        .content {
            padding: 40px 30px;
        }
        .intro-text {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #e0e0e0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background-color: #0f0f0f;
            padding: 30px;
            text-align: center;
        }
        .help-links {
            margin-bottom: 20px;
        }
        .help-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
        }
        .help-links a:hover {
            text-decoration: underline;
        }
        .legal-links {
            margin-bottom: 15px;
        }
        .legal-links a {
            color: #ffffff;
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
        }
        .legal-links a:hover {
            text-decoration: underline;
        }
        .copyright {
            font-size: 12px;
            color: #808080;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Data Export is Ready</h1>
        </div>
        
        <div class="content">
            <p class="intro-text">
                Your cutz.lol data export has been prepared and is ready for download. This export contains all your personal data stored on our platform.
            </p>
            
            <div style="text-align: center;">
                <a href="%DownloadURL%" class="button">
                    Download Your Data
                </a>
            </div>
            
            <p style="font-size: 14px; color: #b0b0b0; margin-top: 30px;">
                This download link will expire in 24 hours. Please treat this information confidentially and do not share it with third parties.
            </p>
        </div>
        
        <div class="footer">
            <div class="help-links">
                Need help? Contact us via <a href="https://discord.gg/cutz">Discord</a> or email <a href="mailto:help@cutz.lol">help@cutz.lol</a>
            </div>
            
            <div class="legal-links">
                <a href="https://cutz.lol/terms">Terms</a>
                <a href="https://cutz.lol/privacy">Privacy</a>
            </div>
            
            <div class="copyright">
                © 2025 cutz.lol. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>`
}

// getPunishmentNotificationTemplate returns the punishment notification template
func (ets *EmailTemplateService) getPunishmentNotificationTemplate() string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Action Notification</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0a0a0a;
            margin: 0;
            padding: 20px;
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #ffffff;
        }
        .content {
            padding: 40px 30px;
        }
        .intro-text {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #e0e0e0;
        }
        .footer {
            background-color: #0f0f0f;
            padding: 30px;
            text-align: center;
        }
        .help-links {
            margin-bottom: 20px;
        }
        .help-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
        }
        .help-links a:hover {
            text-decoration: underline;
        }
        .legal-links {
            margin-bottom: 15px;
        }
        .legal-links a {
            color: #ffffff;
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
        }
        .legal-links a:hover {
            text-decoration: underline;
        }
        .copyright {
            font-size: 12px;
            color: #808080;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Account Action Notification</h1>
        </div>
        
        <div class="content">
            <p class="intro-text">
                %Message%
            </p>
            
            <p style="font-size: 14px; color: #b0b0b0;">
                If you believe this action was taken in error, please contact our support team.
            </p>
        </div>
        
        <div class="footer">
            <div class="help-links">
                Need help? Contact us via <a href="https://discord.gg/cutz">Discord</a> or email <a href="mailto:help@cutz.lol">help@cutz.lol</a>
            </div>
            
            <div class="legal-links">
                <a href="https://cutz.lol/terms">Terms</a>
                <a href="https://cutz.lol/privacy">Privacy</a>
            </div>
            
            <div class="copyright">
                © 2025 cutz.lol. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>`
}

// getApplicationStatusTemplate returns the application status template
func (ets *EmailTemplateService) getApplicationStatusTemplate() string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Status Update</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0a0a0a;
            margin: 0;
            padding: 20px;
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #ffffff;
        }
        .content {
            padding: 40px 30px;
        }
        .intro-text {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #e0e0e0;
        }
        .footer {
            background-color: #0f0f0f;
            padding: 30px;
            text-align: center;
        }
        .help-links {
            margin-bottom: 20px;
        }
        .help-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
        }
        .help-links a:hover {
            text-decoration: underline;
        }
        .legal-links {
            margin-bottom: 15px;
        }
        .legal-links a {
            color: #ffffff;
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
        }
        .legal-links a:hover {
            text-decoration: underline;
        }
        .copyright {
            font-size: 12px;
            color: #808080;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Application Status Update</h1>
        </div>
        
        <div class="content">
            <p class="intro-text">
                %Message%
            </p>
        </div>
        
        <div class="footer">
            <div class="help-links">
                Need help? Contact us via <a href="https://discord.gg/cutz">Discord</a> or email <a href="mailto:help@cutz.lol">help@cutz.lol</a>
            </div>
            
            <div class="legal-links">
                <a href="https://cutz.lol/terms">Terms</a>
                <a href="https://cutz.lol/privacy">Privacy</a>
            </div>
            
            <div class="copyright">
                © 2025 cutz.lol. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>`
}

// getWelcomeTemplate returns the welcome email template
func (ets *EmailTemplateService) getWelcomeTemplate() string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to cutz.lol!</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0a0a0a;
            margin: 0;
            padding: 20px;
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .header {
            background: #4c1d95;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #ffffff;
        }
        .content {
            padding: 40px 30px;
        }
        .intro-text {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #ffffff;
        }
        .button {
            display: inline-block;
            background: #4c1d95;
            color: #ffffff;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .features {
            margin: 30px 0;
        }
        .feature {
            background-color: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #4c1d95;
        }
        .feature h3 {
            margin: 0 0 10px 0;
            color: #ffffff;
            font-size: 18px;
        }
        .feature p {
            margin: 0;
            color: #cccccc;
            font-size: 14px;
        }
        .footer {
            background-color: #0f0f0f;
            padding: 30px;
            text-align: center;
        }
        .help-links {
            margin-bottom: 20px;
        }
        .help-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
        }
        .help-links a:hover {
            text-decoration: underline;
        }
        .legal-links {
            margin-bottom: 15px;
        }
        .legal-links a {
            color: #ffffff;
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
        }
        .legal-links a:hover {
            text-decoration: underline;
        }
        .copyright {
            font-size: 12px;
            color: #808080;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to cutz.lol!</h1>
        </div>
        
        <div class="content">
            <p class="intro-text">
                Welcome to cutz.lol, %Username%! 🎉<br><br>
                We're excited to have you join our community. Your account has been successfully created and verified.
            </p>
            
            <div style="text-align: center;">
                <a href="https://cutz.lol/dashboard" class="button">
                    Go to Dashboard
                </a>
            </div>
            
            <div class="features">
                <h3 style="color: #ffffff; margin-bottom: 20px;">What you can do now:</h3>
                
                <div class="feature">
                    <h3>🎨 Customize Your Profile</h3>
                    <p>Add your avatar, background, and customize your profile to make it uniquely yours.</p>
                </div>
                
                <div class="feature">
                    <h3>🔗 Add Social Links</h3>
                    <p>Connect your social media accounts and share your profile with the world.</p>
                </div>
                
                <div class="feature">
                    <h3>📊 Track Analytics</h3>
                    <p>Monitor your profile views and see how your audience engages with your content.</p>
                </div>
                
                <div class="feature">
                    <h3>🎯 Create Templates</h3>
                    <p>Design and share custom templates with the community.</p>
                </div>
            </div>
            
            <p style="font-size: 14px; color: #cccccc; margin-top: 30px;">
                If you have any questions or need help getting started, don't hesitate to reach out to our support team.
            </p>
        </div>
        
        <div class="footer">
            <div class="help-links">
                Need help? Contact us via <a href="https://discord.gg/cutz">Discord</a> or email <a href="mailto:help@cutz.lol">help@cutz.lol</a>
            </div>
            
            <div class="legal-links">
                <a href="https://cutz.lol/terms">Terms</a>
                <a href="https://cutz.lol/privacy">Privacy</a>
            </div>
            
            <div class="copyright">
                © 2025 cutz.lol. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>`
}
