export type GroupInviteStatus = "pending" | "accepted" | "rejected";

/**
 * Role values confirmed against the live API: "owner" (the creator) and
 * "member" (everyone else, added via an accepted invitation). There's a
 * separate `custom_roles` system for named, granular permission roles
 * (Story 5) — kept loosely typed since its shape isn't nailed down yet.
 */
export type GroupMemberRole = string;

export interface GroupMember {
  user_id: string;
  username: string;
  name: string;
  role: GroupMemberRole;
  custom_roles: string[];
  joined_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  member_count: number;
  /** Present on create/get; assumed present on list for the same reason. */
  members?: GroupMember[];
  /**
   * Sent on create, but the backend doesn't echo it back on any response
   * observed so far — don't rely on reading this back from the API.
   */
  is_private?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  member_ids?: string[];
  is_private: boolean;
}

export interface GroupResponse {
  success: boolean;
  data: Group;
}

export interface GroupsResponse {
  success: boolean;
  data: Group[];
}

export interface GroupMembersResponse {
  success: boolean;
  data: GroupMember[];
}

export interface GroupInvite {
  id: string;
  group_id: string;
  group_name: string;
  inviter_id: string;
  inviter_username: string;
  invitee_id: string;
  status: GroupInviteStatus;
  created_at: string;
  responded_at: string | null;
}

export interface GroupInviteResponse {
  success: boolean;
  data: GroupInvite;
}

export interface GroupInvitesResponse {
  success: boolean;
  data: GroupInvite[];
}

export interface SendGroupInviteRequest {
  invitee_id: string;
}

export type GroupInviteRespondAction = "accept" | "reject";
