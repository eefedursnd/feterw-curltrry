import { UserSocial } from '../types';
import { defaultHeaders, handleApiError, parseJson } from './index';

class SocialAPI {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async createSocial(social: Omit<UserSocial, 'uid' | 'id'>): Promise<UserSocial> {
    try {
      const response = await fetch(`${this.baseURL}/socials`, {
        method: 'POST',
        credentials: 'include',
        headers: defaultHeaders,
        body: JSON.stringify(social),
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }

      return await parseJson(response) as UserSocial;
    } catch (error) {
      console.error("Error creating social:", error);
      throw error;
    }
  }

  async updateSocial(socialId: number, social: Partial<UserSocial>): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/socials/${socialId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: defaultHeaders,
        body: JSON.stringify(social),
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }
    } catch (error) {
      console.error("Error updating social:", error);
      throw error;
    }
  }

  async deleteSocial(socialId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/socials/${socialId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }
    } catch (error) {
      console.error("Error deleting social:", error);
      throw error;
    }
  }

  async reorderSocials(socials: { id: number; order: number }[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/socials`, {
        method: 'PUT',
        credentials: 'include',
        headers: defaultHeaders,
        body: JSON.stringify({ socials }),
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }
    } catch (error) {
      console.error("Error reordering social:", error);
      throw error;
    }
  }
}

export default SocialAPI;