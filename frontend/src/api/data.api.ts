import { DataExport, DataExportDownloadRequest, DataExportDownloadResponse, DataExportResponse } from "haze.bio/types/data";
import { defaultHeaders, handleApiError, parseJson } from "./index";

class DataAPI {
    private baseURL: string;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
    }

    async requestDataExport(): Promise<DataExportResponse> {
        try {
            const response = await fetch(`${this.baseURL}/data-export/request`, {
                method: "POST",
                headers: defaultHeaders,
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as DataExportResponse;
        } catch (error) {
            console.error("Error requesting data export:", error);
            throw error;
        }
    }

    async getExportStatus(exportID: number): Promise<DataExport> {
        try {
            const response = await fetch(`${this.baseURL}/data-export/${exportID}/status`, {
                method: "GET",
                headers: defaultHeaders,
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as DataExport;
        } catch (error) {
            console.error("Error fetching export status:", error);
            throw error;
        }
    }

    async getLatestExport(cookie?: string): Promise<DataExport | null> {
        try {
            const response = await fetch(`${this.baseURL}/data-export/latest`, {
                method: "GET",
                headers: {
                    ...defaultHeaders,
                    Cookie: cookie || "",
                },
                credentials: 'include',
            });

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as DataExport;
        } catch (error) {
            console.error("Error fetching latest export:", error);
            throw error;
        }
    }

    async downloadExport(exportID: number, password: string): Promise<DataExportDownloadResponse> {
        try {
            const request: DataExportDownloadRequest = {
                export_id: exportID,
                password: password
            };

            const response = await fetch(`${this.baseURL}/data-export/${exportID}/download`, {
                method: "POST",
                headers: defaultHeaders,
                body: JSON.stringify(request),
                credentials: 'include',
            });

            if (!response.ok) {
                const json = await parseJson(response);
                await handleApiError(response, json);
            }

            const json = await parseJson(response);
            return json as DataExportDownloadResponse;
        } catch (error) {
            console.error("Error downloading export:", error);
            throw error;
        }
    }

    openDownloadLink(url: string): void {
        window.open(url, '_blank');
    }

    async requestAndTrackExport(
        callback?: (exportData: DataExport) => void,
        pollInterval: number = 30000,
        maxAttempts: number = 40
    ): Promise<DataExport | null> {
        try {
            const exportResponse = await this.requestDataExport();

            let attempts = 0;
            const checkStatus = async (exportId: number): Promise<DataExport | null> => {
                if (attempts >= maxAttempts) {
                    console.log("Max polling attempts reached");
                    return null;
                }

                attempts++;
                try {
                    const status = await this.getExportStatus(exportId);

                    if (status.status === 'completed') {
                        if (callback) {
                            callback(status);
                        }
                        return status;
                    } else if (status.status === 'failed') {
                        throw new Error('Export processing failed');
                    } else {
                        await new Promise(resolve => setTimeout(resolve, pollInterval));
                        return checkStatus(exportId);
                    }
                } catch (error) {
                    console.error("Error checking export status:", error);
                    throw error;
                }
            };

            await new Promise(resolve => setTimeout(resolve, 5000));
            return checkStatus(exportResponse.export_id);
        } catch (error) {
            console.error("Error in requestAndTrackExport:", error);
            throw error;
        }
    }
}

export default DataAPI;