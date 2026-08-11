import { makeAutoObservable, runInAction } from "mobx";

import settingsService from "@/services/settings.service";
import type { UpdateUserPrivacySettingRequest, UserPrivacySetting } from "@/types/settings";

function extractErrorMessage(error: unknown, fallback: string): string {
  const responseMessage =
    error && typeof error === "object" && "response" in error
      ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
      : undefined;
  return typeof responseMessage === "string" ? responseMessage : fallback;
}

class SettingsStore {
  settings: UserPrivacySetting | null = null;

  isLoading = false;
  isSaving = false;

  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setError(message: string | null) {
    this.error = message;
  }

  async loadSettings(): Promise<void> {
    this.isLoading = true;
    this.setError(null);

    try {
      const response = await settingsService.getSettings();
      runInAction(() => {
        this.settings = response.data;
      });
    } catch (error: unknown) {
      runInAction(() => {
        this.setError(extractErrorMessage(error, "Could not load settings."));
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async saveSettings(patch: UpdateUserPrivacySettingRequest): Promise<boolean> {
    this.isSaving = true;
    this.setError(null);

    try {
      const response = await settingsService.updateSettings(patch);
      runInAction(() => {
        this.settings = response.data;
      });
      return true;
    } catch (error: unknown) {
      runInAction(() => {
        this.setError(extractErrorMessage(error, "Could not save settings."));
      });
      return false;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  }
}

const settingsStore = new SettingsStore();

export default settingsStore;
