import { ReportWithDetails, User } from 'haze.bio/types';
import { defaultHeaders, handleApiError, parseJson } from './index';

interface RestrictionRequest {
    userId: number;
    templateId: string;
    reason: string;
    details: string;
    duration: number;
    restrictType: 'full' | 'partial';
}

interface CreateReportRequest {
    reportedUsername: string;
    reason: string;
    details: string;
}

class PunishAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async searchUsersForModeration(query: string, cookie?: string): Promise<User[]> {
        try {
            const response = await fetch(`${this.baseURL}/moderation/search-users?query=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    ...defaultHeaders,
                    Cookie: cookie || "",
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json;
        } catch (error) {
            console.error("Error searching users for moderation:", error);
            throw error;
        }
    }

    async restrictUser(data: RestrictionRequest): Promise<any> {
        try {
            const response = await fetch(`${this.baseURL}/moderation/restrict`, {
                method: 'POST',
                headers: defaultHeaders,
                credentials: 'include',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json;
        } catch (error) {
            console.error("Error restricting user:", error);
            throw error;
        }
    }

    async unrestrictUser(punishmentId: number): Promise<any> {
        try {
            const response = await fetch(`${this.baseURL}/moderation/unrestrict/${punishmentId}`, {
                method: 'POST',
                headers: defaultHeaders,
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json;
        } catch (error) {
            console.error("Error unrestricting user:", error);
            throw error;
        }
    }

    async getPunishmentTemplates(): Promise<any> {
        try {
            const response = await fetch(`${this.baseURL}/moderation/templates`, {
                method: 'GET',
                headers: defaultHeaders,
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json;
        } catch (error) {
            console.error("Error fetching punishment templates:", error);
            throw error;
        }
    }

    async createReport(data: CreateReportRequest): Promise<Report> {
        try {
            const response = await fetch(`${this.baseURL}/reports`, {
                method: 'POST',
                headers: defaultHeaders,
                credentials: 'include',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json;
        } catch (error) {
            console.error("Error creating report:", error);
            throw error;
        }
    }

    async getOpenReports(): Promise<ReportWithDetails[]> {
        try {
            const response = await fetch(`${this.baseURL}/moderation/reports`, {
                method: 'GET',
                headers: defaultHeaders,
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json;
        } catch (error) {
            console.error("Error fetching open reports:", error);
            throw error;
        }
    }

    async handleReport(reportId: number): Promise<any> {
        try {
            const response = await fetch(`${this.baseURL}/moderation/reports/${reportId}/handle`, {
                method: 'POST',
                headers: defaultHeaders,
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json;
        } catch (error) {
            console.error("Error handling report:", error);
            throw error;
        }
    }

    async getOpenReportCount(): Promise<number> {
        try {
            const response = await fetch(`${this.baseURL}/moderation/reports/count`, {
                method: 'GET',
                headers: defaultHeaders,
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json.count;
        } catch (error) {
            console.error("Error fetching open report count:", error);
            throw error;
        }
    }

    async getReport(reportId: number): Promise<ReportWithDetails> {
        try {
            const response = await fetch(`${this.baseURL}/moderation/reports/${reportId}`, {
                method: 'GET',
                headers: defaultHeaders,
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json;
        } catch (error) {
            console.error("Error fetching report:", error);
            throw error;
        }
    }

    async assignReportToStaff(reportId: number): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/moderation/reports/${reportId}/assign`, {
                method: 'POST',
                headers: defaultHeaders,
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json;
        } catch (error) {
            console.error("Error assigning report:", error);
            throw error;
        }
    }
}

export default PunishAPI;