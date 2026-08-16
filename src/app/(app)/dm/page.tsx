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
import AddCommentRounded from "@mui/icons-material/AddCommentRounded";
import TravelExploreRounded from "@mui/icons-material/TravelExploreRounded";
import KeyboardDoubleArrowDownRounded from "@mui/icons-material/KeyboardDoubleArrowDownRounded";
import ScheduleSendRounded from "@mui/icons-material/ScheduleSendRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";

import { observer } from "mobx-react-lite";
import type { Message, MessageAttachment, User } from "@/lib/types";
import { getCachedUser } from "@/lib/auth";
import { usersApi } from "@/lib/api/users";
import { messagesApi } from "@/lib/api/messages";
import type { ApiMessage } from "@/lib/api/messages";
import { scheduledMessagesApi } from "@/lib/api/scheduledMessages";
import ScheduledMessagesDialog from "@/components/chat/ScheduledMessagesDialog";
import { ApiError } from "@/lib/api/api";
import { chatWs } from "@/lib/api/chat";
import { loadDmContacts, markDmContactRead, upsertDmContact, type DmContact } from "@/lib/chat/dmContacts";
import { apiMessageToMessage, previewFor } from "@/lib/chat/mappers";
import { mapTitleMatches } from "@/lib/chat/globalSearch";
import authStore from "@/stores/AuthStore";
import groupStore from "@/stores/GroupStore";
import channelStore from "@/stores/ChannelStore";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ConversationList } from "@/components/chat/ConversationList";
import { MessageList } from "@/components/chat/MessageList";
import { NewDirectMessageDialog, type ResolvedUser } from "@/components/chat/NewDirectMessageDialog";
import { SearchOverlay, type MessageSearchResultItem } from "@/components/chat/SearchOverlay";
import { chatSurfaces } from "@/lib/theme/theme";
import { openUserProfile } from "@/lib/profileNav";

const PAGE_SIZE = 30;
const TYPING_STOP_DELAY_MS = 2000;

function roomKeyFor(userA: string, userB: string): string {
  return `direct_${[userA, userB].sort().join("_")}`;
}

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

function contactToUser(contact: DmContact): User {
  return { id: contact.userId, username: contact.username, displayName: contact.name, avatarUrl: contact.avatarUrl };
}

