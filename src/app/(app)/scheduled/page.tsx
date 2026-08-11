"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Card,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowBackRounded, DeleteRounded, GroupRounded, TagRounded } from "@mui/icons-material";
import { scheduledMessagesApi, type ScheduledMessage } from "@/lib/api/scheduledMessages";
import { usersApi } from "@/lib/api/users";
import groupService from "@/services/group.service";
import channelService from "@/services/channel.service";

interface TargetInfo {
  label: string;
  kind: "direct" | "group" | "channel";
}

function targetKey(message: ScheduledMessage): string {
  if (message.receiver_id) return `direct:${message.receiver_id}`;
  if (message.group_id) return `group:${message.group_id}`;
  if (message.channel_id) return `channel:${message.channel_id}`;
  return "unknown";
}

export default function ScheduledMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<Record<string, TargetInfo>>({});
  const [toast, setToast] = useState<{ message: string; severity: "error" | "success" } | null>(null);
  const resolvingRef = useRef<Set<string>>(new Set());

  const resolveTargets = useCallback((list: ScheduledMessage[]) => {
    for (const message of list) {
      const key = targetKey(message);
      if (key === "unknown" || resolvingRef.current.has(key)) continue;
      resolvingRef.current.add(key);

      if (message.receiver_id) {
        usersApi
          .getUser(message.receiver_id)
          .then((res) => setTargets((prev) => ({ ...prev, [key]: { label: res.data.name, kind: "direct" } })))
          .catch(() => setTargets((prev) => ({ ...prev, [key]: { label: "Unknown user", kind: "direct" } })));
      } else if (message.group_id) {
        groupService
          .getGroup(message.group_id)
          .then((res) => setTargets((prev) => ({ ...prev, [key]: { label: res.data.name, kind: "group" } })))
          .catch(() => setTargets((prev) => ({ ...prev, [key]: { label: "Unknown group", kind: "group" } })));
      } else if (message.channel_id) {
        channelService
          .getChannel(message.channel_id)
          .then((res) => setTargets((prev) => ({ ...prev, [key]: { label: res.data.name, kind: "channel" } })))
          .catch(() => setTargets((prev) => ({ ...prev, [key]: { label: "Unknown channel", kind: "channel" } })));
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    scheduledMessagesApi
      .list()
      .then((list) => {
        const sorted = [...list].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
        );
        setMessages(sorted);
        resolveTargets(sorted);
      })
      .catch(() => setError("Couldn't load scheduled messages."))
      .finally(() => setLoading(false));
  }, [resolveTargets]);

  function handleCancel(id: string) {
    const previous = messages;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    scheduledMessagesApi.cancel(id).catch(() => {
      setMessages(previous);
      setToast({ message: "Couldn't cancel that scheduled message.", severity: "error" });
    });
  }

  return (
    <Box
      component="main"
      sx={{ minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", p: { xs: 2, sm: 4 } }}
    >
      <Card
        elevation={0}
        sx={{ width: "100%", maxWidth: 640, p: { xs: 3, sm: 4 }, border: "1px solid", borderColor: "divider", borderRadius: 3 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
          <IconButton aria-label="Back" onClick={() => router.back()} size="small">
            <ArrowBackRounded fontSize="small" />
          </IconButton>
          <Typography component="h1" variant="h1" sx={{ fontSize: "1.4rem" }}>
            Scheduled Messages
          </Typography>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={26} />
          </Box>
        ) : messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            No messages scheduled. Use the clock icon next to Send in any conversation to schedule one.
          </Typography>
        ) : (
          <List disablePadding>
            {messages.map((message) => {
              const target = targets[targetKey(message)];
              return (
                <ListItem
                  key={message.id}
                  divider
                  secondaryAction={
                    <IconButton edge="end" aria-label="Cancel" onClick={() => handleCancel(message.id)}>
                      <DeleteRounded fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>{target?.kind === "group" ? <GroupRounded /> : target?.kind === "channel" ? <TagRounded /> : (target?.label ?? "?").charAt(0).toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {target?.label ?? "Loading…"}
                        </Typography>
                        <Chip
                          size="small"
                          label={new Date(message.scheduled_at).toLocaleString()}
                          sx={{ height: 20, fontSize: "0.7rem" }}
                        />
                      </Stack>
                    }
                    secondary={message.content || "(attachment only)"}
                    slotProps={{ secondary: { noWrap: true } }}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Card>

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
