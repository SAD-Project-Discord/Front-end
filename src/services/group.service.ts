import api from "@/lib/axios";

import type {
  CreateGroupRequest,
  GroupInfoResponse,
  GroupInfosResponse,
  GroupInvitationInfoResponse,
  GroupInvitationInfosResponse,
  GroupInvitationRespondAction,
  GroupInviteResponse,
  GroupMemberInfosResponse,
  GroupMemberResponse,
  GroupMembersResponse,
  GroupResponse,
} from "@/types/group";

class GroupService {
  async createGroup(payload: CreateGroupRequest): Promise<GroupResponse> {
    const { data } = await api.post<GroupResponse>(
      "/groups/",
      payload
    );

    return data;
  }

  async listMembers(groupId: string): Promise<GroupMembersResponse> {
    const { data } = await api.get<GroupMembersResponse>(
      `/groups/${groupId}/members`
    );

    return data;
  }

  async addMember(groupId: string, userId: string): Promise<GroupMemberResponse> {
    const { data } = await api.post<GroupMemberResponse>(
      `/groups/${groupId}/members`,
      { user_id: userId }
    );

    return data;
  }

  async sendInvite(groupId: string, inviteeId: string): Promise<GroupInviteResponse> {
    const { data } = await api.post<GroupInviteResponse>(
      `/groups/${groupId}/invites`,
      { invitee_id: inviteeId }
    );

    return data;
  }

  // ---------------------------------------------------------------------
  // Additive methods below, kept separate from the ones above rather than
  // editing them. They hit the group endpoints as actually implemented by
  // the live backend (verified directly against it) — e.g. invitations
  // live at `/groups/{id}/invitations`, not `/groups/{id}/invites`.
  // ---------------------------------------------------------------------

  async listGroups(): Promise<GroupInfosResponse> {
    const { data } = await api.get<GroupInfosResponse>("/groups/");
    return data;
  }

  async getGroup(groupId: string): Promise<GroupInfoResponse> {
    const { data } = await api.get<GroupInfoResponse>(`/groups/${groupId}`);
    return data;
  }

  async updateGroup(
    groupId: string,
    payload: Partial<Pick<CreateGroupRequest, "name" | "description" | "is_private">>
  ): Promise<GroupInfoResponse> {
    const { data } = await api.patch<GroupInfoResponse>(`/groups/${groupId}`, payload);
    return data;
  }

  async deleteGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${groupId}`);
  }

  async listMembersInfo(groupId: string): Promise<GroupMemberInfosResponse> {
    const { data } = await api.get<GroupMemberInfosResponse>(`/groups/${groupId}/members`);
    return data;
  }

  /** Only the owner/a manager can remove someone else; anyone can remove themselves via leaveGroup. */
  async removeMember(groupId: string, userId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  }

  async leaveGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/members/me`);
  }

  async sendGroupInvitation(groupId: string, inviteeId: string): Promise<GroupInvitationInfoResponse> {
    const { data } = await api.post<GroupInvitationInfoResponse>(`/groups/${groupId}/invitations`, {
      invitee_id: inviteeId,
    });
    return data;
  }

  async listMyInvitations(): Promise<GroupInvitationInfosResponse> {
    const { data } = await api.get<GroupInvitationInfosResponse>("/groups/invitations");
    return data;
  }

  async respondToInvitation(
    invitationId: string,
    action: GroupInvitationRespondAction
  ): Promise<GroupInvitationInfoResponse> {
    const { data } = await api.post<GroupInvitationInfoResponse>(
      `/groups/invitations/${invitationId}/respond`,
      { action }
    );
    return data;
  }
}

export const groupService = new GroupService();

export default groupService;
