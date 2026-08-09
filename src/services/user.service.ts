import api from "@/lib/axios";
import type { UsersSearchResponse } from "@/types/user";
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
}

export const userService = new UserService();
export default userService;