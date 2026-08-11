import api from "@/lib/axios";
import type { PublicUserProfile, UsersSearchResponse } from "@/types/user";
import type { User } from "@/types/auth";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

class UserService {
  async searchUsers(query: string, limit = 10): Promise<UsersSearchResponse> {
    const { data } = await api.get<UsersSearchResponse>("/users/search", {
      params: { q: query, limit },
    });
    return data;
  }

  async getMyProfile(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>("/users/me");
    return data.data;
  }

  async getPublicProfile(userId: string): Promise<PublicUserProfile> {
    const { data } = await api.get<ApiResponse<PublicUserProfile>>(
      `/users/${encodeURIComponent(userId)}`,
    );
    return data.data;
  }
}

export const userService = new UserService();
export default userService;
