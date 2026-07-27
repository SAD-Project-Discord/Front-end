import { makeAutoObservable, runInAction } from "mobx";

import userService from "@/services/user.service";
import type { User } from "@/types/auth";

class UserStore {
  searchResults: User[] = [];

  isSearching = false;

  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setError(message: string | null) {
    this.error = message;
  }

  clearSearch() {
    this.searchResults = [];
    this.isSearching = false;
    this.error = null;
  }

  async searchUsers(query: string): Promise<void> {
    const trimmed = query.trim();

    if (!trimmed) {
      this.clearSearch();
      return;
    }

    this.isSearching = true;
    this.setError(null);

    try {
      const response = await userService.searchUsers(trimmed);

      runInAction(() => {
        this.searchResults = response.data;
      });
    } catch (error: unknown) {
      runInAction(() => {
        const responseMessage =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
            : undefined;
        const message =
          typeof responseMessage === "string" ? responseMessage : "Could not search users.";

        this.setError(message);
        this.searchResults = [];
      });
    } finally {
      runInAction(() => {
        this.isSearching = false;
      });
    }
  }
}

const userStore = new UserStore();

export default userStore;
