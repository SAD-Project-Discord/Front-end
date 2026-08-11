// src/lib/chat/dmContacts.ts
//
// The backend has no "list my DM conversations" endpoint (only per-partner
// message history via /messages/direct/{user_id}). This module fills that
// gap on the client: a per-account, localStorage-backed list of people the
// current user has actually exchanged messages with, used to populate the
// DM sidebar. It's updated as messages are sent/received and when a new DM
// is started via the "New Direct Message" dialog.

export interface DmContact {
  userId: string;
  username: string;
  name: string;
  avatarUrl: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
}

function storageKey(currentUserId: string): string {
  return `dm_contacts:${currentUserId}`;
}

export function loadDmContacts(currentUserId: string): DmContact[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(storageKey(currentUserId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDmContacts(currentUserId: string, contacts: DmContact[]): void {
  localStorage.setItem(storageKey(currentUserId), JSON.stringify(contacts));
}

export interface ContactActivity {
  lastMessageAt: string;
  lastMessagePreview: string;
  incrementUnread?: boolean;
}

/** Adds a contact (if new) or updates their profile/activity, returning the full updated list. */
export function upsertDmContact(
  currentUserId: string,
  profile: Pick<DmContact, "userId" | "username" | "name" | "avatarUrl">,
  activity?: ContactActivity,
): DmContact[] {
  const contacts = loadDmContacts(currentUserId);
  const index = contacts.findIndex((c) => c.userId === profile.userId);
  const existing = index >= 0 ? contacts[index] : undefined;

  const next: DmContact = {
    userId: profile.userId,
    username: profile.username,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    lastMessageAt: activity?.lastMessageAt ?? existing?.lastMessageAt ?? new Date().toISOString(),
    lastMessagePreview: activity?.lastMessagePreview ?? existing?.lastMessagePreview ?? "",
    unreadCount: activity?.incrementUnread ? (existing?.unreadCount ?? 0) + 1 : (existing?.unreadCount ?? 0),
  };

  const updated =
    index >= 0 ? [...contacts.slice(0, index), next, ...contacts.slice(index + 1)] : [...contacts, next];
  saveDmContacts(currentUserId, updated);
  return updated;
}

export function markDmContactRead(currentUserId: string, userId: string): DmContact[] {
  const updated = loadDmContacts(currentUserId).map((c) =>
    c.userId === userId ? { ...c, unreadCount: 0 } : c,
  );
  saveDmContacts(currentUserId, updated);
  return updated;
}

export function removeDmContact(currentUserId: string, userId: string): DmContact[] {
  const updated = loadDmContacts(currentUserId).filter((c) => c.userId !== userId);
  saveDmContacts(currentUserId, updated);
  return updated;
}
