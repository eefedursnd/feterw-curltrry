import { defaultHeaders, handleApiError, parseJson } from "./index";

class FileAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async uploadFile(fileType: string, file: File, badgeID?: number): Promise<string> {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("fileType", fileType);
            if (badgeID) {
                formData.append("badgeID", badgeID.toString());
            }

            const response = await fetch(`${this.baseURL}/files/upload`, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                },
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return (json as any)?.data as string;
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    }

    async importFile(fileType: string, fileURL: string): Promise<string> {
        try {
            const response = await fetch(`${this.baseURL}/files/import`, {
                method: "POST",
                headers: defaultHeaders,
                body: JSON.stringify({ fileType, fileURL }),
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as string;
        } catch (error) {
            console.error("Error importing file:", error);
            throw error;
        }
    }

    async deleteFile(fileURL: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/files/delete`, {
                method: "POST",
                headers: defaultHeaders,
                body: JSON.stringify({ fileURL }),
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }
        } catch (error) {
            console.error("Error deleting file:", error);
            throw error;
        }
    }
}

export default FileAPI;