import { defaultHeaders, handleApiError, parseJson } from "./index";

class PasswordAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async requestPasswordReset(email: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/password/request-reset`, {
                method: "POST",
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error requesting password reset:", error);
            throw error;
        }
    }

    async verifyResetToken(token: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseURL}/password/verify-token?token=${encodeURIComponent(token)}`, {
                method: "GET",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error verifying reset token:", error);
            return false;
        }
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/password/reset`, {
                method: "POST",
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify({ token, new_password: newPassword })
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            throw error;
        }
    }
}

export default PasswordAPI;