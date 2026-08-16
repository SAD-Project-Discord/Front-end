import type { ApiMessage } from "@/lib/api/messages";
import { loadDmContacts } from "@/lib/chat/dmContacts";
import groupStore from "@/stores/GroupStore";
import channelStore from "@/stores/ChannelStore";
import type { MessageSearchResultItem } from "@/components/chat/SearchOverlay";

/**
 * Maps raw global-search API results to display items, resolving each
 * message's conversation name from whichever section it belongs to.
 * `groupStore.myGroups`/`channelStore.myChannels` are plain MobX singletons,
 * so this works regardless of which page (dm/groups/channels) the search
 * was triggered from — callers should make sure those stores are loaded
 * (e.g. by calling `loadMyGroups`/`loadMyChannels`) before opening global
 * search from a page that doesn't already load them itself.
 */
export function mapGlobalSearchResults(
  messages: ApiMessage[],
  currentUserId: string,
  query?: string,
): MessageSearchResultItem[] {
  const dmContacts = loadDmContacts(currentUserId);

  const contentMatches: MessageSearchResultItem[] = messages.map((m) => {
    if (m.group_id) {
      const group = groupStore.myGroups.find((g) => g.id === m.group_id);
      return {
        id: m.id,
        content: m.content,
        createdAt: m.created_at,
        senderId: m.sender_id,
        otherUserId: m.group_id,
        otherUserName: group?.name ?? "Group",
        scope: "group",
      };
    }

    if (m.channel_id) {
      const channel = channelStore.myChannels.find((c) => c.id === m.channel_id);
      return {
        id: m.id,
        content: m.content,
        createdAt: m.created_at,
        senderId: m.sender_id,
        otherUserId: m.channel_id,
        otherUserName: channel?.name ?? "Channel",
        scope: "channel",
      };
    }

    const otherUserId = (m.sender_id === currentUserId ? m.receiver_id : m.sender_id) ?? m.sender_id;
    const contact = dmContacts.find((c) => c.userId === otherUserId);
    return {
      id: m.id,
      content: m.content,
      createdAt: m.created_at,
      senderId: m.sender_id,
      otherUserId,
      otherUserName: contact?.name ?? otherUserId,
      otherUserAvatarUrl: contact?.avatarUrl,
      scope: "direct",
    };
  });

  if (!query?.trim()) return contentMatches;
  return [...contentMatches, ...mapTitleMatches(query, currentUserId, contentMatches)];
}

/**
 * Chats whose name matches the query but that have no message-content hit
 * among `existingMatches` — so e.g. searching "dybudd" surfaces a chat named
 * "howdybuddy" even though none of its messages contain that substring.
 */
export function mapTitleMatches(
  query: string,
  currentUserId: string,
  existingMatches: MessageSearchResultItem[],
): MessageSearchResultItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const alreadyMatchedIds = new Set(existingMatches.map((m) => m.otherUserId));
  const results: MessageSearchResultItem[] = [];

  for (const group of groupStore.myGroups) {
    if (!alreadyMatchedIds.has(group.id) && group.name.toLowerCase().includes(needle)) {
      results.push({
        id: `title:group:${group.id}`,
        content: "",
        createdAt: group.updated_at ?? group.created_at ?? new Date().toISOString(),
        senderId: "",
        otherUserId: group.id,
        otherUserName: group.name,
        scope: "group",
        isTitleMatch: true,
      });
    }
  }

  for (const channel of channelStore.myChannels) {
    if (!alreadyMatchedIds.has(channel.id) && channel.name.toLowerCase().includes(needle)) {
      results.push({
        id: `title:channel:${channel.id}`,
        content: "",
        createdAt: channel.updated_at ?? channel.created_at ?? new Date().toISOString(),
        senderId: "",
        otherUserId: channel.id,
        otherUserName: channel.name,
        scope: "channel",
        isTitleMatch: true,
      });
    }
  }

  for (const contact of loadDmContacts(currentUserId)) {
    if (!alreadyMatchedIds.has(contact.userId) && contact.name.toLowerCase().includes(needle)) {
      results.push({
        id: `title:direct:${contact.userId}`,
        content: "",
        createdAt: contact.lastMessageAt || new Date().toISOString(),
        senderId: "",
        otherUserId: contact.userId,
        otherUserName: contact.name,
        otherUserAvatarUrl: contact.avatarUrl,
        scope: "direct",
        isTitleMatch: true,
      });
    }
  }

  return results;
}
