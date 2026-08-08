import api from "@/lib/axios";

import type {
  CreateGroupRequest,
  GroupInviteResponse,
  GroupMemberResponse,
  GroupMembersResponse,
  GroupResponse,
  UpdateGroupRequest,
} from "@/types/group";

class GroupService {
  async createGroup(payload: CreateGroupRequest): Promise<GroupResponse> {
    const { data } = await api.post<GroupResponse>("/groups/", payload);

    return data;
  }

  async getGroup(groupId: string): Promise<GroupResponse> {
    const { data } = await api.get<GroupResponse>(`/groups/${groupId}`);

    return data;
  }

  async updateGroup(groupId: string, payload: UpdateGroupRequest): Promise<GroupResponse> {
    const { data } = await api.patch<GroupResponse>(`/groups/${groupId}`, payload);

    return data;
  }

  async deleteGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${groupId}`);
  }

  async listMembers(groupId: string): Promise<GroupMembersResponse> {
    const { data } = await api.get<GroupMembersResponse>(`/groups/${groupId}/members`);

    return data;
  }

  async addMember(groupId: string, userId: string): Promise<GroupMemberResponse> {
    const { data } = await api.post<GroupMemberResponse>(`/groups/${groupId}/members`, {
      user_id: userId,
    });

    return data;
  }

  async updateMemberRole(groupId: string, userId: string, role: string): Promise<GroupMemberResponse> {
    const { data } = await api.patch<GroupMemberResponse>(`/groups/${groupId}/members/${userId}`, {
      role,
    });

    return data;
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  }

  async sendInvite(groupId: string, inviteeId: string): Promise<GroupInviteResponse> {
    const { data } = await api.post<GroupInviteResponse>(`/groups/${groupId}/invites`, {
      invitee_id: inviteeId,
    });

    return data;
  }
}

export const groupService = new GroupService();

export default groupService;
