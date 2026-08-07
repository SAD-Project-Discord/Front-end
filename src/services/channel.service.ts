import api from "@/lib/axios";
import type { ChannelResponse, CreateChannelRequest } from "@/types/channel";

class ChannelService {
  async createChannel(payload: CreateChannelRequest): Promise<ChannelResponse> {
    const { data } = await api.post<ChannelResponse>("/channels/", payload);
    return data;
  }
}

export const channelService = new ChannelService();
export default channelService;
