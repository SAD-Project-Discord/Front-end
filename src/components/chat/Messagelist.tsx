import type { Attachment, Message, User } from "@/lib/types";
import { DateSeparator } from "./DateSeparator";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { cx } from "./cx";

export interface MessageListProps {
  /** Messages to render, in chronological order (oldest first). */
  messages: Message[];
  /** Map of userId to `User`, used to resolve each message's sender. */
  usersById: Record<string, User>;
  /** ID of the current/local user, used to align own messages. */
  currentUserId: string;
  /** Users currently typing, rendered as a `TypingIndicator` at the bottom. */
  typingUsers?: User[];
  /** Called when the user opens an attachment within a message. */
  onOpenAttachment?: (attachment: Attachment) => void;
  /** Called when the user activates "reply" on a message. */
  onReply?: (message: Message) => void;
  /** Called when the user picks an emoji reaction for a message. */
  onReact?: (message: Message, emoji: string) => void;
  /** Content shown when `messages` is empty. */
  emptyState?: React.ReactNode;
  /** Optional extra class names for layout composition by the parent. */
  className?: string;
}

/**
 * Scrollable, chronologically-grouped list of messages. Inserts
 * `DateSeparator`s between days and collapses consecutive messages from
 * the same sender. Purely presentational — scroll position, pagination,
 * and data fetching are the parent's responsibility.
 */
export function MessageList({
                              messages,
                              usersById,
                              currentUserId,
                              typingUsers = [],
                              onOpenAttachment,
                              onReply,
                              onReact,
                              emptyState,
                              className,
                            }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div
        className={cx(
          "flex flex-1 items-center justify-center px-6 py-10 text-center text-sm text-[#6b6d76]",
          className,
        )}
      >
        {emptyState ?? "No messages yet. Say hello!"}
      </div>
    );
  }

  return (
    <div className={cx("flex flex-1 flex-col overflow-y-auto py-2", className)}>
      {messages.map((message, index) => {
        const previous = messages[index - 1];
        const showDateSeparator = !previous || !isSameDay(previous.createdAt, message.createdAt);

        const isGroupedWithPrevious =
          !showDateSeparator &&
          Boolean(previous) &&
          previous.senderId === message.senderId &&
          minutesBetween(previous.createdAt, message.createdAt) < 5;

        const sender = usersById[message.senderId];

        if (!sender) return null;

        return (
          <div key={message.id}>
            {showDateSeparator ? <DateSeparator date={message.createdAt} /> : null}
            <MessageBubble
              message={message}
              sender={sender}
              isOwnMessage={message.senderId === currentUserId}
              isGroupedWithPrevious={isGroupedWithPrevious}
              onOpenAttachment={onOpenAttachment}
              onReply={onReply}
              onReact={onReact}
            />
          </div>
        );
      })}

      <TypingIndicator users={typingUsers} />
    </div>
  );
}

function isSameDay(isoA: string, isoB: string): boolean {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minutesBetween(isoA: string, isoB: string): number {
  const diffMs = Math.abs(new Date(isoB).getTime() - new Date(isoA).getTime());
  return diffMs / 60_000;
}
