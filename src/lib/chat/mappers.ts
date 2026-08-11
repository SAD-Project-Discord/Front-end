import type { ApiMessage } from "@/lib/api/messages";
import type { Message } from "@/lib/types";

export function apiMessageToMessage(api: ApiMessage): Message {
  return {
    id: api.id,
    senderId: api.sender_id,
    receiverId: api.receiver_id,
    groupId: api.group_id,
    content: api.content,
    attachments: api.media.map((m) => ({
      id: m.id,
      type: m.media_type,
      fileName: m.filename,
      mimeType: m.content_type,
      sizeBytes: m.size,
      fileUrl: m.file_url,
    })),
    isEdited: api.is_edited,
    isDeleted: api.is_deleted,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    deliveryState: "sent",
  };
}
