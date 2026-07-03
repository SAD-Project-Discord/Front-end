import type { Message } from "./message";
import type { User } from "./user";

/**
 * Whether a conversation is a 1:1 DM or a multi-participant group chat.
 * Modeled now so the `Conversation` shape doesn't need to change if/when
 * group chat is introduced later.
 */
export type ConversationType = "direct" | "group";

/**
 * A conversation thread between two or more participants.
 */
export interface Conversation {
  /** Stable unique identifier for the conversation. */
  id: string;

  /** Whether this is a 1:1 direct message or a group conversation. */
  type: ConversationType;

  /** Participants in this conversation. */
  participants: User[];

  /** Optional display name (primarily relevant for group conversations). */
  title?: string;

  /** Optional avatar/image for the conversation (primarily for groups). */
  avatarUrl?: string;

  /** The most recent message in the conversation, for list/preview rendering. */
  lastMessage?: Message;

  /** Count of unread messages for the current user. */
  unreadCount?: number;

  /** ISO 8601 timestamp of conversation creation. */
  createdAt: string;

  /** ISO 8601 timestamp of the most recent activity (message, join, etc.). */
  updatedAt: string;

  /** Whether the current user has muted notifications for this conversation. */
  isMuted?: boolean;

  /** Whether the current user has archived this conversation. */
  isArchived?: boolean;

  /** Whether another participant is currently typing. */
  isTyping?: boolean;
}
