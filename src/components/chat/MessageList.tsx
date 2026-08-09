"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import type { Message, User } from "@/lib/types";
import { DateSeparator } from "./DateSeparator";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  /** Every known participant in this conversation, keyed by user id (including the current user). */
  participantsById: Record<string, User>;
  typingUserNames?: string[];
  onLoadOlder?: () => void;
  hasMoreOlder?: boolean;
  loadingOlder?: boolean;
  onEditMessage?: (message: Message, newContent: string) => void;
  onDeleteMessage?: (message: Message) => void;
  onRetryMessage?: (message: Message) => void;
  /** Scrolls to and briefly highlights this message (used by search "jump to message"). */
  highlightMessageId?: string;
  emptyState?: React.ReactNode;
}

const LOAD_OLDER_THRESHOLD_PX = 120;
const NEAR_BOTTOM_THRESHOLD_PX = 150;

const UNKNOWN_USER: User = { id: "", username: "unknown", displayName: "Unknown user" };

export function MessageList({
  messages,
  currentUserId,
  participantsById,
  typingUserNames,
  onLoadOlder,
  hasMoreOlder = false,
  loadingOlder = false,
  onEditMessage,
  onDeleteMessage,
  onRetryMessage,
  highlightMessageId,
  emptyState,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevScrollHeight = useRef<number | null>(null);
  const prevMessageCount = useRef(messages.length);
  const isNearBottomRef = useRef(true);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  // Preserve scroll position when older messages are prepended.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (prevScrollHeight.current !== null && messages.length > prevMessageCount.current) {
      const addedHeight = el.scrollHeight - prevScrollHeight.current;
      if (addedHeight > 0 && !isNearBottomRef.current) {
        el.scrollTop += addedHeight;
      } else if (isNearBottomRef.current) {
        el.scrollTop = el.scrollHeight;
      }
    }
    prevScrollHeight.current = null;
    prevMessageCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (!highlightMessageId) return;
    const node = messageRefs.current.get(highlightMessageId);
    if (node) {
      node.scrollIntoView({ block: "center", behavior: "smooth" });
      setHighlighted(highlightMessageId);
      const timer = setTimeout(() => setHighlighted(null), 1600);
      return () => clearTimeout(timer);
    }
  }, [highlightMessageId]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;

    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;

    if (el.scrollTop < LOAD_OLDER_THRESHOLD_PX && hasMoreOlder && !loadingOlder && onLoadOlder) {
      prevScrollHeight.current = el.scrollHeight;
      onLoadOlder();
    }
  }

  if (messages.length === 0) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", px: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {emptyState ?? "No messages yet. Say hello!"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={scrollRef}
      onScroll={handleScroll}
      sx={{ flex: 1, minHeight: 0, overflowY: "auto", py: 1 }}
    >
      {loadingOlder ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
          <CircularProgress size={18} />
        </Box>
      ) : null}

      {messages.map((message, index) => {
        const previous = messages[index - 1];
        const showDateSeparator = !previous || !isSameDay(previous.createdAt, message.createdAt);
        const isGroupedWithPrevious =
          !showDateSeparator &&
          Boolean(previous) &&
          previous.senderId === message.senderId &&
          minutesBetween(previous.createdAt, message.createdAt) < 5;

        const sender = participantsById[message.senderId] ?? UNKNOWN_USER;

        return (
          <div
            key={message.id}
            ref={(node) => {
              if (node) messageRefs.current.set(message.id, node);
              else messageRefs.current.delete(message.id);
            }}
            style={{
              transition: "background-color 400ms ease",
              backgroundColor: highlighted === message.id ? "rgba(91,110,245,0.18)" : "transparent",
              borderRadius: 12,
            }}
          >
            {showDateSeparator ? <DateSeparator date={message.createdAt} /> : null}
            <MessageBubble
              message={message}
              sender={sender}
              isOwnMessage={message.senderId === currentUserId}
              isGroupedWithPrevious={isGroupedWithPrevious}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
              onRetry={onRetryMessage}
            />
          </div>
        );
      })}

      <TypingIndicator typingUserNames={typingUserNames} />
    </Box>
  );
}

function isSameDay(isoA: string, isoB: string): boolean {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function minutesBetween(isoA: string, isoB: string): number {
  return Math.abs(new Date(isoB).getTime() - new Date(isoA).getTime()) / 60_000;
}
