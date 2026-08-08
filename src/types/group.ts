import type { User } from "@/types/auth";

export type GroupRole = "owner" | "admin" | "member";

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

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  is_private?: boolean;
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
