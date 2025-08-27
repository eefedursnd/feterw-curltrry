import { DiscordPresence, DiscordServer } from "haze.bio/types";
import { defaultHeaders, handleApiError, parseJson } from "./index";

class DiscordAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async getOAuth2URL(login: boolean): Promise<string> {
        try {
            const response = await fetch(`${this.baseURL}/discord/oauth2?login=${login}`, {
                method: "GET",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json.url;
        } catch (error) {
            console.error("Error getting OAuth2 URL:", error);
            throw error;
        }
    }

    async unlinkDiscordAccount(): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/discord/oauth2/unlink`, {
                method: "DELETE",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error unlinking Discord account:", error);
            throw error;
        }
    }

    async getDiscordPresence(uid: number): Promise<DiscordPresence> {
        try {
            const response = await fetch(`${this.baseURL}/discord/presence/${uid}`, {
                method: "GET",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            return await parseJson(response) as DiscordPresence;
        } catch (error) {
            console.error("Error getting Discord presence:", error);
            throw error;
        }
    }

    async getDiscordServer(invite: string): Promise<DiscordServer> {
        try {
            const inviteCode = invite.includes('discord.gg') ? invite.split('/').pop()! : invite.split('/').pop()!;
            const response = await fetch(`${this.baseURL}/discord/server/${inviteCode}`, {
                method: "GET",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            return await parseJson(response) as DiscordServer;
        } catch (error) {
            console.error("Error getting Discord server:", error);
            throw error;
        }
    }
}

export default DiscordAPI;