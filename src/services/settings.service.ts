import api from "@/lib/axios";

import type {
  UpdateUserPrivacySettingRequest,
  UserPrivacySettingResponse,
} from "@/types/settings";

class SettingsService {
  async getSettings(): Promise<UserPrivacySettingResponse> {
    const { data } = await api.get<UserPrivacySettingResponse>("/users/me/privacy/");
    return data;
  }

  async updateSettings(patch: UpdateUserPrivacySettingRequest): Promise<UserPrivacySettingResponse> {
    const { data } = await api.patch<UserPrivacySettingResponse>("/users/me/privacy/", patch);
    return data;
  }
}

export const settingsService = new SettingsService();

export default settingsService;
