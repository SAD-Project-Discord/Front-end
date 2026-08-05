import api from "@/lib/axios";
import type { User } from "@/types/auth";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

class UserService {
  async getMyProfile(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>("/users/me");
    return data.data;
  }

  /** There's no user-search endpoint on the backend — this is the only lookup available. */
  async getUser(userId: string): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>(`/users/${userId}`);
    return data.data;
  }
}

export const userService = new UserService();
export default userService;
