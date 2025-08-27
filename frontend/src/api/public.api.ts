import { MarqueeUser, LeaderboardUser } from "../types";
import { defaultHeaders, handleApiError, parseJson } from "./index";

class PublicAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async getMarqueeUsers(): Promise<MarqueeUser[]> {
        try {
            const response = await fetch(`${this.baseURL}/marquee_users`, {
                method: "GET",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as MarqueeUser[];
        } catch (error) {
            console.error("Error fetching marquee users:", error);
            throw error;
        }
    }

    async getLeaderboardUsersByViews(): Promise<LeaderboardUser[]> {
        try {
            const response = await fetch(`${this.baseURL}/leaderboard/views`, {
                method: "GET",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as LeaderboardUser[];
        } catch (error) {
            console.error("Error fetching leaderboard users by views:", error);
            throw error;
        }
    }

    async getLeaderboardUsersByBadges(): Promise<LeaderboardUser[]> {
        try {
            const response = await fetch(`${this.baseURL}/leaderboard/badges`, {
                method: "GET",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as LeaderboardUser[];
        } catch (error) {
            console.error("Error fetching leaderboard users by badges:", error);
            throw error;
        }
    }
}

export default PublicAPI;