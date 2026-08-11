"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import AddRounded from "@mui/icons-material/AddRounded";
import TagRounded from "@mui/icons-material/TagRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import KeyboardDoubleArrowDownRounded from "@mui/icons-material/KeyboardDoubleArrowDownRounded";
import ScheduleSendRounded from "@mui/icons-material/ScheduleSendRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import TravelExploreRounded from "@mui/icons-material/TravelExploreRounded";
import { observer } from "mobx-react-lite";

import type { Message, MessageAttachment, User } from "@/lib/types";
import { messagesApi } from "@/lib/api/messages";
import type { ApiMessage } from "@/lib/api/messages";
import { scheduledMessagesApi } from "@/lib/api/scheduledMessages";
import { ApiError } from "@/lib/api/api";
import { usersApi } from "@/lib/api/users";
import { chatWs } from "@/lib/api/chat";
import { apiMessageToMessage } from "@/lib/chat/mappers";
import { mapGlobalSearchResults } from "@/lib/chat/globalSearch";
import { chatSurfaces } from "@/lib/theme/theme";

import authStore from "@/stores/AuthStore";
import channelStore from "@/stores/ChannelStore";
import groupStore from "@/stores/GroupStore";
import type { Channel } from "@/types/channel";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { SearchOverlay, type MessageSearchResultItem } from "@/components/chat/SearchOverlay";
import CreateChannelModal from "@/components/channel/CreateChannelModal";
import ChannelMembersDialog from "@/components/channel/ChannelMembersDialog";

const PAGE_SIZE = 30;
const TYPING_STOP_DELAY_MS = 2000;
const TYPING_CLEAR_TIMEOUT_MS = 5000;

function byCreatedAtAsc(a: Message, b: Message): number {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

function mergeMessage(list: Message[], incoming: Message): Message[] {
  const idx = list.findIndex((m) => m.id === incoming.id);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = incoming;
    return next;
  }
  return [...list, incoming].sort(byCreatedAtAsc);
}

function ChannelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = authStore.user;

  const [activeChannelId, setActiveChannelId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [isViewingSearchContext, setIsViewingSearchContext] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | undefined>(undefined);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [typingNames, setTypingNames] = useState<Map<string, string>>(new Map());

  const [createOpen, setCreateOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  const [avatarByUserId, setAvatarByUserId] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; severity: "error" | "success" } | null>(null);

  const activeChannelIdRef = useRef<string | undefined>(undefined);
  const currentUserIdRef = useRef<string | undefined>(undefined);
  const pendingHighlightRef = useRef<string | null>(null);
  const typingClearTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isTypingSentRef = useRef(false);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avatarFetchStarted = useRef<Set<string>>(new Set());

  useEffect(() => {
    activeChannelIdRef.current = activeChannelId;
  }, [activeChannelId]);
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id;
  }, [currentUser]);

  const activeChannel = useMemo(
    () => channelStore.myChannels.find((c) => c.id === activeChannelId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelStore.myChannels, activeChannelId],
  );

  const participantsById = useMemo(() => {
    const map: Record<string, User> = {};
    for (const member of channelStore.channelMembers) {
      map[member.user_id] = {
        id: member.user_id,
        username: member.username,
        displayName: member.name,
        avatarUrl: avatarByUserId[member.user_id],
      };
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelStore.channelMembers, avatarByUserId]);

  // ---- bootstrap: my channels ----
  useEffect(() => {
    // A fresh page load only rehydrates authStore's tokens, not the user
    // profile (see AuthStore.hydrateUser's doc comment) — without this,
    // `currentUser` below stays null forever on a direct navigation here.
    authStore.hydrateUser();
    channelStore.loadMyChannels();
  }, []);

  // ---- websocket lifecycle ----
  useEffect(() => {
    if (!currentUser) return;

    chatWs.connect();

    function handleMessageNew(data: ApiMessage) {
      if (!data.channel_id) return;
      const mapped = apiMessageToMessage(data);
      if (data.channel_id === activeChannelIdRef.current) {
        setMessages((prev) => mergeMessage(prev, mapped));
      }
    }

    function handleMessageUpdated(data: ApiMessage) {
      if (!data.channel_id || data.channel_id !== activeChannelIdRef.current) return;
      setMessages((prev) => mergeMessage(prev, apiMessageToMessage(data)));
    }

    function handleMessageDeleted(data: { id: string }) {
      setMessages((prev) => prev.map((m) => (m.id === data.id ? { ...m, isDeleted: true } : m)));
    }

    function handleTyping(data: { user_id: string; is_typing: boolean; room: string }) {
      const me = currentUserIdRef.current;
      const channelId = activeChannelIdRef.current;
      if (!me || !channelId || data.user_id === me) return;
      if (data.room !== `channel_${channelId}`) return;

      const member = channelStore.channelMembers.find((m) => m.user_id === data.user_id);
      const name = member?.name ?? data.user_id;

      const existingTimer = typingClearTimers.current.get(data.user_id);
      if (existingTimer) clearTimeout(existingTimer);

      if (data.is_typing) {
        setTypingNames((prev) => new Map(prev).set(data.user_id, name));
        const timer = setTimeout(() => {
          setTypingNames((prev) => {
            const next = new Map(prev);
            next.delete(data.user_id);
            return next;
          });
        }, TYPING_CLEAR_TIMEOUT_MS);
        typingClearTimers.current.set(data.user_id, timer);
      } else {
        setTypingNames((prev) => {
          const next = new Map(prev);
          next.delete(data.user_id);
          return next;
        });
      }
    }

    // Not emitted by the live backend yet — see docs/BACKEND_REQUIREMENTS.md.
    // Handles both "I was removed" (evict + kick out of the conversation if
    // it's open) and "someone else was removed while I'm looking at this
    // channel's member list" (just drop them from the loaded list).
    function handleChannelMemberRemoved(data: { channel_id: string; user_id: string }) {
      const me = currentUserIdRef.current;
      if (!me) return;

      if (data.user_id === me) {
        channelStore.evictChannel(data.channel_id);
        chatWs.unsubscribeFromRoom({ type: "channel", target_id: data.channel_id });
        if (activeChannelIdRef.current === data.channel_id) {
          setActiveChannelId(undefined);
          setToast({ message: "You were removed from this channel.", severity: "error" });
        }
        return;
      }

      if (data.channel_id === activeChannelIdRef.current) {
        channelStore.removeMemberLocally(data.user_id);
      }
    }

    chatWs.on("message.new", handleMessageNew);
    chatWs.on("message.updated", handleMessageUpdated);
    chatWs.on("message.deleted", handleMessageDeleted);
    chatWs.on("typing", handleTyping);
    chatWs.on("channel.member_removed", handleChannelMemberRemoved);

    return () => {
      chatWs.off("message.new", handleMessageNew);
      chatWs.off("message.updated", handleMessageUpdated);
      chatWs.off("message.deleted", handleMessageDeleted);
      chatWs.off("typing", handleTyping);
      chatWs.off("channel.member_removed", handleChannelMemberRemoved);
      chatWs.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const fetchInitialPage = useCallback((channelId: string) => {
    setLoadingMessages(true);
    setIsViewingSearchContext(false);
    messagesApi
      .getChannelMessages(channelId, PAGE_SIZE)
      .then((res) => {
        const mapped = res.data.map(apiMessageToMessage).sort(byCreatedAtAsc);
        setMessages(mapped);
        setHasMoreOlder(res.meta.has_more);

        if (pendingHighlightRef.current) {
          const target = pendingHighlightRef.current;
          pendingHighlightRef.current = null;
          if (mapped.some((m) => m.id === target)) setHighlightMessageId(target);
        }
      })
      .catch(() => setToast({ message: "Couldn't load messages for this channel.", severity: "error" }))
      .finally(() => setLoadingMessages(false));
  }, []);

  const activateChannel = useCallback(
    (channelId: string) => {
      setMessages([]);
      setHasMoreOlder(false);
      setTypingNames(new Map());
      setHighlightMessageId(undefined);
      chatWs.subscribeToRoom({ type: "channel", target_id: channelId });
      fetchInitialPage(channelId);
      channelStore.loadChannelMembers(channelId);
    },
    [fetchInitialPage],
  );

  // ---- load a channel's messages + members when the active channel changes ----
  useEffect(() => {
    if (!activeChannelId) return;
    // Synchronizing to an external system (the WS room subscription) plus
    // the view state that goes with switching channels — a legitimate effect,
    // not state derivable from render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    activateChannel(activeChannelId);
    return () => {
      chatWs.unsubscribeFromRoom({ type: "channel", target_id: activeChannelId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId]);

  // ---- lazily resolve avatars for members (not included in the members payload) ----
  useEffect(() => {
    const toFetch = channelStore.channelMembers.filter(
      (m) => !avatarFetchStarted.current.has(m.user_id) && avatarByUserId[m.user_id] === undefined,
    );
    if (toFetch.length === 0) return;

    toFetch.forEach((m) => avatarFetchStarted.current.add(m.user_id));
    Promise.all(
      toFetch.map((m) =>
        usersApi
          .getUser(m.user_id)
          .then((res) => [m.user_id, res.data.avatar_url] as const)
          .catch(() => [m.user_id, ""] as const),
      ),
    ).then((results) => {
      setAvatarByUserId((prev) => {
        const next = { ...prev };
        for (const [id, url] of results) next[id] = url;
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelStore.channelMembers]);

  const handleLoadOlder = useCallback(() => {
    if (!activeChannelId || messages.length === 0 || loadingOlder || !hasMoreOlder) return;
    const oldest = messages[0];
    setLoadingOlder(true);
    messagesApi
      .getChannelMessages(activeChannelId, PAGE_SIZE, oldest.id)
      .then((res) => {
        const mapped = res.data.map(apiMessageToMessage).sort(byCreatedAtAsc);
        setMessages((prev) => [...mapped, ...prev]);
        setHasMoreOlder(res.meta.has_more);
      })
      .catch(() => setToast({ message: "Couldn't load older messages.", severity: "error" }))
      .finally(() => setLoadingOlder(false));
  }, [activeChannelId, messages, loadingOlder, hasMoreOlder]);

  const handleTypingKeystroke = useCallback(() => {
    if (!activeChannelId) return;
    const room = { type: "channel" as const, target_id: activeChannelId };
    if (!isTypingSentRef.current) {
      isTypingSentRef.current = true;
      chatWs.sendTypingIndicator(room, true);
    }
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      isTypingSentRef.current = false;
      chatWs.sendTypingIndicator(room, false);
    }, TYPING_STOP_DELAY_MS);
  }, [activeChannelId]);

  const handleSend = useCallback(
    (content: string, attachments: MessageAttachment[]) => {
      if (!activeChannelId || !currentUser) return;
      if (!content && attachments.length === 0) return;

      const clientId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const now = new Date().toISOString();
      const optimistic: Message = {
        id: clientId,
        clientId,
        senderId: currentUser.id,
        receiverId: null,
        groupId: activeChannelId,
        content,
        attachments,
        isEdited: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        deliveryState: "sending",
      };

      setMessages((prev) => [...prev, optimistic]);
      setDraft("");
      setSending(true);

      messagesApi
        .sendMessage({
          channel_id: activeChannelId,
          content,
          media_ids: attachments.length > 0 ? attachments.map((a) => a.id) : undefined,
        })
        .then((res) => {
          const confirmed = apiMessageToMessage(res.data);
          // A WS echo of this same send can arrive before this response does
          // (every member, including the sender, gets pushed message.new) —
          // drop the optimistic entry and merge-by-id rather than blindly
          // replacing, so the two don't both end up in the list.
          setMessages((prev) => mergeMessage(prev.filter((m) => m.clientId !== clientId), confirmed));
        })
        .catch(() => {
          setMessages((prev) => prev.map((m) => (m.clientId === clientId ? { ...m, deliveryState: "failed" } : m)));
          setToast({ message: "Message failed to send.", severity: "error" });
        })
        .finally(() => setSending(false));
    },
    [activeChannelId, currentUser],
  );

  const handleScheduleSend = useCallback(
    (content: string, attachments: MessageAttachment[], scheduledAt: Date) => {
      if (!activeChannelId) return;
      if (!content && attachments.length === 0) return;

      scheduledMessagesApi
        .create({
          channel_id: activeChannelId,
          content,
          media_ids: attachments.length > 0 ? attachments.map((a) => a.id) : undefined,
          scheduled_at: scheduledAt.toISOString(),
        })
        .then(() => {
          setDraft("");
          setToast({ message: `Scheduled for ${scheduledAt.toLocaleString()}.`, severity: "success" });
        })
        .catch((err) => {
          const message = err instanceof ApiError ? err.message : "Couldn't schedule that message.";
          setToast({ message, severity: "error" });
        });
    },
    [activeChannelId],
  );

  const handleRetry = useCallback(
    (message: Message) => {
      if (!activeChannelId) return;
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, deliveryState: "sending" } : m)));
      messagesApi
        .sendMessage({
          channel_id: activeChannelId,
          content: message.content,
          media_ids: message.attachments.length > 0 ? message.attachments.map((a) => a.id) : undefined,
        })
        .then((res) => {
          const confirmed = apiMessageToMessage(res.data);
          setMessages((prev) => mergeMessage(prev.filter((m) => m.id !== message.id), confirmed));
        })
        .catch(() => {
          setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, deliveryState: "failed" } : m)));
          setToast({ message: "Message failed to send.", severity: "error" });
        });
    },
    [activeChannelId],
  );

  const handleEdit = useCallback((message: Message, newContent: string) => {
    const previousContent = message.content;
    setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, content: newContent, isEdited: true } : m)));
    messagesApi.editMessage(message.id, newContent).catch(() => {
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, content: previousContent } : m)));
      setToast({ message: "Couldn't edit that message.", severity: "error" });
    });
  }, []);

  const handleDelete = useCallback((message: Message) => {
    setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, isDeleted: true } : m)));
    messagesApi.deleteMessage(message.id).catch(() => {
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, isDeleted: false } : m)));
      setToast({ message: "Couldn't delete that message.", severity: "error" });
    });
  }, []);

  async function revealSearchResult(result: MessageSearchResultItem) {
    setSearchOpen(false);
    setGlobalSearchOpen(false);

    if (result.otherUserId !== activeChannelIdRef.current) {
      pendingHighlightRef.current = result.id;
      setActiveChannelId(result.otherUserId);
      return;
    }

    if (messages.some((m) => m.id === result.id)) {
      setHighlightMessageId(result.id);
      return;
    }
    if (!activeChannelId) return;

    setLoadingMessages(true);
    try {
      const res = await messagesApi.getChannelMessages(activeChannelId, PAGE_SIZE, result.id);
      const older = res.data.map(apiMessageToMessage).sort(byCreatedAtAsc);
      const target: Message = {
        id: result.id,
        senderId: result.senderId,
        receiverId: null,
        groupId: activeChannelId,
        content: result.content,
        attachments: [],
        isEdited: false,
        isDeleted: false,
        createdAt: result.createdAt,
        updatedAt: result.createdAt,
        deliveryState: "sent",
      };
      setMessages([...older, target]);
      setHasMoreOlder(res.meta.has_more);
      setIsViewingSearchContext(true);
      setHighlightMessageId(result.id);
    } catch {
      setToast({ message: "Couldn't jump to that message.", severity: "error" });
    } finally {
      setLoadingMessages(false);
    }
  }

  /** Cross-scope global search / cross-page navigation lands here (e.g. a link like /channels?open=<id>&highlight=<messageId>). */
  const handleGlobalSearchResult = useCallback(
    (result: MessageSearchResultItem) => {
      if (result.scope && result.scope !== "channel") {
        setGlobalSearchOpen(false);
        router.push(`/${result.scope === "direct" ? "dm" : "groups"}?open=${result.otherUserId}&highlight=${result.id}`);
        return;
      }
      revealSearchResult(result);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, activeChannelId, messages],
  );

  // ---- consume a cross-page "open this channel" link once, then strip the query string ----
  const consumedNavParamsRef = useRef(false);
  useEffect(() => {
    if (consumedNavParamsRef.current) return;
    const openId = searchParams.get("open");
    if (!openId) return;
    consumedNavParamsRef.current = true;
    const highlightId = searchParams.get("highlight") ?? "";
    pendingHighlightRef.current = highlightId || null;
    // Synchronizing view state to an incoming navigation link (external to
    // React) — a legitimate effect, not state derivable from render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveChannelId(openId);
    router.replace("/channels", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const isConversationOpen = Boolean(activeChannelId);

  if (!currentUser) {
    return (
      <Box sx={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100dvh", width: "100%", overflow: "hidden" }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: { xs: "100%", md: 340 },
          flexShrink: 0,
          display: { xs: isConversationOpen ? "none" : "flex", md: "flex" },
          flexDirection: "column",
          borderRight: 1,
          borderColor: "divider",
          bgcolor: chatSurfaces.sidebar,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", px: 2, pt: 2, pb: 1.5 }}>
          <Avatar
            src={currentUser.avatar_url || undefined}
            slotProps={{ img: { loading: "lazy", decoding: "async" } }}
            sx={{ width: 32, height: 32, fontSize: 13 }}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }} noWrap>
            Channels
          </Typography>
          <Tooltip title="Search all messages">
            <IconButton size="small" onClick={() => setGlobalSearchOpen(true)} aria-label="Search all messages">
              <TravelExploreRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Scheduled messages">
            <IconButton size="small" onClick={() => router.push("/scheduled")} aria-label="Scheduled messages">
              <ScheduleSendRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings & Privacy">
            <IconButton size="small" onClick={() => router.push("/settings")} aria-label="Settings & Privacy">
              <SettingsRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="New channel">
            <IconButton size="small" onClick={() => setCreateOpen(true)} aria-label="New channel">
              <AddRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {channelStore.isLoadingChannels ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : channelStore.myChannels.length === 0 ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", px: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No channels yet — create one with the compose button above.
            </Typography>
          </Box>
        ) : (
          <List sx={{ flex: 1, overflowY: "auto", py: 0.5 }}>
            {channelStore.myChannels.map((channel) => (
              <ListItemButton
                key={channel.id}
                selected={channel.id === activeChannelId}
                onClick={() => setActiveChannelId(channel.id)}
                sx={{ borderRadius: 3, mx: 1, py: 1 }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: chatSurfaces.raised }}>
                    <TagRounded fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={channel.name}
                  secondary={channel.description || "No description"}
                  slotProps={{ primary: { noWrap: true }, secondary: { noWrap: true } }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>

      {/* Conversation pane */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: { xs: isConversationOpen ? "flex" : "none", md: "flex" },
          flexDirection: "column",
          bgcolor: chatSurfaces.main,
        }}
      >
        {activeChannel ? (
          <>
            <ChatHeader
              title={activeChannel.name}
              subtitle={`${channelStore.channelMembers.length} members`}
              onBack={() => setActiveChannelId(undefined)}
              onToggleSearch={() => setSearchOpen((v) => !v)}
              isSearchOpen={searchOpen}
              actions={
                <Tooltip title="Members">
                  <IconButton onClick={() => setMembersOpen(true)} aria-label="Channel members">
                    <GroupRounded />
                  </IconButton>
                </Tooltip>
              }
            />

            {isViewingSearchContext ? (
              <Stack direction="row" sx={{ justifyContent: "center", py: 1, bgcolor: "action.hover" }}>
                <Button
                  size="small"
                  startIcon={<KeyboardDoubleArrowDownRounded fontSize="small" />}
                  onClick={() => activeChannelId && fetchInitialPage(activeChannelId)}
                >
                  Back to latest messages
                </Button>
              </Stack>
            ) : null}

            <MessageList
              messages={messages}
              currentUserId={currentUser.id}
              participantsById={participantsById}
              typingUserNames={Array.from(typingNames.values())}
              onLoadOlder={handleLoadOlder}
              hasMoreOlder={hasMoreOlder}
              loadingOlder={loadingOlder}
              onEditMessage={handleEdit}
              onDeleteMessage={handleDelete}
              onRetryMessage={handleRetry}
              highlightMessageId={highlightMessageId}
              emptyState={loadingMessages ? "Loading…" : "No messages yet. Say hello!"}
            />

            <ChatInput
              value={draft}
              onChange={setDraft}
              onSend={handleSend}
              onSchedule={handleScheduleSend}
              onTyping={handleTypingKeystroke}
              isSending={sending}
              placeholder={`Message #${activeChannel.name}`}
            />

            <ChannelMembersDialog
              open={membersOpen}
              onClose={() => setMembersOpen(false)}
              channel={activeChannel}
              currentUserId={currentUser.id}
              onLeftOrDeleted={() => setActiveChannelId(undefined)}
            />

            <SearchOverlay
              open={searchOpen}
              onClose={() => setSearchOpen(false)}
              title="This channel"
              placeholder={`Search in ${activeChannel.name}`}
              showParticipant={false}
              onSearch={(query) =>
                messagesApi.searchChannelMessages(activeChannelId!, query).then((res) =>
                  res.data.map((m) => ({
                    id: m.id,
                    content: m.content,
                    createdAt: m.created_at,
                    senderId: m.sender_id,
                    otherUserId: activeChannelId!,
                    otherUserName: activeChannel.name,
                    otherUserAvatarUrl: undefined,
                  })),
                )
              }
              onSelectResult={revealSearchResult}
            />
          </>
        ) : (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", px: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Select a channel or create a new one
            </Typography>
          </Box>
        )}
      </Box>

      <CreateChannelModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(channel: Channel) => {
          setActiveChannelId(channel.id);
        }}
      />

      <SearchOverlay
        open={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        title="All conversations"
        placeholder="Search across your DMs, groups, and channels"
        showParticipant
        onSearch={async (query) => {
          const res = await messagesApi.searchGlobal(query);
          if (groupStore.myGroups.length === 0) groupStore.loadMyGroups();
          return mapGlobalSearchResults(res.data, currentUser.id);
        }}
        onSelectResult={handleGlobalSearchResult}
      />

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? (
          <Alert severity={toast.severity} onClose={() => setToast(null)} variant="filled">
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

const ObservedChannelsPage = observer(ChannelsPage);

export default function ChannelsPageRoute() {
  return (
    <Suspense fallback={null}>
      <ObservedChannelsPage />
    </Suspense>
  );
}
