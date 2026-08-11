"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Badge from "@mui/material/Badge";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Popover from "@mui/material/Popover";
import CircularProgress from "@mui/material/CircularProgress";
import GroupAddRounded from "@mui/icons-material/GroupAddRounded";
import NotificationsRounded from "@mui/icons-material/NotificationsRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import KeyboardDoubleArrowDownRounded from "@mui/icons-material/KeyboardDoubleArrowDownRounded";
import ScheduleSendRounded from "@mui/icons-material/ScheduleSendRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import TravelExploreRounded from "@mui/icons-material/TravelExploreRounded";
import PublicRounded from "@mui/icons-material/PublicRounded";
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
import groupStore from "@/stores/GroupStore";
import channelStore from "@/stores/ChannelStore";
import type { Group, GroupInvitationInfo } from "@/types/group";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { SearchOverlay, type MessageSearchResultItem } from "@/components/chat/SearchOverlay";
import CreateGroupModal from "@/components/group/CreateGroupModal";
import GroupMembersDialog from "@/components/group/GroupMembersDialog";
import DiscoverGroupsDialog from "@/components/group/DiscoverGroupsDialog";

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

function GroupsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = authStore.user;

  const [activeGroupId, setActiveGroupId] = useState<string | undefined>(undefined);
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
  const [invitesAnchor, setInvitesAnchor] = useState<HTMLElement | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);

  const [avatarByUserId, setAvatarByUserId] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; severity: "error" | "success" } | null>(null);

  const activeGroupIdRef = useRef<string | undefined>(undefined);
  const currentUserIdRef = useRef<string | undefined>(undefined);
  const pendingHighlightRef = useRef<string | null>(null);
  const typingClearTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isTypingSentRef = useRef(false);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avatarFetchStarted = useRef<Set<string>>(new Set());

  useEffect(() => {
    activeGroupIdRef.current = activeGroupId;
  }, [activeGroupId]);
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id;
  }, [currentUser]);

  const activeGroup = useMemo(
    () => groupStore.myGroups.find((g) => g.id === activeGroupId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groupStore.myGroups, activeGroupId],
  );

  const participantsById = useMemo(() => {
    const map: Record<string, User> = {};
    for (const member of groupStore.groupMembers) {
      map[member.user_id] = {
        id: member.user_id,
        username: member.username,
        displayName: member.name,
        avatarUrl: avatarByUserId[member.user_id],
      };
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupStore.groupMembers, avatarByUserId]);

  // ---- bootstrap: my groups + pending invites ----
  useEffect(() => {
    // A fresh page load only rehydrates authStore's tokens, not the user
    // profile (see AuthStore.hydrateUser's doc comment) — without this,
    // `currentUser` below stays null forever on a direct navigation here.
    authStore.hydrateUser();
    groupStore.loadMyGroups();
    groupStore.loadMyInvitations();
  }, []);

  // ---- websocket lifecycle ----
  useEffect(() => {
    if (!currentUser) return;

    chatWs.connect();

    function handleMessageNew(data: ApiMessage) {
      if (!data.group_id) return;
      const mapped = apiMessageToMessage(data);
      if (data.group_id === activeGroupIdRef.current) {
        setMessages((prev) => mergeMessage(prev, mapped));
      }
    }

    function handleMessageUpdated(data: ApiMessage) {
      if (!data.group_id || data.group_id !== activeGroupIdRef.current) return;
      setMessages((prev) => mergeMessage(prev, apiMessageToMessage(data)));
    }

    function handleMessageDeleted(data: { id: string }) {
      setMessages((prev) => prev.map((m) => (m.id === data.id ? { ...m, isDeleted: true } : m)));
    }

    function handleTyping(data: { user_id: string; is_typing: boolean; room: string }) {
      const me = currentUserIdRef.current;
      const groupId = activeGroupIdRef.current;
      if (!me || !groupId || data.user_id === me) return;
      if (data.room !== `group_${groupId}`) return;

      const member = groupStore.groupMembers.find((m) => m.user_id === data.user_id);
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
    // group's member list" (just drop them from the loaded list).
    function handleGroupMemberRemoved(data: { group_id: string; user_id: string }) {
      const me = currentUserIdRef.current;
      if (!me) return;

      if (data.user_id === me) {
        groupStore.evictGroup(data.group_id);
        chatWs.unsubscribeFromRoom({ type: "group", target_id: data.group_id });
        if (activeGroupIdRef.current === data.group_id) {
          setActiveGroupId(undefined);
          setToast({ message: "You were removed from this group.", severity: "error" });
        }
        return;
      }

      if (data.group_id === activeGroupIdRef.current) {
        groupStore.removeMemberLocally(data.user_id);
      }
    }

    // Not emitted by the live backend yet — see docs/BACKEND_REQUIREMENTS.md.
    function handleInvitationReceived(data: GroupInvitationInfo) {
      if (data.invitee_id !== currentUserIdRef.current) return;
      groupStore.addInvitationLocally(data);
    }

    chatWs.on("message.new", handleMessageNew);
    chatWs.on("message.updated", handleMessageUpdated);
    chatWs.on("message.deleted", handleMessageDeleted);
    chatWs.on("typing", handleTyping);
    chatWs.on("group.member_removed", handleGroupMemberRemoved);
    chatWs.on("group.invitation.received", handleInvitationReceived);

    return () => {
      chatWs.off("message.new", handleMessageNew);
      chatWs.off("message.updated", handleMessageUpdated);
      chatWs.off("message.deleted", handleMessageDeleted);
      chatWs.off("typing", handleTyping);
      chatWs.off("group.member_removed", handleGroupMemberRemoved);
      chatWs.off("group.invitation.received", handleInvitationReceived);
      chatWs.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const fetchInitialPage = useCallback((groupId: string) => {
    setLoadingMessages(true);
    setIsViewingSearchContext(false);
    messagesApi
      .getGroupMessages(groupId, PAGE_SIZE)
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
      .catch(() => setToast({ message: "Couldn't load messages for this group.", severity: "error" }))
      .finally(() => setLoadingMessages(false));
  }, []);

  const activateGroup = useCallback(
    (groupId: string) => {
      setMessages([]);
      setHasMoreOlder(false);
      setTypingNames(new Map());
      setHighlightMessageId(undefined);
      chatWs.subscribeToRoom({ type: "group", target_id: groupId });
      fetchInitialPage(groupId);
      groupStore.loadGroupMembers(groupId);
    },
    [fetchInitialPage],
  );

  // ---- load a group's messages + members when the active group changes ----
  useEffect(() => {
    if (!activeGroupId) return;
    // Synchronizing to an external system (the WS room subscription) plus
    // the view state that goes with switching groups — a legitimate effect,
    // not state derivable from render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    activateGroup(activeGroupId);
    return () => {
      chatWs.unsubscribeFromRoom({ type: "group", target_id: activeGroupId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupId]);

  // ---- lazily resolve avatars for members (not included in the members payload) ----
  useEffect(() => {
    const toFetch = groupStore.groupMembers.filter(
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
  }, [groupStore.groupMembers]);

  const handleLoadOlder = useCallback(() => {
    if (!activeGroupId || messages.length === 0 || loadingOlder || !hasMoreOlder) return;
    const oldest = messages[0];
    setLoadingOlder(true);
    messagesApi
      .getGroupMessages(activeGroupId, PAGE_SIZE, oldest.id)
      .then((res) => {
        const mapped = res.data.map(apiMessageToMessage).sort(byCreatedAtAsc);
        setMessages((prev) => [...mapped, ...prev]);
        setHasMoreOlder(res.meta.has_more);
      })
      .catch(() => setToast({ message: "Couldn't load older messages.", severity: "error" }))
      .finally(() => setLoadingOlder(false));
  }, [activeGroupId, messages, loadingOlder, hasMoreOlder]);

  const handleTypingKeystroke = useCallback(() => {
    if (!activeGroupId) return;
    const room = { type: "group" as const, target_id: activeGroupId };
    if (!isTypingSentRef.current) {
      isTypingSentRef.current = true;
      chatWs.sendTypingIndicator(room, true);
    }
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      isTypingSentRef.current = false;
      chatWs.sendTypingIndicator(room, false);
    }, TYPING_STOP_DELAY_MS);
  }, [activeGroupId]);

  const handleSend = useCallback(
    (content: string, attachments: MessageAttachment[]) => {
      if (!activeGroupId || !currentUser) return;
      if (!content && attachments.length === 0) return;

      const clientId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const now = new Date().toISOString();
      const optimistic: Message = {
        id: clientId,
        clientId,
        senderId: currentUser.id,
        receiverId: null,
        groupId: activeGroupId,
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
          group_id: activeGroupId,
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
    [activeGroupId, currentUser],
  );

  const handleScheduleSend = useCallback(
    (content: string, attachments: MessageAttachment[], scheduledAt: Date) => {
      if (!activeGroupId) return;
      if (!content && attachments.length === 0) return;

      scheduledMessagesApi
        .create({
          group_id: activeGroupId,
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
    [activeGroupId],
  );

  const handleRetry = useCallback(
    (message: Message) => {
      if (!activeGroupId) return;
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, deliveryState: "sending" } : m)));
      messagesApi
        .sendMessage({
          group_id: activeGroupId,
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
    [activeGroupId],
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

    if (result.otherUserId !== activeGroupIdRef.current) {
      pendingHighlightRef.current = result.id;
      setActiveGroupId(result.otherUserId);
      return;
    }

    if (messages.some((m) => m.id === result.id)) {
      setHighlightMessageId(result.id);
      return;
    }
    if (!activeGroupId) return;

    setLoadingMessages(true);
    try {
      const res = await messagesApi.getGroupMessages(activeGroupId, PAGE_SIZE, result.id);
      const older = res.data.map(apiMessageToMessage).sort(byCreatedAtAsc);
      const target: Message = {
        id: result.id,
        senderId: result.senderId,
        receiverId: null,
        groupId: activeGroupId,
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

  async function handleRespondInvite(invitationId: string, action: "accept" | "reject") {
    await groupStore.respondToGroupInvitation(invitationId, action);
  }

  /** Cross-scope global search / cross-page navigation lands here (e.g. a link like /groups?open=<id>&highlight=<messageId>). */
  const handleGlobalSearchResult = useCallback(
    (result: MessageSearchResultItem) => {
      if (result.scope && result.scope !== "group") {
        setGlobalSearchOpen(false);
        router.push(`/${result.scope === "direct" ? "dm" : "channels"}?open=${result.otherUserId}&highlight=${result.id}`);
        return;
      }
      revealSearchResult(result);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, activeGroupId, messages],
  );

  // ---- consume a cross-page "open this group" link once, then strip the query string ----
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
    setActiveGroupId(openId);
    router.replace("/groups", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const isConversationOpen = Boolean(activeGroupId);
  const pendingInviteCount = groupStore.myInvitations.length;

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
            Groups
          </Typography>
          <Tooltip title="Pending invitations">
            <IconButton size="small" onClick={(e) => setInvitesAnchor(e.currentTarget)} aria-label="Pending invitations">
              <Badge badgeContent={pendingInviteCount} color="primary">
                <NotificationsRounded fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Search all messages">
            <IconButton size="small" onClick={() => setGlobalSearchOpen(true)} aria-label="Search all messages">
              <TravelExploreRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Discover public groups">
            <IconButton size="small" onClick={() => setDiscoverOpen(true)} aria-label="Discover public groups">
              <PublicRounded fontSize="small" />
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
          <Tooltip title="New group">
            <IconButton size="small" onClick={() => setCreateOpen(true)} aria-label="New group">
              <GroupAddRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {groupStore.isLoadingGroups ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : groupStore.myGroups.length === 0 ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", px: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No groups yet — create one with the compose button above.
            </Typography>
          </Box>
        ) : (
          <List sx={{ flex: 1, overflowY: "auto", py: 0.5 }}>
            {groupStore.myGroups.map((group) => (
              <ListItemButton
                key={group.id}
                selected={group.id === activeGroupId}
                onClick={() => setActiveGroupId(group.id)}
                sx={{ borderRadius: 3, mx: 1, py: 1 }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: chatSurfaces.raised }}>{group.name.charAt(0).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={group.name}
                  secondary={`${group.member_count} member${group.member_count === 1 ? "" : "s"}`}
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
        {activeGroup ? (
          <>
            <ChatHeader
              title={activeGroup.name}
              subtitle={`${activeGroup.member_count} members`}
              onBack={() => setActiveGroupId(undefined)}
              onToggleSearch={() => setSearchOpen((v) => !v)}
              isSearchOpen={searchOpen}
              actions={
                <Tooltip title="Members">
                  <IconButton onClick={() => setMembersOpen(true)} aria-label="Group members">
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
                  onClick={() => activeGroupId && fetchInitialPage(activeGroupId)}
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
              placeholder={`Message #${activeGroup.name}`}
            />

            <GroupMembersDialog
              open={membersOpen}
              onClose={() => setMembersOpen(false)}
              group={activeGroup}
              currentUserId={currentUser.id}
              onLeftOrDeleted={() => setActiveGroupId(undefined)}
            />

            <SearchOverlay
              open={searchOpen}
              onClose={() => setSearchOpen(false)}
              title="This group"
              placeholder={`Search in ${activeGroup.name}`}
              showParticipant={false}
              onSearch={(query) =>
                messagesApi.searchGroupMessages(activeGroupId!, query).then((res) =>
                  res.data.map((m) => ({
                    id: m.id,
                    content: m.content,
                    createdAt: m.created_at,
                    senderId: m.sender_id,
                    otherUserId: activeGroupId!,
                    otherUserName: activeGroup.name,
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
              Select a group or create a new one
            </Typography>
          </Box>
        )}
      </Box>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(group: Group) => {
          // CreateGroupModal calls the original groupStore.createGroup(),
          // which appends to groupStore.groups — not the additive
          // groupStore.myGroups this page renders from. Refetch our own
          // list so the new group actually shows up in the sidebar.
          groupStore.loadMyGroups();
          setActiveGroupId(group.id);
        }}
      />

      <DiscoverGroupsDialog
        open={discoverOpen}
        onClose={() => setDiscoverOpen(false)}
        onJoined={(group) => setActiveGroupId(group.id)}
      />

      <SearchOverlay
        open={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        title="All conversations"
        placeholder="Search across your DMs, groups, and channels"
        showParticipant
        onSearch={async (query) => {
          const res = await messagesApi.searchGlobal(query);
          if (channelStore.myChannels.length === 0) channelStore.loadMyChannels();
          return mapGlobalSearchResults(res.data, currentUser.id);
        }}
        onSelectResult={handleGlobalSearchResult}
      />

      <Popover
        open={Boolean(invitesAnchor)}
        anchorEl={invitesAnchor}
        onClose={() => setInvitesAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ width: 320, maxHeight: 400, overflowY: "auto", p: 1 }}>
          <Typography variant="subtitle2" sx={{ px: 1, py: 1 }}>
            Pending invitations
          </Typography>
          {groupStore.myInvitations.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ px: 1, pb: 2 }}>
              You&apos;re all caught up.
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ px: 1, pb: 1 }}>
              {groupStore.myInvitations.map((invite) => (
                <Box key={invite.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {invite.group_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Invited by @{invite.inviter_username}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button size="small" variant="contained" onClick={() => handleRespondInvite(invite.id, "accept")}>
                      Accept
                    </Button>
                    <Button size="small" variant="text" color="inherit" onClick={() => handleRespondInvite(invite.id, "reject")}>
                      Decline
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Popover>

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

const ObservedGroupsPage = observer(GroupsPage);

export default function GroupsPageRoute() {
  return (
    <Suspense fallback={null}>
      <ObservedGroupsPage />
    </Suspense>
  );
}
