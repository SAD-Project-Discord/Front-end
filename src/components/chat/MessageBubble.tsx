import type { Attachment, Message, User } from "@/lib/types";
import { AttachmentRenderer } from "./AttachmentRenderer";
import { cx } from "./cx";

export interface MessageBubbleProps {
  /** The message to render. */
  message: Message;
  /** The user who sent this message (for avatar/name display). */
  sender: User;
  /** Whether this message was sent by the current/local user. */
  isOwnMessage: boolean;
  /**
   * Whether this bubble is grouped with the previous message from the
   * same sender (hides avatar/name, tightens vertical spacing).
   */
  isGroupedWithPrevious?: boolean;
  /** Called when the user opens an attachment within this message. */
  onOpenAttachment?: (attachment: Attachment) => void;
  /** Called when the user activates "reply" on this message. */
  onReply?: (message: Message) => void;
  /** Called when the user picks an emoji reaction for this message. */
  onReact?: (message: Message, emoji: string) => void;
}

/**
 * A single chat message: avatar/name (when not grouped), body text or
 * attachments, timestamp, and delivery status. Purely presentational.
 */
export function MessageBubble({
                                message,
                                sender,
                                isOwnMessage,
                                isGroupedWithPrevious = false,
                                onOpenAttachment,
                                onReply,
                                onReact,
                              }: MessageBubbleProps) {
  const isDeleted = Boolean(message.deletedAt);

  return (
    <div
      className={cx(
        "group/message flex items-end gap-2.5 px-3 sm:px-4",
        isGroupedWithPrevious ? "mt-0.5" : "mt-3",
        isOwnMessage && "flex-row-reverse",
      )}
    >
      <div className="w-8 shrink-0">
        {!isGroupedWithPrevious ? (
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#2f303a] text-xs font-medium text-[#e7e8ec]">
            {sender.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sender.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden="true">{sender.displayName.charAt(0).toUpperCase()}</span>
            )}
          </span>
        ) : null}
      </div>

      <div className={cx("flex max-w-[75%] flex-col sm:max-w-[60%]", isOwnMessage && "items-end")}>
        {!isGroupedWithPrevious ? (
          <span
            className={cx(
              "mb-1 px-1 text-xs font-medium text-[#8a8b93]",
              isOwnMessage && "text-right",
            )}
          >
            {sender.displayName}
          </span>
        ) : null}

        <div className={cx("flex items-end gap-1.5", isOwnMessage && "flex-row-reverse")}>
          <div
            className={cx(
              "relative rounded-2xl px-3.5 py-2",
              "transition-colors duration-150",
              isOwnMessage
                ? "rounded-br-md bg-[#5b6ef5] text-white"
                : "rounded-bl-md bg-[#2b2c34] text-[#e7e8ec]",
              isGroupedWithPrevious && (isOwnMessage ? "rounded-tr-2xl" : "rounded-tl-2xl"),
            )}
          >
            {isDeleted ? (
              <p className="text-[14px] italic leading-snug text-white/60">
                This message was deleted
              </p>
            ) : (
              <>
                {message.body && (message.type === "text" || message.type === "emoji") ? (
                  <p
                    className={cx(
                      "whitespace-pre-wrap break-words leading-snug",
                      message.type === "emoji" ? "text-4xl leading-tight" : "text-[14px]",
                    )}
                  >
                    {message.body}
                  </p>
                ) : null}

                {message.attachments && message.attachments.length > 0 ? (
                  <div
                    className={cx(
                      "flex flex-col gap-2",
                      message.body ? "mt-2" : undefined,
                    )}
                  >
                    {message.attachments.map((attachment) => (
                      <AttachmentRenderer
                        key={attachment.id}
                        attachment={attachment}
                        onOpen={onOpenAttachment}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>

          {!isDeleted ? (
            <MessageHoverActions onReply={onReply ? () => onReply(message) : undefined} onReact={onReact ? (emoji) => onReact(message, emoji) : undefined} />
          ) : null}
        </div>

        <div
          className={cx(
            "mt-0.5 flex items-center gap-1 px-1 text-[11px] text-[#6b6d76]",
            isOwnMessage && "flex-row-reverse",
          )}
        >
          <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
          {message.editedAt ? <span>(edited)</span> : null}
          {isOwnMessage ? <MessageStatusIcon status={message.status} /> : null}
        </div>

        {message.reactions && Object.keys(message.reactions).length > 0 ? (
          <div className={cx("mt-1 flex flex-wrap gap-1", isOwnMessage && "justify-end")}>
            {Object.entries(message.reactions).map(([emoji, userIds]) => (
              <span
                key={emoji}
                className="flex items-center gap-1 rounded-full bg-[#2f303a] px-2 py-0.5 text-xs text-[#c3c4cb]"
              >
                <span aria-hidden="true">{emoji}</span>
                <span>{userIds.length}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MessageHoverActions({
                               onReply,
                               onReact,
                             }: {
  onReply?: () => void;
  onReact?: (emoji: string) => void;
}) {
  if (!onReply && !onReact) return null;

  return (
    <div
      className={cx(
        "flex items-center gap-0.5 opacity-0 transition-opacity duration-150",
        "group-hover/message:opacity-100",
      )}
    >
      {onReact ? (
        <button
          type="button"
          onClick={() => onReact("👍")}
          aria-label="React with thumbs up"
          className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-[#96979f] transition-colors hover:bg-white/5 hover:text-[#e7e8ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b6ef5]"
        >
          🙂
        </button>
      ) : null}
      {onReply ? (
        <button
          type="button"
          onClick={onReply}
          aria-label="Reply to message"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#96979f] transition-colors hover:bg-white/5 hover:text-[#e7e8ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b6ef5]"
        >
          <ReplyIcon />
        </button>
      ) : null}
    </div>
  );
}

function MessageStatusIcon({ status }: { status: Message["status"] }) {
  switch (status) {
    case "sending":
      return <span aria-label="Sending">●</span>;
    case "sent":
      return <span aria-label="Sent">✓</span>;
    case "delivered":
      return <span aria-label="Delivered">✓✓</span>;
    case "read":
      return (
        <span aria-label="Read" className="text-[#5b6ef5]">
          ✓✓
        </span>
      );
    case "failed":
      return (
        <span aria-label="Failed to send" className="text-red-400">
          ⚠
        </span>
      );
    default:
      return null;
  }
}

function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function ReplyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 10L4 15l5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 15h11a5 5 0 005-5V6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
