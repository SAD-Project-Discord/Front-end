import { makeAutoObservable, runInAction } from "mobx";

import userService from "@/services/user.service";
import type { PublicUserProfile } from "@/types/user";

class UserStore {
  searchResults: PublicUserProfile[] = [];

  isSearching = false;

  error: string | null = null;

  private requestVersion = 0;

  constructor() {
    makeAutoObservable(this);
  }

  setError(message: string | null) {
    this.error = message;
  }

  clearSearch() {
    this.requestVersion += 1;
    this.searchResults = [];
    this.isSearching = false;
    this.error = null;
  }

  setContactStatus(userId: string, isContact: boolean) {
    this.searchResults = this.searchResults.map((user) =>
      user.id === userId ? { ...user, is_contact: isContact } : user,
    );
  }

  async searchUsers(query: string): Promise<void> {
    const trimmed = query.trim();

    if (!trimmed) {
      this.clearSearch();
      return;
    }

    const version = ++this.requestVersion;
    this.isSearching = true;
    this.setError(null);

    try {
      const response = await userService.searchUsers(trimmed);

      if (version !== this.requestVersion) return;
      runInAction(() => {
        this.searchResults = response.data;
      });
    } catch (error: unknown) {
      if (version !== this.requestVersion) return;
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
      if (version === this.requestVersion) {
        runInAction(() => {
          this.isSearching = false;
        });
      }
    }
  }
}

const userStore = new UserStore();

export default userStore;
