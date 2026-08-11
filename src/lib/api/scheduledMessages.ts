// src/lib/api/scheduledMessages.ts
//
// Backed by POST/GET /messages/scheduled/ and DELETE /messages/scheduled/{id}/.
// The create request body (`CreateScheduledMessagePayload`) is confirmed against
// the backend's OpenAPI schema. The list/create *response* body isn't schema-
// annotated on the backend, so `normalize()` below reads a couple of plausible
// aliases for the id/timestamp fields rather than assuming one exact name.
import { fetchApi } from "./api";

export interface CreateScheduledMessagePayload {
  receiver_id?: string;
  group_id?: string;
  channel_id?: string;
  topic_id?: string;
  content?: string;
  reply_to_id?: string;
  media_ids?: string[];
  /** ISO-8601 timestamp of when the message should be sent. */
  scheduled_at: string;
}

export interface ScheduledMessage {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  group_id: string | null;
  channel_id: string | null;
  topic_id: string | null;
  content: string;
  scheduled_at: string;
  created_at: string | null;
}

interface RawScheduledMessage {
  id?: string;
  scheduled_id?: string;
  sender_id?: string;
  receiver_id?: string;
  group_id?: string;
  channel_id?: string;
  topic_id?: string;
  content?: string;
  scheduled_at?: string;
  send_at?: string;
  created_at?: string;
}

function normalize(raw: RawScheduledMessage): ScheduledMessage {
  return {
    id: raw.id ?? raw.scheduled_id ?? "",
    sender_id: raw.sender_id ?? null,
    receiver_id: raw.receiver_id ?? null,
    group_id: raw.group_id ?? null,
    channel_id: raw.channel_id ?? null,
    topic_id: raw.topic_id ?? null,
    content: raw.content ?? "",
    scheduled_at: raw.scheduled_at ?? raw.send_at ?? "",
    created_at: raw.created_at ?? null,
  };
}

interface ScheduledMessageListResponse {
  success?: boolean;
  data?: RawScheduledMessage[];
}

interface ScheduledMessageResponse {
  success?: boolean;
  data?: RawScheduledMessage;
}

export const scheduledMessagesApi = {
  list: async (): Promise<ScheduledMessage[]> => {
    // The backend's schema documents this endpoint's response as having no
    // body at all, so `data` may legitimately be missing — don't crash if so.
    const res = await fetchApi<ScheduledMessageListResponse>("/messages/scheduled/");
    return Array.isArray(res.data) ? res.data.map(normalize) : [];
  },

  create: async (payload: CreateScheduledMessagePayload): Promise<ScheduledMessage> => {
    // Same "no response body" case as list() above — fall back to echoing
    // back what was sent so the caller still gets a usable result.
    const res = await fetchApi<ScheduledMessageResponse>("/messages/scheduled/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalize(res.data ?? payload);
  },

  cancel: (scheduledId: string): Promise<void> => {
    return fetchApi<void>(`/messages/scheduled/${scheduledId}/`, {
      method: "DELETE",
    });
  },
};
