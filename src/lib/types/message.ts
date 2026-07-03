import type { Attachment, MessageType } from "./attachment";

/**
 * Lifecycle status of an outgoing/incoming message.
 *
 * Ordered roughly by progression for outgoing messages:
 * sending -> sent -> delivered -> read, with `failed` as an error branch.
 */
export type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

/**
 * Re-exported here for convenience so consumers of `Message` can import
 * `MessageType` from a single place without reaching into `attachment.ts`.
 */
export type { MessageType };

/**
 * A single message within a conversation.
 *
 * Text/emoji messages populate `body` and omit `attachments`.
 * Media messages (sticker/image/video/audio/document/file) populate
 * `attachments` and may optionally include a `body` (e.g. a text caption
 * sent alongside media, distinct from a per-attachment `caption`).
 */
export interface Message {
  /** Stable unique identifier for the message. */
  id: string;

  /** Identifier of the conversation this message belongs to. */
  conversationId: string;

  /** Identifier of the user who sent this message. */
  senderId: string;

  /** Primary content type of this message. */
  type: MessageType;

  /** Plain-text body. Required for `text` messages, optional otherwise. */
  body?: string;

  /**
   * Media payload(s) for this message.
   * Empty/undefined for `text` and `emoji` message types.
   */
  attachments?: Attachment[];

  /** Delivery/read lifecycle status. */
  status: MessageStatus;

  /** ISO 8601 timestamp of when the message was created/sent. */
  createdAt: string;

  /** ISO 8601 timestamp of the last edit, if the message was edited. */
  editedAt?: string;

  /** ISO 8601 timestamp of deletion, if soft-deleted. */
  deletedAt?: string;

  /** Identifier of the message this one is replying to, if any. */
  replyToMessageId?: string;

  /** Optional map of emoji reactions to arrays of user IDs who reacted. */
  reactions?: Record<string, string[]>;

  /** Client-generated identifier used for optimistic-send reconciliation. */
  clientGeneratedId?: string;
}
