"use client";

import { useMemo, useState } from "react";
import type { Attachment, Conversation, Message, User } from "@/lib/types";
import {
  CURRENT_USER_ID,
  currentUser,
  mockConversations,
  mockMessages,
  mockUsers,
} from "@/lib/chat/mockData";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ConversationList } from "@/components/chat/ConversationList";
import { MessageList } from "@/components/chat/MessageList";
import { cx } from "@/components/chat/cx";

const usersById: Record<string, User> = Object.fromEntries(
  mockUsers.map((user) => [user.id, user]),
);

function otherParticipant(conversation: Conversation): User | undefined {
  return conversation.participants.find((p) => p.id !== CURRENT_USER_ID);
}

function conversationTitle(conversation: Conversation): string {
  if (conversation.title) return conversation.title;
  const other = otherParticipant(conversation);
  return other?.displayName ?? "Conversation";
}

function sortByRecentActivity(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export default function DirectMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(
    () => sortByRecentActivity(mockConversations),
  );
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [activeConversationId, setActiveConversationId] = useState<
    string | undefined
  >(() => sortByRecentActivity(mockConversations)[0]?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState("");

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const title = conversationTitle(conversation).toLowerCase();
      const participantNames = conversation.participants
        .map((p) => p.displayName.toLowerCase())
        .join(" ");
      return title.includes(query) || participantNames.includes(query);
    });
  }, [conversations, searchQuery]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId],
  );

  const activeMessages = useMemo(() => {
    if (!activeConversationId) return [];
    return messages
      .filter((m) => m.conversationId === activeConversationId)
      .sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }, [messages, activeConversationId]);

  const typingUsers = useMemo(() => {
    if (!activeConversation?.isTyping) return [];
    const other = otherParticipant(activeConversation);
    return other ? [other] : [];
  }, [activeConversation]);

  function handleSelectConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );
  }

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || !activeConversationId) return;

    const now = new Date().toISOString();
    const newMessage: Message = {
      id: `message_local_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: CURRENT_USER_ID,
      type: "text",
      body: trimmed,
      status: "sent",
      createdAt: now,
      clientGeneratedId: `client_${Date.now()}`,
    };

    setMessages((prev) => [...prev, newMessage]);
    setConversations((prev) =>
      sortByRecentActivity(
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, lastMessage: newMessage, updatedAt: now }
            : c,
        ),
      ),
    );
    setDraft("");
  }

  function handleOpenAttachment(attachment: Attachment) {
    window.open(attachment.url, "_blank", "noopener,noreferrer");
  }

  const isConversationViewOpen = Boolean(activeConversationId);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#0f1013] text-[#e7e8ec]">
      {/* Sidebar: search + conversation list */}
      <aside
        className={cx(
          "w-full shrink-0 flex-col border-r border-white/5 bg-[#1a1b1f] md:flex md:w-[340px] lg:w-[380px]",
          isConversationViewOpen ? "hidden" : "flex",
        )}
      >
        <div className="shrink-0 px-4 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#2f303a] text-xs font-medium">
              {currentUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span aria-hidden="true">
                  {currentUser.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <h1 className="text-[15px] font-semibold text-[#e7e8ec]">
              Direct Messages
            </h1>
          </div>

          <label className="relative mt-3 block">
            <span className="sr-only">Search conversations</span>
            <SearchGlyph className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6d76]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search conversations"
              className={cx(
                "w-full rounded-lg bg-[#0f1013] py-2 pl-9 pr-3 text-[13px] text-[#e7e8ec]",
                "placeholder:text-[#6b6d76] focus:outline-none focus:ring-2 focus:ring-[#5b6ef5]",
              )}
            />
          </label>
        </div>

        <ConversationList
          conversations={filteredConversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          emptyState={
            searchQuery
              ? `No conversations match “${searchQuery}”`
              : "No conversations yet"
          }
          className="flex-1"
        />
      </aside>

      {/* Main pane: header, messages, composer */}
      <section
        className={cx(
          "min-w-0 flex-1 flex-col bg-[#17181c] md:flex",
          isConversationViewOpen ? "flex" : "hidden",
        )}
      >
        {activeConversation ? (
          <>
            <ChatHeader
              conversation={activeConversation}
              onBack={() => setActiveConversationId(undefined)}
              onCall={() => {}}
              onVideoCall={() => {}}
              onSearch={() => {}}
            />

            <MessageList
              messages={activeMessages}
              usersById={usersById}
              currentUserId={CURRENT_USER_ID}
              typingUsers={typingUsers}
              onOpenAttachment={handleOpenAttachment}
              className="min-h-0"
            />

            <ChatInput
              value={draft}
              onChange={setDraft}
              onSend={handleSend}
              onAttachFiles={() => {}}
              onOpenEmojiPicker={() => {}}
              onOpenStickerPicker={() => {}}
              placeholder={`Message ${conversationTitle(activeConversation)}`}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-[#6b6d76]">
            Select a conversation to start chatting
          </div>
        )}
      </section>
    </div>
  );
}

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M21 21l-4.3-4.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
