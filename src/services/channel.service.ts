import api from "@/lib/axios";

import type {
  ChannelMemberResponse,
  ChannelMembersResponse,
  ChannelResponse,
  ChannelsResponse,
  CreateChannelRequest,
} from "@/types/channel";

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
}

export const channelService = new ChannelService();

export default channelService;
