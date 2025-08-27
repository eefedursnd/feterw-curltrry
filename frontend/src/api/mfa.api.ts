import { defaultHeaders, handleApiError, parseJson } from "./index";

class MFAAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async generateMFASecret(): Promise<{ secret: string, qr_code_url: string }> {
        try {
            const response = await fetch(`${this.baseURL}/mfa/generate`, {
                method: "POST",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as { secret: string, qr_code_url: string };
        } catch (error) {
            console.error("Error generating MFA secret:", error);
            throw error;
        }
    }

    async enableMFA(secret: string, code: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/mfa/enable`, {
                method: "POST",
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify({ secret, code }),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error enabling MFA:", error);
            throw error;
        }
    }

    async disableMFA(): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/mfa/disable`, {
                method: "POST",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error disabling MFA:", error);
            throw error;
        }
    }

    async verifyMFA(uid: number, code: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/mfa/verify`, {
                method: "POST",
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify({ uid, code }),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error verifying MFA:", error);
            throw error;
        }
    }
}

export default MFAAPI;