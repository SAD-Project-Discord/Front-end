import api from "@/lib/axios";

import type { UsersSearchResponse } from "@/types/user";

class UserService {
  async searchUsers(query: string, limit = 10): Promise<UsersSearchResponse> {
    const { data } = await api.get<UsersSearchResponse>("/users/search", {
      params: { q: query, limit },
    });

    return data;
  }
}

export const userService = new UserService();

export default userService;
