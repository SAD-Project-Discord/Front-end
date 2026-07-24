export type GroupRole = "admin" | "member";

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
