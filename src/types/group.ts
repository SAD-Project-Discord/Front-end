import type { User } from "@/types/auth";

export type GroupRole = "admin" | "member";

export type GroupInviteStatus = "pending" | "accepted" | "rejected";

export interface Group {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  member_count: number;
  my_role: GroupRole;
  is_private: boolean;
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

export interface GroupMember {
  id: string;
  user: User;
  role: GroupRole;
  joined_at: string;
}

export interface GroupMembersResponse {
  success: boolean;
  data: GroupMember[];
}

export interface GroupMemberResponse {
  success: boolean;
  data: GroupMember;
}

export interface AddGroupMemberRequest {
  user_id: string;
}

export interface GroupInvite {
  id: string;
  group_id: string;
  group_name: string;
  inviter: User;
  invitee_id: string;
  status: GroupInviteStatus;
  created_at: string;
}

export interface GroupInviteResponse {
  success: boolean;
  data: GroupInvite;
}

export interface SendGroupInviteRequest {
  invitee_id: string;
}

// ---------------------------------------------------------------------------
// Additive types below, kept separate from the ones above rather than
// editing them. They mirror the group-related API response shapes as
// actually returned by the live backend (verified directly against it),
// which differ in a few ways from the shapes above (e.g. members come back
// flat as `{ user_id, username, name }` rather than nested under `user`).
// ---------------------------------------------------------------------------

export interface GroupMemberInfo {
  user_id: string;
  username: string;
  name: string;
  role: string;
  custom_roles: string[];
  joined_at: string;
}

export interface GroupInfo {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  member_count: number;
  /** Present on create/get/list responses from the live backend. */
  members?: GroupMemberInfo[];
  /**
   * Not currently returned by the live backend's list/get responses — see
   * `docs/BACKEND_REQUIREMENTS.md`. Optional here so existing call sites
   * that don't have it keep working; treat as unknown (not `false`) until
   * the backend adds it.
   */
  is_private?: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupInfoResponse {
  success: boolean;
  data: GroupInfo;
}

export interface GroupInfosResponse {
  success: boolean;
  data: GroupInfo[];
}

export interface GroupMemberInfosResponse {
  success: boolean;
  data: GroupMemberInfo[];
}

export interface GroupInvitationInfo {
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

export interface GroupInvitationInfoResponse {
  success: boolean;
  data: GroupInvitationInfo;
}

export interface GroupInvitationInfosResponse {
  success: boolean;
  data: GroupInvitationInfo[];
}

export type GroupInvitationRespondAction = "accept" | "reject";
