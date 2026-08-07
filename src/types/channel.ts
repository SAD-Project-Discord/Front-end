export interface Channel {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  is_private: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
  is_private: boolean;
}

export interface ChannelResponse {
  success: boolean;
  data: Channel;
}

export interface ChannelsResponse {
  success: boolean;
  data: Channel[];
}
