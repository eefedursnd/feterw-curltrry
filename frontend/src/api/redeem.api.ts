import { defaultHeaders, handleApiError, parseJson } from "./index";

class RedeemAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async redeemCode(code: string): Promise<{
        product: string;
    }> {
        try {
            const response = await fetch(`${this.baseURL}/redeem/${code}`, {
                method: "POST",
                credentials: 'include',
                headers: defaultHeaders,
            });

            const json = await parseJson(response);

            if (!response.ok) {
                await handleApiError(response, json);
            }

            if (json && typeof json.product === 'string') {
                return json;
            } else {
                console.warn("Unexpected response format from redeemCode API:", json);
                throw new Error("Unexpected response format from server.");
            }
        } catch (error) {
            console.error("Error redeeming code:", error);
            throw error;
        }
    }
}

export default RedeemAPI;
