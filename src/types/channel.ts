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
  created_at: string;
  updated_at: string;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
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
