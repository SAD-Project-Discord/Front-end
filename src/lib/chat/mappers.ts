import type { ApiMessage } from "@/lib/api/messages";
import type { Message } from "@/lib/types";
import { getAttachmentMeta } from "./attachmentMetaCache";

export function apiMessageToMessage(api: ApiMessage): Message {
  return {
    id: api.id,
    senderId: api.sender_id,
    receiverId: api.receiver_id,
    content: api.content,
    attachments: api.media.map((m) => ({ id: m.id, ...getAttachmentMeta(m.id) })),
    isEdited: api.is_edited,
    isDeleted: api.is_deleted,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    deliveryState: "sent",
  };
}
