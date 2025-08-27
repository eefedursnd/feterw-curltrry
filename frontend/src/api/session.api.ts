import { UserSession } from "haze.bio/types";
import { defaultHeaders, handleApiError, parseJson } from "./index";

class SessionAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async getAllSessions(cookie?: string): Promise<UserSession[]> {
        try {
            const response = await fetch(`${this.baseURL}/sessions`, {
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

            const result = await parseJson(response);
            return result;
        } catch (error) {
            console.error("Error fetching sessions:", error);
            throw error;
        }
    }

    async logoutAllSessions(): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/sessions/logout-all`, {
                method: "POST",
                headers: defaultHeaders,
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error logging out all sessions:", error);
            throw error;
        }
    }

    async deleteSession(sessionToken: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/sessions/${sessionToken}`, {
                method: "DELETE",
                headers: defaultHeaders,
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error deleting session:", error);
            throw error;
        }
    }
}

export default SessionAPI;