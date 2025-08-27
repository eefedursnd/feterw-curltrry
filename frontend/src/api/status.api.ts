import { Status } from "haze.bio/types";
import { defaultHeaders, handleApiError, parseJson } from "./index";

class StatusAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async getActiveStatus(): Promise<Status> {
        try {
            const response = await fetch(`${this.baseURL}/status`, {
                method: "GET",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            if (json.message === "No active status found") {
                return {} as Status;
            }

            return json as Status;
        } catch (error) {
            console.error("Error fetching active status:", error);
            throw error;
        }
    }

    async getUpcomingStatuses(): Promise<Status[]> {
        try {
            const response = await fetch(`${this.baseURL}/status/upcoming`, {
                method: "GET",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            if (json.message === "No upcoming statuses found") {
                return [];
            }

            return json as Status[];
        } catch (error) {
            console.error("Error fetching upcoming statuses:", error);
            throw error;
        }
    }
}

export default StatusAPI;