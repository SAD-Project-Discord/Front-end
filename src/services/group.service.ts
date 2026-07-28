import api from "@/lib/axios";

import type {
  CreateGroupRequest,
  GroupInviteResponse,
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
}

export const groupService = new GroupService();

export default groupService;
