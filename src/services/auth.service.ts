import api from "@/lib/axios";

import type {
  AuthResponse,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
} from "@/types/auth";

class AuthService {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(
      "/auth/login",
      payload
    );

    return data;
  }

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(
      "/auth/register",
      payload
    );

    return data;
  }

  async refreshToken(
    payload: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> {
    const { data } = await api.post<RefreshTokenResponse>(
      "/auth/refresh",
      payload
    );

    return data;
  }

  async logout(payload: LogoutRequest): Promise<void> {
    await api.post("/auth/logout", payload);
  }

  async logoutAll(): Promise<void> {
    await api.post("/auth/logout-all");
  }
}

export const authService = new AuthService();

export default authService;