// src/lib/api/auth.ts
import { fetchApi } from "./api";
import type { ApiUser } from "./users";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  name: string;
}

export interface Session {
  id: string;
  created_at: string;
  expires_at: string;
  device: string;
}

export const authApi = {
  login: (
    payload: LoginPayload,
  ): Promise<{ success: true; data: { user: ApiUser; tokens: AuthTokens } }> =>
    fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuthRetry: true,
    }),

  register: (
    payload: RegisterPayload,
  ): Promise<{ success: true; data: { user: ApiUser; tokens: AuthTokens } }> =>
    fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuthRetry: true,
    }),

  logout: (refreshToken: string): Promise<void> =>
    fetchApi("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
      skipAuthRetry: true,
    }),

  logoutAll: (): Promise<void> =>
    fetchApi("/auth/logout-all", { method: "POST" }),

  sessions: (): Promise<{ success: true; data: Session[] }> => fetchApi("/auth/sessions"),

  revokeSession: (sessionId: string): Promise<void> =>
    fetchApi(`/auth/sessions/${sessionId}`, { method: "DELETE" }),
};
