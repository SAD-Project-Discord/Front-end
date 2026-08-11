import api from "@/lib/axios";

import type {
  ChannelAccessRoleResponse,
  ChannelAccessRolesResponse,
  ChannelMemberResponse,
  ChannelMembersResponse,
  ChannelResponse,
  ChannelTopicResponse,
  ChannelTopicsResponse,
  ChannelsResponse,
  CreateAccessRoleRequest,
  CreateChannelRequest,
  CreateTopicRequest,
  UpdateAccessRoleRequest,
  UpdateChannelMemberRoleRequest,
  UpdateChannelRequest,
  UpdateTopicRequest,
} from "@/types/channel";
import type { InviteLinkResponse } from "@/types/invite";

class ChannelService {
  async listChannels(): Promise<ChannelsResponse> {
    const { data } = await api.get<ChannelsResponse>("/channels/");
    return data;
  }

  async getChannel(channelId: string): Promise<ChannelResponse> {
    const { data } = await api.get<ChannelResponse>(`/channels/${channelId}`);
    return data;
  }

  async createChannel(payload: CreateChannelRequest): Promise<ChannelResponse> {
    const { data } = await api.post<ChannelResponse>("/channels/", payload);
    return data;
  }

  async deleteChannel(channelId: string): Promise<void> {
    await api.delete(`/channels/${channelId}`);
  }

  async listMembers(channelId: string): Promise<ChannelMembersResponse> {
    const { data } = await api.get<ChannelMembersResponse>(`/channels/${channelId}/members`);
    return data;
  }

  /** Only the channel owner can add members directly (verified against the live backend). */
  async addMember(channelId: string, userId: string): Promise<ChannelMemberResponse> {
    const { data } = await api.post<ChannelMemberResponse>(`/channels/${channelId}/members`, {
      user_id: userId,
    });
    return data;
  }

  /** Only the channel owner can remove someone else; anyone can remove themselves via leaveChannel. */
  async removeMember(channelId: string, userId: string): Promise<void> {
    await api.delete(`/channels/${channelId}/members/${userId}`);
  }

  async leaveChannel(channelId: string): Promise<void> {
    await api.delete(`/channels/${channelId}/members/me`);
  }

  async updateChannel(
    channelId: string,
    payload: UpdateChannelRequest,
  ): Promise<ChannelResponse> {
    const { data } = await api.patch<ChannelResponse>(`/channels/${channelId}`, payload);
    return data;
  }

  /** Returns the active invite link, creating it when necessary. */
  async createInviteLink(channelId: string): Promise<InviteLinkResponse> {
    const { data } = await api.post<InviteLinkResponse>(`/channels/${channelId}/invite-link`, {});
    return data;
  }

  /** Owner-only: promote/demote a non-owner member between admin and member. */
  async updateMemberRole(
    channelId: string,
    userId: string,
    payload: UpdateChannelMemberRoleRequest,
  ): Promise<ChannelMemberResponse> {
    const { data } = await api.patch<ChannelMemberResponse>(
      `/channels/${channelId}/members/${userId}`,
      payload,
    );
    return data;
  }

  async listRoles(channelId: string): Promise<ChannelAccessRolesResponse> {
    const { data } = await api.get<ChannelAccessRolesResponse>(`/channels/${channelId}/roles`);
    return data;
  }

  /** Requires MANAGE_ROLES permission. */
  async createRole(
    channelId: string,
    payload: CreateAccessRoleRequest,
  ): Promise<ChannelAccessRoleResponse> {
    const { data } = await api.post<ChannelAccessRoleResponse>(`/channels/${channelId}/roles`, payload);
    return data;
  }

  async updateRole(
    channelId: string,
    roleId: string,
    payload: UpdateAccessRoleRequest,
  ): Promise<ChannelAccessRoleResponse> {
    const { data } = await api.patch<ChannelAccessRoleResponse>(
      `/channels/${channelId}/roles/${roleId}`,
      payload,
    );
    return data;
  }

  async deleteRole(channelId: string, roleId: string): Promise<void> {
    await api.delete(`/channels/${channelId}/roles/${roleId}`);
  }

  /** Assigns a custom access role to a member. */
  async assignRole(channelId: string, userId: string, roleId: string): Promise<ChannelMemberResponse> {
    const { data } = await api.post<ChannelMemberResponse>(
      `/channels/${channelId}/members/${userId}/roles`,
      { role_id: roleId },
    );
    return data;
  }

  /** Removes a previously assigned custom access role from a member. */
  async unassignRole(channelId: string, userId: string, roleId: string): Promise<ChannelMemberResponse> {
    const { data } = await api.delete<ChannelMemberResponse>(
      `/channels/${channelId}/members/${userId}/roles/${roleId}`,
    );
    return data;
  }

  async listTopics(channelId: string): Promise<ChannelTopicsResponse> {
    const { data } = await api.get<ChannelTopicsResponse>(`/channels/${channelId}/topics`);
    return data;
  }

  async createTopic(channelId: string, payload: CreateTopicRequest): Promise<ChannelTopicResponse> {
    const { data } = await api.post<ChannelTopicResponse>(`/channels/${channelId}/topics`, payload);
    return data;
  }

  async updateTopic(
    channelId: string,
    topicId: string,
    payload: UpdateTopicRequest,
  ): Promise<ChannelTopicResponse> {
    const { data } = await api.patch<ChannelTopicResponse>(
      `/channels/${channelId}/topics/${topicId}`,
      payload,
    );
    return data;
  }

  async deleteTopic(channelId: string, topicId: string): Promise<void> {
    await api.delete(`/channels/${channelId}/topics/${topicId}`);
  }
}

export const channelService = new ChannelService();

export default channelService;
