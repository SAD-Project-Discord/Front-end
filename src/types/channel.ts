// Shapes verified against the live backend. Channel membership is managed
// separately, so channel objects do not embed their member list.

export type ChannelRole = "owner" | "member";

export interface Channel {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  topic_count: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
  is_private?: boolean;
}

export type UpdateChannelRequest = Partial<
  Pick<CreateChannelRequest, "name" | "description" | "is_private">
>;

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
