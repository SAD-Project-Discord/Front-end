// src/lib/api/users.ts
import { fetchApi } from "./api";

export interface ApiUser {
  id: string;
  username: string;
  /** Only present on the authenticated user's own profile (`/users/me`). */
  email?: string;
  name: string;
  bio: string;
  avatar_url: string;
  /** Present on public profiles and search results. */
  is_contact?: boolean;
  created_at: string;
  updated_at: string;
}

export const usersApi = {
  me: (): Promise<{ success: true; data: ApiUser }> => fetchApi("/users/me"),

  updateMe: (
    payload: Partial<Pick<ApiUser, "name" | "bio" | "avatar_url" | "username">>,
  ): Promise<{ success: true; data: ApiUser }> =>
    fetchApi("/users/me", { method: "PATCH", body: JSON.stringify(payload) }),

  getUser: (userId: string): Promise<{ success: true; data: ApiUser }> =>
    fetchApi(`/users/${userId}`),
};
