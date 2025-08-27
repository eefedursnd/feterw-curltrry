import { defaultHeaders, handleApiError, parseJson } from './index';

class AnalyticsAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async getAnalytics(days: number = 7, cookie?: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseURL}/analytics?days=${days}`, {
                method: 'GET',
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

            return await parseJson(response);
        } catch (error) {
            console.error("Error fetching analytics data:", error);
            throw error;
        }
    }

    async trackSocialClick(uid: number, socialType: string): Promise<void> {
        try {
            await fetch(`${this.baseURL}/analytics/social-click?uid=${uid}&type=${socialType}`, {
                method: 'POST',
                headers: defaultHeaders,
            });
        } catch (error) {
            console.error("Error tracking social click:", error);
        }
    }
}

export default AnalyticsAPI;