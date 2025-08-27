import { GitHubUser, UserWidget, ValorantUser } from '../types';
import { defaultHeaders, handleApiError, parseJson } from './index';

class WidgetAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async createWidget(widget: Omit<UserWidget, 'uid'>): Promise<number> {
        try {
            const response = await fetch(`${this.baseURL}/widgets`, {
                method: 'POST',
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify(widget),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            return await parseJson(response) as number;
        } catch (error) {
            console.error("Error creating widget:", error);
            throw error;
        }
    }

    async updateWidget(widgetId: number, widget: Partial<UserWidget>): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/widgets/${widgetId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify(widget),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error updating widget:", error);
            throw error;
        }
    }

    async deleteWidget(widgetId: number): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/widgets/${widgetId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error deleting widget:", error);
            throw error;
        }
    }

    async reorderWidget(widgets: { widget_data: string; order: number }[]): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/widgets`, {
                method: 'PUT',
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify({ widgets }),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error reordering widget:", error);
            throw error;
        }
    }


    async getGithubData(username: string): Promise<GitHubUser> {
        try {
            const response = await fetch(`${this.baseURL}/widget/github/${username}`, {
                method: 'GET',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            return await parseJson(response) as GitHubUser;
        } catch (error) {
            console.error("Error fetching GitHub data:", error);
            throw error;
        }
    }

    async getValorantData(username: string, tag: string): Promise<ValorantUser> {
        try {
            const response = await fetch(`${this.baseURL}/widget/valorant/${username}/${tag}`, {
                method: 'GET',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            return await parseJson(response);
        } catch (error) {
            console.error("Error fetching Valorant data:", error);
            throw error;
        }
    }
}

export default WidgetAPI;