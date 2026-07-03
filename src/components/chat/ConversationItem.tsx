import type { Conversation } from "@/lib/types";
import { cx } from "./cx";

export interface ConversationItemProps {
  /** The conversation this row represents. */
  conversation: Conversation;
  /** Whether this conversation is the currently active/selected one. */
  isActive?: boolean;
  /** Called when the row is activated (click or Enter/Space). */
  onSelect: (conversationId: string) => void;
}

/**
 * A single row within `ConversationList`. Shows avatar, name, last
 * message preview, timestamp, and unread/mute indicators.
 */
export function ConversationItem({
                                   conversation,
                                   isActive = false,
                                   onSelect,
                                 }: ConversationItemProps) {
  const isDirect = conversation.type === "direct";
  const primaryParticipant = conversation.participants[0];
  const title =
    conversation.title ??
    (isDirect ? primaryParticipant?.displayName : "Unnamed conversation") ??
    "Conversation";

  const preview = formatPreview(conversation);
  const hasUnread = Boolean(conversation.unreadCount && conversation.unreadCount > 0);

  return (
    <li role="none">
    <button
      type="button"
  role="option"
  aria-selected={isActive}
  onClick={() => onSelect(conversation.id)}
  className={cx(
    "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
    "transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b6ef5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1f24]",
    isActive ? "bg-[#5b6ef5]/15" : "hover:bg-white/5",
)}
>
  <span className="relative shrink-0">
  <span
    className={cx(
    "flex h-11 w-11 items-center justify-center overflow-hidden rounded-full",
    "bg-[#2f303a] text-sm font-medium text-[#e7e8ec]",
)}
>
  {conversation.avatarUrl || (isDirect && primaryParticipant?.avatarUrl) ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={conversation.avatarUrl ?? primaryParticipant?.avatarUrl}
    alt=""
    className="h-full w-full object-cover"
      />
  ) : (
    <span aria-hidden="true">{title.charAt(0).toUpperCase()}</span>
  )}
  </span>
  {isDirect && primaryParticipant?.isOnline ? (
      <span
        aria-hidden="true"
    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#1e1f24] bg-[#3ba55d]"
      />
  ) : null}
  </span>

  <span className="flex min-w-0 flex-1 flex-col">
  <span className="flex items-center justify-between gap-2">
  <span
    className={cx(
    "truncate text-[15px] leading-tight",
    hasUnread ? "font-semibold text-[#e7e8ec]" : "font-medium text-[#d3d4d9]",
)}
>
  {title}
  </span>
  {conversation.updatedAt ? (
    <span
      className={cx(
      "shrink-0 text-[11px] leading-tight",
      hasUnread ? "text-[#5b6ef5]" : "text-[#6b6d76]",
  )}
  >
    {formatRelativeTime(conversation.updatedAt)}
    </span>
  ) : null}
  </span>

  <span className="flex items-center justify-between gap-2">
  <span
    className={cx(
    "truncate text-[13px] leading-tight",
    hasUnread ? "text-[#c3c4cb]" : "text-[#8a8b93]",
)}
>
  {conversation.isMuted ? (
    <MuteIcon className="mr-1 inline-block h-3 w-3 align-[-1px] text-[#6b6d76]" />
  ) : null}
  {preview}
  </span>

  {hasUnread ? (
    <span
      className={cx(
      "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5",
      "bg-[#5b6ef5] text-[11px] font-semibold text-white",
  )}
  >
    {conversation.unreadCount && conversation.unreadCount > 99
      ? "99+"
      : conversation.unreadCount}
    </span>
  ) : null}
  </span>
  </span>
  </button>
  </li>
);
}

function formatPreview(conversation: Conversation): string {
  const message = conversation.lastMessage;
  if (!message) return "No messages yet";

  if (message.type === "text" || message.type === "emoji") {
    return message.body ?? "";
  }

  const attachmentLabels: Record<string, string> = {
    sticker: "Sticker",
    image: "Photo",
    video: "Video",
    audio: "Audio message",
    document: "Document",
    file: "File",
  };

  return attachmentLabels[message.type] ?? "Attachment";
}

function formatRelativeTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function MuteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
  <path
    d="M4 9v6h4l5 5V4L8 9H4z"
  stroke="currentColor"
  strokeWidth="1.6"
  strokeLinejoin="round"
  />
  <path d="M18 4L4 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
);
}
