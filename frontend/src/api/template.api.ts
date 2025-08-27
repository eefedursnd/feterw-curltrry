import { Template } from '../types';
import { defaultHeaders, handleApiError, parseJson } from './index';

class TemplateAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async createTemplate(template: Partial<Template>): Promise<Template> {
        try {
            const response = await fetch(`${this.baseURL}/templates`, {
                method: 'POST',
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify(template),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            return await parseJson(response) as Template;
        } catch (error) {
            console.error("Error creating template:", error);
            throw error;
        }
    }

    async getTemplateById(templateId: number, cookie?: string): Promise<Template> {
        try {
            const response = await fetch(`${this.baseURL}/templates/${templateId}`, {
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

            return await parseJson(response) as Template;
        } catch (error) {
            console.error("Error getting template:", error);
            throw error;
        }
    }

    async getUserTemplates(cookie?: string): Promise<Template[]> {
        try {
            const response = await fetch(`${this.baseURL}/templates`, {
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

            const result = await parseJson(response);
            return result as Template[];
        } catch (error) {
            console.error("Error getting user templates:", error);
            throw error;
        }
    }

    async getShareableTemplates(cookie?: string): Promise<Template[]> {
        try {
            const response = await fetch(`${this.baseURL}/templates/shareable`, {
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

            const result = await parseJson(response);
            return result as Template[];
        } catch (error) {
            console.error("Error getting shareable templates:", error);
            throw error;
        }
    }

    async updateTemplate(templateId: number, template: Partial<Template>, overwrite: boolean = false): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/templates/${templateId}?overwrite=${overwrite}`, {
                method: 'PUT',
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify(template),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error updating template:", error);
            throw error;
        }
    }

    async deleteTemplate(templateId: number): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/templates/${templateId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error deleting template:", error);
            throw error;
        }
    }

    async applyTemplate(templateId: number, confirmPremium: boolean = false): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/templates/${templateId}/apply`, {
                method: 'POST',
                credentials: 'include',
                headers: defaultHeaders,
                body: JSON.stringify({
                    confirm_premium: confirmPremium
                }),
            });

            if (!response.ok) {
                const json = await parseJson(response);
                throw await handleApiError(response, json);
            }

            return;
        } catch (error) {
            console.error("Error applying template:", error);
            throw error;
        }
    }

    async getTemplateStats(): Promise<any> {
        try {
            const response = await fetch(`${this.baseURL}/templates/stats`, {
                method: 'GET',
                credentials: 'include',
                headers: defaultHeaders,
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const result = await parseJson(response);
            return result;
        } catch (error) {
            console.error("Error getting template stats:", error);
            throw error;
        }
    }
}

export default TemplateAPI;