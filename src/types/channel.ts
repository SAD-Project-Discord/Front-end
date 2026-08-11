// Shapes verified directly against the live backend (mirrors the approach
// taken in types/group.ts's "Additive" section) — channel objects don't
// embed a `members` array or `member_count`/`is_private` the way groups do,
// and membership is managed by directly adding/removing users rather than
// through an invitation flow.

export type ChannelRole = "owner" | "member";

export interface Channel {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  topic_count: number;
  /**
   * Not implemented by the live backend yet — see
   * `docs/BACKEND_REQUIREMENTS.md`. Optional so existing call sites keep
   * working; treat as unknown (not `false`) until the backend adds it.
   */
  is_private?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
  is_private?: boolean;
}

export interface ChannelResponse {
  success: boolean;
  data: Channel;
}

export interface ChannelsResponse {
  success: boolean;
  data: Channel[];
}

export interface ChannelMember {
  user_id: string;
  username: string;
  name: string;
  role: ChannelRole;
  custom_roles: string[];
  joined_at: string;
}

export interface ChannelMemberResponse {
  success: boolean;
  data: ChannelMember;
}

export interface ChannelMembersResponse {
  success: boolean;
  data: ChannelMember[];
}
