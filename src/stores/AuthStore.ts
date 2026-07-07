import { makeAutoObservable, runInAction } from "mobx";

import authService from "@/services/auth.service";
import type { User } from "@/types/auth";

class AuthStore {
  user: User | null = null;

  accessToken: string | null = null;
  refreshToken: string | null = null;

  isAuthenticated = false;
  isLoading = false;

  error: string | null = null;

  constructor() {
    makeAutoObservable(this);

    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token");
      this.refreshToken = localStorage.getItem("refresh_token");
      this.isAuthenticated = !!this.accessToken;
    }
  }

  private persistAuth(user: User, accessToken: string, refreshToken: string) {
    runInAction(() => {
      this.user = user;
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.isAuthenticated = true;
      this.error = null;

      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
    });
  }

  private clearAuthState() {
    runInAction(() => {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.isAuthenticated = false;
      this.error = null;

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    });
  }

  async login(email: string, password: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await authService.login({
        email,
        password,
      });

      this.persistAuth(
        response.data.user,
        response.data.tokens.access_token,
        response.data.tokens.refresh_token
      );

      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error =
          error.response?.data?.error?.message ??
          "Login failed.";

        this.isAuthenticated = false;
      });

      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async register(name: string, username: string, email: string, password: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await authService.register({
        name,
        username,
        email,
        password,
      });

      this.persistAuth(
        response.data.user,
        response.data.tokens.access_token,
        response.data.tokens.refresh_token
      );

      return true;
    } catch (error: any) {
      runInAction(() => {
        this.error =
          error.response?.data?.error?.message ??
          "Registration failed.";

        this.isAuthenticated = false;
      });

      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async refreshTokenRequest() {
    if (!this.refreshToken) return;

    try {
      const response = await authService.refreshToken({
        refresh_token: this.refreshToken,
      });

      runInAction(() => {
        this.accessToken = response.data.access_token;
        this.refreshToken = response.data.refresh_token;

        localStorage.setItem("access_token", this.accessToken);
        localStorage.setItem("refresh_token", this.refreshToken);
      });
    } catch {
      this.logout();
    }
  }

  async logout() {
    try {
      if (this.refreshToken) {
        await authService.logout({
          refresh_token: this.refreshToken,
        });
      }
    } catch {
      // Ignore API errors during logout
    } finally {
      this.clearAuthState();
    }
  }
}

const authStore = new AuthStore();

export default authStore;