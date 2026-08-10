export type GroupAddPermission = "everyone" | "contacts" | "nobody";

export interface UserPrivacySetting {
  group_add_permission: GroupAddPermission;
  allow_direct_add: boolean;
  updated_at: string;
}

export type UpdateUserPrivacySettingRequest = Partial<
  Pick<UserPrivacySetting, "group_add_permission" | "allow_direct_add">
>;

export interface UserPrivacySettingResponse {
  success: boolean;
  data: UserPrivacySetting;
}
