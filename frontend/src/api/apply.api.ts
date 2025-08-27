import {
  Application,
  ApplicationSession,
  EnrichedApplication,
  Position,
  StaffApplicationListItem
} from "../types/apply";
import { defaultHeaders, handleApiError, parseJson } from "./index";

class ApplyAPI {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async getActivePositions(cookie?: string): Promise<Position[]> {
    try {
      const response = await fetch(`${this.baseURL}/applications/positions`, {
        method: "GET",
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
      return json as Position[];
    } catch (error) {
      console.error("Error fetching positions:", error);
      throw error;
    }
  }

  async getPositionById(id: string): Promise<Position> {
    try {
      const response = await fetch(`${this.baseURL}/applications/positions/${id}`, {
        method: "GET",
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }

      const json = await parseJson(response);
      return json as Position;
    } catch (error) {
      console.error(`Error fetching position ${id}:`, error);
      throw error;
    }
  }

  async getUserApplications(cookie?: string): Promise<Application[]> {
    try {
      const response = await fetch(`${this.baseURL}/applications`, {
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
      return json as Application[];
    } catch (error) {
      console.error("Error fetching user applications:", error);
      throw error;
    }
  }

  async startApplication(positionId: string): Promise<ApplicationSession> {
    try {
      const response = await fetch(`${this.baseURL}/applications/start`, {
        method: "POST",
        credentials: 'include',
        headers: defaultHeaders,
        body: JSON.stringify({ position_id: positionId }),
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }

      const json = await parseJson(response);
      return json as ApplicationSession;
    } catch (error) {
      console.error("Error starting application:", error);
      throw error;
    }
  }

  async saveAnswer(positionId: string, questionId: string, answer: string, timeSpent: number): Promise<ApplicationSession> {
    try {
      const response = await fetch(`${this.baseURL}/applications/answer`, {
        method: "POST",
        credentials: 'include',
        headers: defaultHeaders,
        body: JSON.stringify({
          position_id: positionId,
          question_id: questionId,
          answer: answer,
          time_spent: timeSpent,
        }),
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }

      const json = await parseJson(response);
      return json as ApplicationSession;
    } catch (error) {
      console.error("Error saving answer:", error);
      throw error;
    }
  }

  async submitApplication(positionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/applications/submit`, {
        method: "POST",
        credentials: 'include',
        headers: defaultHeaders,
        body: JSON.stringify({ position_id: positionId }),
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      throw error;
    }
  }

  async getApplicationsByStatus(status: string, cookie?: string): Promise<StaffApplicationListItem[]> {
    try {
      const response = await fetch(`${this.baseURL}/moderation/applications/${status}`, {
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
      return json as StaffApplicationListItem[];
    } catch (error) {
      console.error(`Error fetching applications with status ${status}:`, error);
      throw error;
    }
  }

  async getApplicationDetail(id: number): Promise<EnrichedApplication> {
    try {
      const response = await fetch(`${this.baseURL}/moderation/applications/detail/${id}`, {
        method: "GET",
        credentials: 'include',
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }

      const json = await parseJson(response);
      return json as EnrichedApplication;
    } catch (error) {
      console.error(`Error fetching application details for ${id}:`, error);
      throw error;
    }
  }

  async reviewApplication(id: number, status: string, feedbackNote: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/moderation/applications/review/${id}`, {
        method: "POST",
        credentials: 'include',
        headers: defaultHeaders,
        body: JSON.stringify({
          status: status,
          feedback_note: feedbackNote,
        }),
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }
    } catch (error) {
      console.error(`Error reviewing application ${id}:`, error);
      throw error;
    }
  }
}

export default ApplyAPI;