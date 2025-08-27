import { defaultHeaders, handleApiError, parseJson } from './index';

class BadgeAPI {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async createCustomBadge(badge: { name: string; media_url: string }): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/badges`, {
        method: 'POST',
        credentials: 'include',
        headers: defaultHeaders,
        body: JSON.stringify(badge),
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }
    } catch (error) {
      console.error("Error creating custom badge:", error);
      throw error;
    }
  }

  async assignBadge(badgeName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/badges/${badgeName}`, {
        method: 'POST',
        credentials: 'include',
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }
    } catch (error) {
      console.error("Error assigning badge:", error);
      throw error;
    }
  }

  async removeBadge(badgeName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/badges/${badgeName}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }
    } catch (error) {
      console.error("Error removing badge:", error);
      throw error;
    }
  }

  async reorderBadge(badges: { badge_id: number; order: number }[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/badges`, {
        method: 'PUT',
        credentials: 'include',
        headers: defaultHeaders,
        body: JSON.stringify({ badges }),
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }
    } catch (error) {
      console.error("Error reordering badge:", error);
      throw error;
    }
  }

  async hideBadge(badgeID: number, hidden: boolean): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/badges/${badgeID}/hide?hidden=${hidden}`, {
        method: 'PUT',
        credentials: 'include',
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }
    } catch (error) {
      console.error("Error hiding badge:", error);
      throw error;
    }
  }

  async editCustomBadge(badgeID: number, newName?: string, newMediaURL?: string): Promise<void> {
    try {
      const body: { newName?: string; newMediaURL?: string } = {};
      if (newName) {
        body.newName = newName;
      }
      if (newMediaURL) {
        body.newMediaURL = newMediaURL;
      }

      const response = await fetch(`${this.baseURL}/badges/custom/${badgeID}`, {
        method: 'PUT',
        credentials: 'include',
        headers: defaultHeaders,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }
    } catch (error) {
      console.error("Error editing custom badge:", error);
      throw error;
    }
  }
}

export default BadgeAPI;