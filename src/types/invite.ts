export interface InviteLinkInfo {
  token: string;
  url: string;
  created_at: string;
  expires_at: string | null;
}

export interface InviteLinkResponse {
  success: boolean;
  data: InviteLinkInfo;
}

export type InviteTargetType = "group" | "channel";

export interface InvitePreview {
  token: string;
  target_type: InviteTargetType;
  target_id: string;
  target_name: string;
  target_description: string;
  member_count: number;
  is_member: boolean;
}

export interface InvitePreviewResponse {
  success: boolean;
  data: InvitePreview;
}
