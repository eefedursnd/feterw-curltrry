import { defaultHeaders, handleApiError, parseJson } from "./index";

class EmailAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async sendVerificationEmail(email: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/email/send-verification`, {
                method: "POST",
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error sending verification email:", error);
            throw error;
        }
    }

    async verifyEmailCode(code: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/email/verify`, {
                method: "POST",
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify({ code }),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error verifying email code:", error);
            throw error;
        }
    }

    async verifyRegistration(token: string): Promise<{ username: string; email: string }> {
        try {
            const response = await fetch(`${this.baseURL}/email/verify-registration?token=${token}`, {
                method: "GET",
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
                throw new Error("Failed to verify registration");
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error("Error verifying registration:", error);
            throw error;
        }
    }

    async completeRegistration(token: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/email/complete-registration`, {
                method: "POST",
                headers: defaultHeaders,
                body: JSON.stringify({ token }),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error completing registration:", error);
            throw error;
        }
    }
}

export default EmailAPI;