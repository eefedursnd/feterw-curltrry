import { LoginResponse, SiteStats, User } from "../types";
import { defaultHeaders, handleApiError, parseJson } from "./index";

class UserAPI {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async getCurrentUser(cookie?: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseURL}/@me`, {
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
      return json as User;
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw error;
    }
  }

  async updateUser(fields: Partial<User>): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/user`, {
        method: "PUT",
        headers: defaultHeaders,
        body: JSON.stringify(fields),
        credentials: 'include',
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async register(email: string, username: string, password: string, inviteCode: string): Promise<void> {
    const payload: any = { email, username, password, invite_code: inviteCode };

    const response = await fetch(`${this.baseURL}/register`, {
      method: 'POST',
      credentials: 'include',
      headers: defaultHeaders,
      body: JSON.stringify(payload),
    });

    const data = await parseJson(response);
    if (!response.ok) {
      await handleApiError(response, data);
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: defaultHeaders,
      body: JSON.stringify({ username, password }),
    });

    const responseData = await response.json();
    if (response.status === 200 && responseData?.message === 'MFA required') {
      return { requiresMfa: true, userID: responseData?.data?.uid };
    }

    if (!response.ok) {
      await handleApiError(response, responseData);
    }

    return responseData;
  }


  async logout(): Promise<void> {
    const response = await fetch(`${this.baseURL}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: defaultHeaders,
    });

    const data = await parseJson(response);
    if (!response.ok) {
      await handleApiError(response, data);
    }

    document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/';
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/password`, {
        method: "PUT",
        headers: defaultHeaders,
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        credentials: 'include',
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  }

  async getStats(): Promise<SiteStats> {
    try {
      const response = await fetch(`${this.baseURL}/stats`, {
        method: "GET",
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }

      const json = await parseJson(response);
      return json as SiteStats;
    } catch (error) {
      console.error("Error fetching site stats:", error);
      throw error;
    }
  }

  async deleteAccount(confirmed: boolean): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/me/delete`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({ confirmed }),
        credentials: 'include',
      });

      if (!response.ok) {
        const json = await parseJson(response);
        await handleApiError(response, json);
      }

      document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/';
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  }
}

export default UserAPI;