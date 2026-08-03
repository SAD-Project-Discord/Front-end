/**
 * Client-side lifecycle of an outgoing message. The backend has no delivery
 * receipts (no "delivered"/"read" concept), so this only tracks the local
 * send round-trip: optimistic -> confirmed, or failed.
 */
export type MessageDeliveryState = "sending" | "sent" | "failed";

/**
 * A media attachment on a message. The backend only ever returns `{ id }`
 * for media on a message (no filename/mimetype/size) — the richer fields
 * are populated client-side, and only known for files the current session
 * itself uploaded (see src/lib/chat/attachmentMetaCache.ts).
 */
export interface MessageAttachment {
  id: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string | null;
  content: string;
  attachments: MessageAttachment[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  deliveryState: MessageDeliveryState;
  /** Set only on optimistic messages, used to reconcile with the server's confirmed id. */
  clientId?: string;
}
