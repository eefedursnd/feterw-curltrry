import { User, UserProfile } from "../types";
import { defaultHeaders, handleApiError, parseJson } from "./index";

class ProfileAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async getPublicProfile(identifier: string): Promise<User> {
        try {
            const response = await fetch(`${this.baseURL}/profile/${identifier}`, {
                method: "GET",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as User;
        } catch (error) {
            console.error("Error fetching profile:", error);
            throw error;
        }
    }

    async updateProfile(fields: Partial<UserProfile>): Promise<Partial<UserProfile>> {
        try {
            const response = await fetch(`${this.baseURL}/profile`, {
                method: "PUT",
                headers: defaultHeaders,
                body: JSON.stringify(fields),
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json || {};
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    }
}

export default ProfileAPI;