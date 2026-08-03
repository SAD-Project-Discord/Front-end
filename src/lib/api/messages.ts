// src/lib/api/messages.ts
import { fetchApi } from './api';

export interface ApiMessage {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  group_id: string | null;
  channel_id: string | null;
  topic_id: string | null;
  content: string;
  reply_to_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  media: { id: string }[];
  reactions: unknown[];
  created_at: string;
  updated_at: string;
}

export interface MessagesResponse {
  success: boolean;
  data: ApiMessage[];
  meta: {
    limit: number;
    has_more: boolean;
  };
}

export interface ScopedSearchResponse {
  success: boolean;
  data: ApiMessage[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}

export interface GlobalSearchResponse {
  success: boolean;
  data: ApiMessage[];
  meta: {
    limit: number;
    has_more: boolean;
    total: number;
    query: string;
  };
}

export interface SendMessagePayload {
  receiver_id?: string;
  group_id?: string;
  channel_id?: string;
  topic_id?: string;
  content: string;
  reply_to_id?: string | null;
  media_ids?: string[];
}

export const messagesApi = {
  /**
   * Get direct message history with cursor pagination
   */
  getDirectMessages: (userId: string, limit: number = 50, before?: string): Promise<MessagesResponse> => {
    let query = `?limit=${limit}`;
    if (before) query += `&before=${before}`;
    return fetchApi<MessagesResponse>(`/messages/direct/${userId}${query}`);
  },

  /**
   * Get group message history
   */
  getGroupMessages: (groupId: string, limit: number = 50): Promise<MessagesResponse> => {
    return fetchApi<MessagesResponse>(`/messages/groups/${groupId}?limit=${limit}`);
  },

  /**
   * Get channel message history
   */
  getChannelMessages: (channelId: string, limit: number = 50, topicId?: string): Promise<MessagesResponse> => {
    let query = `?limit=${limit}`;
    if (topicId) query += `&topic_id=${topicId}`;
    return fetchApi<MessagesResponse>(`/messages/channels/${channelId}${query}`);
  },

  /**
   * Send a new message (Direct, Group, or Channel)
   */
  sendMessage: (payload: SendMessagePayload): Promise<{ success: boolean; data: ApiMessage }> => {
    return fetchApi<{ success: boolean; data: ApiMessage }>('/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Edit an existing message (sender only)
   */
  editMessage: (messageId: string, content: string): Promise<{ success: boolean; data: ApiMessage }> => {
    return fetchApi<{ success: boolean; data: ApiMessage }>(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Soft delete a message (sender only) -> returns 204 No Content
   */
  deleteMessage: (messageId: string): Promise<void> => {
    return fetchApi<void>(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Search message content/captions within a single direct conversation.
   */
  searchDirectMessages: (userId: string, query: string, limit: number = 20): Promise<ScopedSearchResponse> => {
    return fetchApi<ScopedSearchResponse>(
      `/messages/direct/${userId}/search/?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
  },

  /**
   * Search across every space (direct, group, channel) the current user belongs to.
   */
  searchGlobal: (query: string, limit: number = 20): Promise<GlobalSearchResponse> => {
    return fetchApi<GlobalSearchResponse>(
      `/messages/search/global/?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
  },
};
