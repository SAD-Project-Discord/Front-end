// Shapes verified against the live backend. Channel membership is managed
// separately, so channel objects do not embed their member list.

export type ChannelRole = "owner" | "admin" | "member";

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

/** Custom role as embedded in a `ChannelMember` (subset of `ChannelAccessRole`). */
export interface MemberCustomRole {
  id: string;
  name: string;
  permissions: ChannelPermission[];
}

export interface ChannelMember {
  user_id: string;
  username: string;
  name: string;
  role: ChannelRole;
  custom_roles: MemberCustomRole[];
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

/** Base membership role a channel owner can toggle a non-owner member between. */
export type UpdateChannelMemberRoleRequest = {
  role: Extract<ChannelRole, "admin" | "member">;
};

// --- Custom access roles (owner-defined roles with granular permissions) ---

export type ChannelPermission =
  | "manage_group"
  | "manage_members"
  | "manage_roles"
  | "manage_invitations"
  | "manage_channel"
  | "manage_topics"
  | "manage_channel_members"
  | "delete_messages"
  | "upload_media";

export interface ChannelAccessRole {
  id: string;
  name: string;
  permissions: ChannelPermission[];
  scope_type: string;
  group_id: string | null;
  channel_id: string | null;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAccessRoleRequest {
  name: string;
  permissions?: ChannelPermission[];
}

export type UpdateAccessRoleRequest = Partial<CreateAccessRoleRequest>;

export interface ChannelAccessRoleResponse {
  success: boolean;
  data: ChannelAccessRole;
}

export interface ChannelAccessRolesResponse {
  success: boolean;
  data: ChannelAccessRole[];
}

// --- Topics (threads): separate chat spaces nested inside a channel ---

export interface ChannelTopic {
  id: string;
  channel_id: string;
  name: string;
  description: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTopicRequest {
  name: string;
  description?: string;
}

export type UpdateTopicRequest = Partial<CreateTopicRequest>;

export interface ChannelTopicResponse {
  success: boolean;
  data: ChannelTopic;
}

export interface ChannelTopicsResponse {
  success: boolean;
  data: ChannelTopic[];
}
