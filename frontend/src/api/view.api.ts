import { View } from "haze.bio/types";
import { defaultHeaders, handleApiError, parseJson } from "./index";

class ViewAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async incrementViewCount(uid: number): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/views/${uid}/increment`, {
                method: "POST",
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error incrementing view count:", error);
            throw error;
        }
    }

    async getViewsData(cookie?: string): Promise<View> {
        try {
            const response = await fetch(`${this.baseURL}/views`, {
                method: "GET",
                credentials: 'include',
                headers: {
                    ...defaultHeaders,
                    Cookie: cookie || "",
                },
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json;
        } catch (error) {
            console.error("Error getting views data:", error);
            throw error;
        }
    }
}

export default ViewAPI;