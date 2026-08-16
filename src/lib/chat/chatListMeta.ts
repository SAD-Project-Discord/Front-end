// src/lib/chat/chatListMeta.ts
//
// Groups and channels have no "last activity"/"unread count" data from the
// backend, same gap DMs had before src/lib/chat/dmContacts.ts filled it.
// This is the same client-local pattern generalized for groups/channels: a
// per-account, localStorage-backed activity map keyed by group/channel id,
// updated as messages are sent/received.

export interface ChatListMetaEntry {
  id: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
}

export type ChatListMetaKind = "group" | "channel";

function storageKey(kind: ChatListMetaKind, currentUserId: string): string {
  return `${kind}_meta:${currentUserId}`;
}

export function loadChatListMeta(
  kind: ChatListMetaKind,
  currentUserId: string,
): Record<string, ChatListMetaEntry> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(storageKey(kind, currentUserId));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveChatListMeta(
  kind: ChatListMetaKind,
  currentUserId: string,
  meta: Record<string, ChatListMetaEntry>,
): void {
  localStorage.setItem(storageKey(kind, currentUserId), JSON.stringify(meta));
}

export interface ChatActivity {
  lastMessageAt: string;
  lastMessagePreview: string;
  incrementUnread?: boolean;
}

/** Updates (or creates) the activity entry for `id`, returning the full updated map. */
export function upsertChatListMeta(
  kind: ChatListMetaKind,
  currentUserId: string,
  id: string,
  activity: ChatActivity,
): Record<string, ChatListMetaEntry> {
  const meta = loadChatListMeta(kind, currentUserId);
  const existing = meta[id];

  const next: Record<string, ChatListMetaEntry> = {
    ...meta,
    [id]: {
      id,
      lastMessageAt: activity.lastMessageAt,
      lastMessagePreview: activity.lastMessagePreview,
      unreadCount: activity.incrementUnread ? (existing?.unreadCount ?? 0) + 1 : (existing?.unreadCount ?? 0),
    },
  };

  saveChatListMeta(kind, currentUserId, next);
  return next;
}

export function markChatListMetaRead(
  kind: ChatListMetaKind,
  currentUserId: string,
  id: string,
): Record<string, ChatListMetaEntry> {
  const meta = loadChatListMeta(kind, currentUserId);
  if (!meta[id] || meta[id].unreadCount === 0) return meta;
  const next = { ...meta, [id]: { ...meta[id], unreadCount: 0 } };
  saveChatListMeta(kind, currentUserId, next);
  return next;
}
