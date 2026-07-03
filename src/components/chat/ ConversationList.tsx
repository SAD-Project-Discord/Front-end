import type { Conversation } from "@/lib/types";
import { ConversationItem } from "./ConversationItem";
import { cx } from "./cx";

export interface ConversationListProps {
  /** Conversations to render, in display order. */
  conversations: Conversation[];
  /** ID of the currently active conversation, if any. */
  activeConversationId?: string;
  /** Called when a conversation row is selected. */
  onSelectConversation: (conversationId: string) => void;
  /** Optional heading rendered above the list (e.g. "Direct Messages"). */
  heading?: string;
  /** Content shown when `conversations` is empty. */
  emptyState?: React.ReactNode;
  /** Optional extra class names for layout composition by the parent. */
  className?: string;
}

/**
 * Scrollable sidebar list of conversations. Purely presentational and
 * stateless — selection state and data both come from props.
 */
export function ConversationList({
                                   conversations,
                                   activeConversationId,
                                   onSelectConversation,
                                   heading,
                                   emptyState,
                                   className,
                                 }: ConversationListProps) {
  return (
    <nav
      aria-label={heading ?? "Conversations"}
      className={cx("flex h-full flex-col bg-[#1a1b1f]", className)}
    >
      {heading ? (
        <h2 className="px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-[#6b6d76]">
          {heading}
        </h2>
      ) : null}

      {conversations.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 py-10 text-center text-sm text-[#6b6d76]">
          {emptyState ?? "No conversations yet"}
        </div>
      ) : (
        <ul
          role="listbox"
          aria-label={heading ?? "Conversations"}
          className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2"
        >
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeConversationId}
              onSelect={onSelectConversation}
            />
          ))}
        </ul>
      )}
    </nav>
  );
}
