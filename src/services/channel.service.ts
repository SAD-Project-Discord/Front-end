import api from "@/lib/axios";

import type {
  ChannelMemberResponse,
  ChannelMembersResponse,
  ChannelResponse,
  ChannelsResponse,
  CreateChannelRequest,
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

  /** Not implemented by the live backend yet — see docs/BACKEND_REQUIREMENTS.md. */
  async updateChannel(
    channelId: string,
    payload: Partial<Pick<CreateChannelRequest, "name" | "description" | "is_private">>
  ): Promise<ChannelResponse> {
    const { data } = await api.patch<ChannelResponse>(`/channels/${channelId}`, payload);
    return data;
  }

  /**
   * Get-or-create: returns the channel's existing invite link if one is
   * already active, otherwise creates one. Not implemented by the live
   * backend yet — see docs/BACKEND_REQUIREMENTS.md.
   */
  async createInviteLink(channelId: string): Promise<InviteLinkResponse> {
    const { data } = await api.post<InviteLinkResponse>(`/channels/${channelId}/invite-link`, {});
    return data;
  }
}

export const channelService = new ChannelService();

export default channelService;
