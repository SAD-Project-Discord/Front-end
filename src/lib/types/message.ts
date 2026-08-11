/**
 * Client-side lifecycle of an outgoing message. The backend has no delivery
 * receipts (no "delivered"/"read" concept), so this only tracks the local
 * send round-trip: optimistic -> confirmed, or failed.
 */
export type MessageDeliveryState = "sending" | "sent" | "failed";

export type MessageAttachmentType = "image" | "video" | "audio" | "document" | "file";

/** A media attachment on a message, straight from the backend's media object. */
export interface MessageAttachment {
  id: string;
  type: MessageAttachmentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  fileUrl: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string | null;
  groupId: string | null;
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
