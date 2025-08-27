import { defaultHeaders, handleApiError, parseJson } from ".";

interface ReportRequest {
  reportedUsername: string;
  reason: string;
  details?: string;
}

class ReportAPI {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async submitReport(reportData: ReportRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/report/submit`, {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }

      const json = await parseJson(response);
      return json;
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  }

  async getUserReports(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/report/user-reports`, {
        method: 'GET',
        headers: defaultHeaders,
        credentials: 'include',
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }

      const json = await parseJson(response);
      return json || [];
    } catch (error) {
      console.error('Error fetching user reports:', error);
      throw error;
    }
  }
}

export default ReportAPI;