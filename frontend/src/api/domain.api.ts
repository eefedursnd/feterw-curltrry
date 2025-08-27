import {
    Domain,
    DomainWithDetails,
    AssignDomainRequest,
    RenewDomainRequest,
    DomainSelectionCheckResult
} from "../types/domain";
import { defaultHeaders, handleApiError, parseJson } from "./index";

class DomainAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async getAvailableDomains(cookie?: string): Promise<Domain[]> {
        try {
            const response = await fetch(`${this.baseURL}/domains/available`, {
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
            return json as Domain[];
        } catch (error) {
            console.error("Error fetching available domains:", error);
            throw error;
        }
    }

    async getUserDomains(cookie?: string): Promise<DomainWithDetails[]> {
        try {
            const response = await fetch(`${this.baseURL}/domains/user`, {
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
            return json as DomainWithDetails[];
        } catch (error) {
            console.error("Error fetching user domains:", error);
            throw error;
        }
    }

    async assignDomain(payload: AssignDomainRequest): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/domains/assign`, {
                method: "POST",
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error assigning domain:", error);
            throw error;
        }
    }

    async removeDomain(domainId: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/domains/${domainId}`, {
                method: "DELETE",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error removing domain:", error);
            throw error;
        }
    }

    async getAllDomains(): Promise<Domain[]> {
        try {
            const response = await fetch(`${this.baseURL}/domains`, {
                method: "GET",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as Domain[];
        } catch (error) {
            console.error("Error fetching all domains:", error);
            throw error;
        }
    }

    async addDomain(domain: Partial<Domain>): Promise<Domain> {
        try {
            const response = await fetch(`${this.baseURL}/domains`, {
                method: "POST",
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify(domain),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as Domain;
        } catch (error) {
            console.error("Error adding domain:", error);
            throw error;
        }
    }

    async checkUserDomainSelection(username: string, domainName: string): Promise<DomainSelectionCheckResult> {
        try {
            const response = await fetch(`${this.baseURL}/domains/${domainName}/${username}`, {
                method: "GET",
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as DomainSelectionCheckResult;
        } catch (error) {
            console.error("Error checking user domain selection:", error);
            throw error;
        }
    }

    async updateDomain(id: string, domain: Partial<Domain>): Promise<Domain> {
        try {
            const response = await fetch(`${this.baseURL}/domains/${id}`, {
                method: "PUT",
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify(domain),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as Domain;
        } catch (error) {
            console.error("Error updating domain:", error);
            throw error;
        }
    }

    async deleteDomain(id: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/domains/${id}`, {
                method: "DELETE",
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error deleting domain:", error);
            throw error;
        }
    }

    async renewDomain(id: string, payload: RenewDomainRequest): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/domains/${id}/renew`, {
                method: "POST",
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error renewing domain:", error);
            throw error;
        }
    }
}

export default DomainAPI;