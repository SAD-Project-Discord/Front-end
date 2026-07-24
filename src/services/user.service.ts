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
}

const userService = new UserService();

export default userService;
