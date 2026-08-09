import { makeAutoObservable, runInAction } from "mobx";

import authService from "@/services/auth.service";
import userService from "@/services/user.service";
import type { User } from "@/types/auth";

class AuthStore {
  user: User | null = null;

  accessToken: string | null = null;
  refreshToken: string | null = null;

  isAuthenticated = false;
  isLoading = false;
  isHydratingUser = false;

  error: string | null = null;

  constructor() {
    makeAutoObservable(this);

    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token");
      this.refreshToken = localStorage.getItem("refresh_token");
      this.isAuthenticated = !!this.accessToken;
    }
  }

  setError(message: string | null) {
    this.error = message;
  }

  /**
   * Additive helper: only the tokens survive a fresh page load (see the
   * constructor above) — `user` is only ever set in-memory by persistAuth(),
   * so a hard refresh/direct navigation on any page that reads
   * `authStore.user` would otherwise see `null` forever despite a valid
   * session. Call this once on mount wherever that matters.
   */
  async hydrateUser(): Promise<void> {
    if (this.user || !this.accessToken || this.isHydratingUser) return;

    this.isHydratingUser = true;
    try {
      const profile = await userService.getMyProfile();
      runInAction(() => {
        this.user = profile;
      });
    } catch {
      // A 401 here is already handled by the axios interceptor's redirect flow.
    } finally {
      runInAction(() => {
        this.isHydratingUser = false;
      });
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
    this.setError(null);

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
    } catch (error: unknown) {
      runInAction(() => {
        const responseMessage =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
            : undefined;
        const message = typeof responseMessage === "string" ? responseMessage : "Login failed.";

        this.setError(message);

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
    this.setError(null);

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
    } catch (error: unknown) {
      runInAction(() => {
        const responseMessage =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
            : undefined;
        const message = typeof responseMessage === "string" ? responseMessage : "Registration failed.";

        this.setError(message);

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