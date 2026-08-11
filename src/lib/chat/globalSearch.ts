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
export function mapGlobalSearchResults(messages: ApiMessage[], currentUserId: string): MessageSearchResultItem[] {
  const dmContacts = loadDmContacts(currentUserId);

  return messages.map((m) => {
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
}