function sortByRecentActivity(contacts: DmContact[]): DmContact[] {
  return [...contacts].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

function DirectMessagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Reactive read of the shared auth store (like channels/groups pages) so a
  // profile edit elsewhere (e.g. a new avatar) shows up here immediately
  // instead of requiring a full reload.
  const authUser = authStore.user;
  const currentUser = useMemo<User | null>(
    () =>
      authUser
        ? { id: authUser.id, username: authUser.username, displayName: authUser.name, avatarUrl: authUser.avatar_url }
        : null,
    [authUser],
  );

  const [contacts, setContacts] = useState<DmContact[]>(() => {
    const cached = getCachedUser();
    return cached ? sortByRecentActivity(loadDmContacts(cached.id)) : [];
  });
  const [activeContactId, setActiveContactId] = useState<string | undefined>(undefined);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [isViewingSearchContext, setIsViewingSearchContext] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | undefined>(undefined);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [typingFromOther, setTypingFromOther] = useState(false);

  const [newDmOpen, setNewDmOpen] = useState(false);
  const [conversationSearchOpen, setConversationSearchOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [scheduledOpen, setScheduledOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; severity: "error" | "success" } | null>(null);

  const currentUserRef = useRef<User | null>(null);
  const activeContactIdRef = useRef<string | undefined>(undefined);
  const contactsRef = useRef<DmContact[]>([]);
  const typingClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingSentRef = useRef(false);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHighlightRef = useRef<string | null>(null);
  const userProfileCache = useRef<Map<string, User>>(new Map());

  useEffect(() => {
    currentUserRef.current = currentUser;
    activeContactIdRef.current = activeContactId;
    contactsRef.current = contacts;
  });

  const activeContact = useMemo(() => contacts.find((c) => c.userId === activeContactId), [contacts, activeContactId]);
  const activeUser = activeContact ? contactToUser(activeContact) : null;

  const participantsById = useMemo(() => {
    const map: Record<string, User> = {};
    if (currentUser) map[currentUser.id] = currentUser;
    if (activeUser) map[activeUser.id] = activeUser;
    return map;
  }, [currentUser, activeUser]);

  // ---- bootstrap: rehydrate the user profile after a fresh page load ----
  // (only tokens survive a hard refresh — see AuthStore.hydrateUser's doc comment)
  useEffect(() => {
    authStore.hydrateUser();
  }, []);

  // ---- websocket lifecycle (connect once per logged-in user) ----
  useEffect(() => {
    if (!currentUser) return;

    chatWs.connect();

    async function resolveContactProfile(
      userId: string,
    ): Promise<Pick<DmContact, "userId" | "username" | "name" | "avatarUrl">> {
      const existing = contactsRef.current.find((c) => c.userId === userId);
      if (existing) return existing;
      const cached = userProfileCache.current.get(userId);
      if (cached) {
        return { userId: cached.id, username: cached.username, name: cached.displayName, avatarUrl: cached.avatarUrl ?? "" };
      }
      try {
        const res = await usersApi.getUser(userId);
        const user: User = { id: res.data.id, username: res.data.username, displayName: res.data.name, avatarUrl: res.data.avatar_url };
        userProfileCache.current.set(userId, user);
        return { userId: user.id, username: user.username, name: user.displayName, avatarUrl: user.avatarUrl ?? "" };
      } catch {
        return { userId, username: userId, name: userId, avatarUrl: "" };
      }
    }

    function handleMessageNew(data: ApiMessage) {
      const me = currentUserRef.current;
      if (!me || data.group_id || data.channel_id) return;

      const otherUserId = data.sender_id === me.id ? data.receiver_id : data.sender_id;
      if (!otherUserId) return;

      const mapped = apiMessageToMessage(data);
      if (otherUserId === activeContactIdRef.current) {
        setMessages((prev) => mergeMessage(prev, mapped));
      }

      const isIncoming = data.sender_id !== me.id;
      const shouldMarkUnread = isIncoming && otherUserId !== activeContactIdRef.current;

      resolveContactProfile(otherUserId).then((profile) => {
        const updated = upsertDmContact(me.id, profile, {
          lastMessageAt: data.created_at,
          lastMessagePreview: previewFor(data),
          incrementUnread: shouldMarkUnread,
        });
        setContacts(sortByRecentActivity(updated));
      });
    }

    function handleMessageUpdated(data: ApiMessage) {
      if (data.group_id || data.channel_id) return;
      const me = currentUserRef.current;
      if (!me) return;
      const otherUserId = data.sender_id === me.id ? data.receiver_id : data.sender_id;
      if (otherUserId !== activeContactIdRef.current) return;
      setMessages((prev) => mergeMessage(prev, apiMessageToMessage(data)));
    }

    function handleMessageDeleted(data: { id: string }) {
      setMessages((prev) => prev.filter((m) => m.id !== data.id));
    }

    function handleTyping(data: { user_id: string; is_typing: boolean; room: string }) {
      const me = currentUserRef.current;
      const activeId = activeContactIdRef.current;
      if (!me || !activeId || data.user_id === me.id) return;
      if (data.room !== roomKeyFor(me.id, activeId)) return;

      setTypingFromOther(data.is_typing);
      if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
      if (data.is_typing) {
        typingClearTimer.current = setTimeout(() => setTypingFromOther(false), 5000);
      }
    }

    chatWs.on("message.new", handleMessageNew);
    chatWs.on("message.updated", handleMessageUpdated);
    chatWs.on("message.deleted", handleMessageDeleted);
    chatWs.on("typing", handleTyping);

    return () => {
      chatWs.off("message.new", handleMessageNew);
      chatWs.off("message.updated", handleMessageUpdated);
      chatWs.off("message.deleted", handleMessageDeleted);
      chatWs.off("typing", handleTyping);
      chatWs.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const fetchInitialPage = useCallback((contactId: string) => {
    setLoadingMessages(true);
    setIsViewingSearchContext(false);
    messagesApi
      .getDirectMessages(contactId, PAGE_SIZE)
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
      .catch(() => setToast({ message: "Couldn't load messages for this conversation.", severity: "error" }))
      .finally(() => setLoadingMessages(false));
  }, []);

  // Bundles the "activate a conversation" side effects (reset view state,
  // fetch its first page, mark it read) behind one imperative call so the
  // effect below only *invokes* it rather than calling setState directly.
  const activateConversation = useCallback(
    (contactId: string, userId: string) => {
      setMessages([]);
      setHasMoreOlder(false);
      setTypingFromOther(false);
      setHighlightMessageId(undefined);
      fetchInitialPage(contactId);
      setContacts(sortByRecentActivity(markDmContactRead(userId, contactId)));
    },
    [fetchInitialPage],
  );

  // ---- load a conversation's messages when the active contact changes ----
  useEffect(() => {
    if (!activeContactId || !currentUser) return;

    chatWs.subscribeToRoom({ type: "direct", target_id: activeContactId });
    // Synchronizing to an external system (the WS room subscription) plus
    // the view state that goes with switching conversations — a legitimate
    // effect, not state derivable from render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    activateConversation(activeContactId, currentUser.id);

    return () => {
      chatWs.unsubscribeFromRoom({ type: "direct", target_id: activeContactId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContactId, currentUser?.id]);

  const handleSelectContact = useCallback((userId: string) => setActiveContactId(userId), []);

  const handleLoadOlder = useCallback(() => {
    if (!activeContactId || messages.length === 0 || loadingOlder || !hasMoreOlder) return;
    const oldest = messages[0];
    setLoadingOlder(true);
    messagesApi
      .getDirectMessages(activeContactId, PAGE_SIZE, oldest.id)
      .then((res) => {
        const mapped = res.data.map(apiMessageToMessage).sort(byCreatedAtAsc);
        setMessages((prev) => [...mapped, ...prev]);
        setHasMoreOlder(res.meta.has_more);
      })
      .catch(() => setToast({ message: "Couldn't load older messages.", severity: "error" }))
      .finally(() => setLoadingOlder(false));
  }, [activeContactId, messages, loadingOlder, hasMoreOlder]);

  const handleTypingKeystroke = useCallback(() => {
    if (!activeContactId) return;
    const room = { type: "direct" as const, target_id: activeContactId };
    if (!isTypingSentRef.current) {
      isTypingSentRef.current = true;
      chatWs.sendTypingIndicator(room, true);
    }
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      isTypingSentRef.current = false;
      chatWs.sendTypingIndicator(room, false);
    }, TYPING_STOP_DELAY_MS);
  }, [activeContactId]);

  const handleSend = useCallback(
    (content: string, attachments: MessageAttachment[]) => {
      if (!activeContactId || !currentUser) return;
      if (!content && attachments.length === 0) return;

      const clientId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const now = new Date().toISOString();
      const optimistic: Message = {
        id: clientId,
        clientId,
        senderId: currentUser.id,
        receiverId: activeContactId,
        groupId: null,
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
          receiver_id: activeContactId,
          content,
          media_ids: attachments.length > 0 ? attachments.map((a) => a.id) : undefined,
        })
        .then((res) => {
          const confirmed = apiMessageToMessage(res.data);
          // A WS echo of this same send can arrive before this response does
          // (the sender gets pushed their own message.new) — drop the
          // optimistic entry and merge-by-id rather than blindly replacing,
          // so the two don't both end up in the list.
          setMessages((prev) => mergeMessage(prev.filter((m) => m.clientId !== clientId), confirmed));
          const fallbackProfile = { userId: activeContactId, username: activeContactId, name: activeContactId, avatarUrl: "" };
          const known = contactsRef.current.find((c) => c.userId === activeContactId) ?? fallbackProfile;
          const updated = upsertDmContact(currentUser.id, known, {
            lastMessageAt: res.data.created_at,
            lastMessagePreview: previewFor(res.data),
          });
          setContacts(sortByRecentActivity(updated));
        })
        .catch(() => {
          setMessages((prev) => prev.map((m) => (m.clientId === clientId ? { ...m, deliveryState: "failed" } : m)));
          setToast({ message: "Message failed to send.", severity: "error" });
        })
        .finally(() => setSending(false));
    },
    [activeContactId, currentUser],
  );

  const handleScheduleSend = useCallback(
    (content: string, attachments: MessageAttachment[], scheduledAt: Date) => {
      if (!activeContactId) return;
      if (!content && attachments.length === 0) return;

      scheduledMessagesApi
        .create({
          receiver_id: activeContactId,
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
    [activeContactId],
  );

  const handleRetry = useCallback(
    (message: Message) => {
      if (!activeContactId) return;
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, deliveryState: "sending" } : m)));
      messagesApi
        .sendMessage({
          receiver_id: activeContactId,
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
    [activeContactId],
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
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    messagesApi.deleteMessage(message.id).catch(() => {
      setMessages((prev) => mergeMessage(prev, message));
      setToast({ message: "Couldn't delete that message.", severity: "error" });
    });
  }, []);

  const handleStartNewDm = useCallback(
    (user: ResolvedUser) => {
      if (!currentUser) return;
      const updated = upsertDmContact(currentUser.id, {
        userId: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
      });
      setContacts(sortByRecentActivity(updated));
      setActiveContactId(user.id);
    },
    [currentUser],
  );

  const revealSearchResult = useCallback(
    async (result: MessageSearchResultItem) => {
      setConversationSearchOpen(false);
      setGlobalSearchOpen(false);

      if (result.isTitleMatch) {
        setActiveContactId(result.otherUserId);
        return;
      }

      if (result.otherUserId !== activeContactIdRef.current) {
        pendingHighlightRef.current = result.id;
        const me = currentUserRef.current;
        if (me && !contactsRef.current.some((c) => c.userId === result.otherUserId)) {
          const updated = upsertDmContact(me.id, {
            userId: result.otherUserId,
            username: result.otherUserName,
            name: result.otherUserName,
            avatarUrl: result.otherUserAvatarUrl ?? "",
          });
          setContacts(sortByRecentActivity(updated));
        }
        setActiveContactId(result.otherUserId);
        return;
      }

      if (messages.some((m) => m.id === result.id)) {
        setHighlightMessageId(result.id);
        return;
      }

      // Not in the currently-loaded window. The backend only exposes a
      // "before" cursor (no "after"), so we can fetch context leading up to
      // the target but not what came after it — "Back to latest messages"
      // below is how the user returns to a normal live view.
      setLoadingMessages(true);
      try {
        const me = currentUserRef.current;
        const res = await messagesApi.getDirectMessages(result.otherUserId, PAGE_SIZE, result.id);
        const older = res.data.map(apiMessageToMessage).sort(byCreatedAtAsc);
        const target: Message = {
          id: result.id,
          senderId: result.senderId,
          receiverId: result.senderId === result.otherUserId ? (me?.id ?? null) : result.otherUserId,
          groupId: null,
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
    },
    [messages],
  );

  /** Cross-scope global search / cross-page navigation lands here (e.g. a link like /dm?open=<id>&highlight=<messageId>). */
  const handleGlobalSearchResult = useCallback(
    (result: MessageSearchResultItem) => {
      if (result.scope && result.scope !== "direct") {
        setGlobalSearchOpen(false);
        router.push(`/${result.scope === "group" ? "groups" : "channels"}?open=${result.otherUserId}&highlight=${result.id}`);
        return;
      }
      revealSearchResult(result);
    },
    [router, revealSearchResult],
  );

  // ---- consume a cross-page "open this conversation" link once, then strip the query string ----
  const consumedNavParamsRef = useRef(false);
  useEffect(() => {
    if (consumedNavParamsRef.current) return;
    const openId = searchParams.get("open");
    if (!openId) return;
    consumedNavParamsRef.current = true;
    const highlightId = searchParams.get("highlight") ?? "";
    // Synchronizing view state to an incoming navigation link (external to
    // React) — a legitimate effect, not state derivable from render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    revealSearchResult({
      id: highlightId,
      content: "",
      createdAt: "",
      senderId: "",
      otherUserId: openId,
      otherUserName: openId,
    });
    router.replace("/dm", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const isConversationOpen = Boolean(activeContactId);

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
          width: { xs: "100%", md: 380 },
          flexShrink: 0,
          display: { xs: isConversationOpen ? "none" : "flex", md: "flex" },
          flexDirection: "column",
          borderRight: 1,
          borderColor: "divider",
          bgcolor: chatSurfaces.sidebar,
        }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", px: 2, pt: 2, pb: 1 }}>
          <Tooltip title="Your profile">
            <IconButton
              size="small"
              onClick={() => openUserProfile(currentUser.id)}
              aria-label="Open your profile"
              sx={{ p: 0 }}
            >
              <Avatar
                src={currentUser.avatarUrl || undefined}
                slotProps={{ img: { loading: "lazy", decoding: "async" } }}
                sx={{ width: 32, height: 32, fontSize: 13 }}
              >
                {currentUser.displayName.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1, minWidth: 0 }} noWrap>
            Direct Messages
          </Typography>
          <Tooltip title="Search all messages">
            <IconButton size="small" onClick={() => setGlobalSearchOpen(true)}>
              <TravelExploreRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Scheduled messages">
            <IconButton size="small" onClick={() => setScheduledOpen(true)}>
              <ScheduleSendRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings & Privacy">
            <IconButton size="small" onClick={() => openUserProfile(currentUser?.id ?? "")}>
              <SettingsRounded fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="New direct message">
            <IconButton size="small" onClick={() => setNewDmOpen(true)}>
              <AddCommentRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <ConversationList
          contacts={contacts}
          activeContactId={activeContactId}
          onSelectContact={handleSelectContact}
          emptyState="No conversations yet — start one with the compose button above"
        />
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
        {activeUser ? (
          <>
            <ChatHeader
              title={activeUser.displayName}
              subtitle={`@${activeUser.username}`}
              avatarUrl={activeUser.avatarUrl}
              onBack={() => setActiveContactId(undefined)}
              onToggleSearch={() => setConversationSearchOpen((v) => !v)}
              isSearchOpen={conversationSearchOpen}
              onHeaderClick={() => openUserProfile(activeUser.id)}
            />

            {isViewingSearchContext ? (
              <Stack direction="row" sx={{ justifyContent: "center", py: 1, bgcolor: "action.hover" }}>
                <Button
                  size="small"
                  startIcon={<KeyboardDoubleArrowDownRounded fontSize="small" />}
                  onClick={() => activeContactId && fetchInitialPage(activeContactId)}
                >
                  Back to latest messages
                </Button>
              </Stack>
            ) : null}

            <MessageList
              messages={messages}
              currentUserId={currentUser.id}
              participantsById={participantsById}
              typingUserNames={typingFromOther ? [activeUser.displayName] : undefined}
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
              placeholder={`Message ${activeUser.displayName}`}
            />
          </>
        ) : (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", px: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Select a conversation or start a new one
            </Typography>
          </Box>
        )}
      </Box>

      <NewDirectMessageDialog
        open={newDmOpen}
        onClose={() => setNewDmOpen(false)}
        onStart={handleStartNewDm}
        currentUserId={currentUser.id}
      />

      {activeUser ? (
        <SearchOverlay
          open={conversationSearchOpen}
          onClose={() => setConversationSearchOpen(false)}
          title="This conversation"
          placeholder={`Search in your conversation with ${activeUser.displayName}`}
          showParticipant={false}
          onSearch={(query) =>
            messagesApi.searchDirectMessages(activeContactId!, query).then((res) =>
              res.data.map((m) => ({
                id: m.id,
                content: m.content,
                createdAt: m.created_at,
                senderId: m.sender_id,
                otherUserId: activeContactId!,
                otherUserName: activeUser.displayName,
                otherUserAvatarUrl: activeUser.avatarUrl,
              })),
            )
          }
          onSelectResult={revealSearchResult}
        />
      ) : null}

      <SearchOverlay
        open={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        title="All conversations"
        placeholder="Search across your DMs, groups, and channels"
        showParticipant
        onSearch={async (query) => {
          const res = await messagesApi.searchGlobal(query);
          if (groupStore.myGroups.length === 0) groupStore.loadMyGroups();
          if (channelStore.myChannels.length === 0) channelStore.loadMyChannels();

          const items = await Promise.all(
            res.data.map(async (m) => {
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
                } satisfies MessageSearchResultItem;
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
                } satisfies MessageSearchResultItem;
              }

              const otherUserId = (m.sender_id === currentUser.id ? m.receiver_id : m.sender_id)!;
              const knownContact = contactsRef.current.find((c) => c.userId === otherUserId);
              const knownProfile = userProfileCache.current.get(otherUserId);

              let name = otherUserId;
              let avatarUrl: string | undefined;
              if (knownContact) {
                name = knownContact.name;
                avatarUrl = knownContact.avatarUrl;
              } else if (knownProfile) {
                name = knownProfile.displayName;
                avatarUrl = knownProfile.avatarUrl;
              } else {
                try {
                  const profile = await usersApi.getUser(otherUserId);
                  name = profile.data.name;
                  avatarUrl = profile.data.avatar_url;
                  userProfileCache.current.set(otherUserId, {
                    id: profile.data.id,
                    username: profile.data.username,
                    displayName: profile.data.name,
                    avatarUrl: profile.data.avatar_url,
                  });
                } catch {
                  // fall back to showing the raw id
                }
              }

              return {
                id: m.id,
                content: m.content,
                createdAt: m.created_at,
                senderId: m.sender_id,
                otherUserId,
                otherUserName: name,
                otherUserAvatarUrl: avatarUrl,
                scope: "direct",
              } satisfies MessageSearchResultItem;
            }),
          );
          return [...items, ...mapTitleMatches(query, currentUser.id, items)];
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
      <ScheduledMessagesDialog open={scheduledOpen} onClose={() => setScheduledOpen(false)} />
    </Box>
  );
}

const ObservedDirectMessagesPageInner = observer(DirectMessagesPageInner);

export default function DirectMessagesPage() {
  return (
    <Suspense fallback={null}>
      <ObservedDirectMessagesPageInner />
    </Suspense>
  );
}
