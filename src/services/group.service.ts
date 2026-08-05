import api from "@/lib/axios";

import type {
  CreateGroupRequest,
  GroupInviteRespondAction,
  GroupInviteResponse,
  GroupInvitesResponse,
  GroupMembersResponse,
  GroupResponse,
  GroupsResponse,
} from "@/types/group";

class GroupService {
  async listGroups(): Promise<GroupsResponse> {
    const { data } = await api.get<GroupsResponse>("/groups/");
    return data;
  }

  async getGroup(groupId: string): Promise<GroupResponse> {
    const { data } = await api.get<GroupResponse>(`/groups/${groupId}`);
    return data;
  }

  async createGroup(payload: CreateGroupRequest): Promise<GroupResponse> {
    const { data } = await api.post<GroupResponse>("/groups/", payload);
    return data;
  }

  async updateGroup(
    groupId: string,
    payload: Partial<Pick<CreateGroupRequest, "name" | "description" | "is_private">>
  ): Promise<GroupResponse> {
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

  /** Only the owner/a manager can remove someone else; anyone can remove themselves via leaveGroup. */
  async removeMember(groupId: string, userId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  }

  async leaveGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/members/me`);
  }

  /**
   * The only way to add someone to a group — there's no direct "add member"
   * endpoint (POST /groups/{id}/members returns 405). They must be invited
   * and accept.
   */
  async sendInvite(groupId: string, inviteeId: string): Promise<GroupInviteResponse> {
    const { data } = await api.post<GroupInviteResponse>(`/groups/${groupId}/invitations`, {
      invitee_id: inviteeId,
    });
    return data;
  }

  async listMyInvites(): Promise<GroupInvitesResponse> {
    const { data } = await api.get<GroupInvitesResponse>("/groups/invitations");
    return data;
  }

  async respondToInvite(
    invitationId: string,
    action: GroupInviteRespondAction
  ): Promise<GroupInviteResponse> {
    const { data } = await api.post<GroupInviteResponse>(
      `/groups/invitations/${invitationId}/respond`,
      { action }
    );
    return data;
  }
}

export const groupService = new GroupService();

export default groupService;
