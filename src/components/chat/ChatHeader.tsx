import type { Conversation } from "@/lib/types";
import { cx } from "./cx";

export interface ChatHeaderProps {
  /** The conversation currently being viewed. */
  conversation: Conversation;
  /** Called when the user activates the back button (mobile navigation). */
  onBack?: () => void;
  /** Called when the user clicks the conversation title/avatar (e.g. open info panel). */
  onOpenDetails?: () => void;
  /** Called when the user activates the call action. */
  onCall?: () => void;
  /** Called when the user activates the video call action. */
  onVideoCall?: () => void;
  /** Called when the user activates the search-in-conversation action. */
  onSearch?: () => void;
  /** Optional extra class names for layout composition by the parent. */
  className?: string;
}

/**
 * Sticky top bar for an active conversation: avatar, name, presence,
 * and quick actions. Purely presentational — all interactions are
 * delegated via callback props.
 */
export function ChatHeader({
                             conversation,
                             onBack,
                             onOpenDetails,
                             onCall,
                             onVideoCall,
                             onSearch,
                             className,
                           }: ChatHeaderProps) {
  const isDirect = conversation.type === "direct";
  const primaryParticipant = conversation.participants[0];

  const title =
    conversation.title ??
    (isDirect ? primaryParticipant?.displayName : "Unnamed conversation") ??
    "Conversation";

  const isOnline = isDirect ? primaryParticipant?.isOnline : undefined;

  return (
    <header
      className={cx(
      "flex h-16 shrink-0 items-center gap-3 border-b border-white/5",
      "bg-[#1e1f24]/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-[#1e1f24]/80",
      "sm:px-4",
      className,
  )}
>
  {onBack ? (
      <button
        type="button"
    onClick={onBack}
    aria-label="Back to conversations"
    className={cx(
      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#96979f]",
      "transition-colors duration-150 hover:bg-white/5 hover:text-[#e7e8ec]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b6ef5]",
      "md:hidden",
  )}
  >
    <BackIcon />
    </button>
  ) : null}

  <button
    type="button"
  onClick={onOpenDetails}
  disabled={!onOpenDetails}
  className={cx(
    "flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-1 text-left",
    "transition-colors duration-150",
    onOpenDetails && "hover:bg-white/5",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b6ef5]",
)}
>
  <span className="relative shrink-0">
  <span
    className={cx(
    "flex h-9 w-9 items-center justify-center overflow-hidden rounded-full",
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
  {isOnline !== undefined ? (
      <span
        aria-hidden="true"
    className={cx(
      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#1e1f24]",
      isOnline ? "bg-[#3ba55d]" : "bg-[#6b6d76]",
  )}
    />
  ) : null}
  </span>

  <span className="flex min-w-0 flex-col">
  <span className="truncate text-[15px] font-semibold leading-tight text-[#e7e8ec]">
    {title}
    </span>
    <span className="truncate text-xs leading-tight text-[#96979f]">
    {conversation.isTyping
        ? "typing…"
        : isDirect
          ? isOnline
            ? "Online"
            : "Offline"
          : `${conversation.participants.length} members`}
    </span>
    </span>
    </button>

    <div className="flex shrink-0 items-center gap-1">
    {onSearch ? (
        <HeaderIconButton label="Search" onClick={onSearch}>
        <SearchIcon />
        </HeaderIconButton>
) : null}
  {onCall ? (
    <HeaderIconButton label="Start voice call" onClick={onCall}>
    <PhoneIcon />
    </HeaderIconButton>
  ) : null}
  {onVideoCall ? (
    <HeaderIconButton label="Start video call" onClick={onVideoCall}>
    <VideoIcon />
    </HeaderIconButton>
  ) : null}
  </div>
  </header>
);
}

function HeaderIconButton({
                            label,
                            onClick,
                            children,
                          }: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
  onClick={onClick}
  aria-label={label}
  title={label}
  className={cx(
    "flex h-9 w-9 items-center justify-center rounded-full text-[#96979f]",
    "transition-all duration-150 hover:bg-white/5 hover:text-[#e7e8ec] active:scale-95",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b6ef5]",
)}
>
  {children}
  </button>
);
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
  <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path
    d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.9 3 3.4 3.4 3 4 3h3.8c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1l-2 2.3z"
  stroke="currentColor"
  strokeWidth="1.6"
  strokeLinejoin="round"
    />
    </svg>
);
}

function VideoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <rect x="2.5" y="6.5" width="13" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
  <path d="M18.5 10l3.2-2v8l-3.2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
);
}
