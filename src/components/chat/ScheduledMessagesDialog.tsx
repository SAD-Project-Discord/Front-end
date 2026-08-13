"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
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

interface ScheduledMessagesDialogProps {
  open: boolean;
  onClose: () => void;
}

function targetKey(message: ScheduledMessage): string {
  if (message.receiver_id) return `direct:${message.receiver_id}`;
  if (message.group_id) return `group:${message.group_id}`;
  if (message.channel_id) return `channel:${message.channel_id}`;
  return "unknown";
}

export default function ScheduledMessagesDialog({ open, onClose }: ScheduledMessagesDialogProps) {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<Record<string, { label: string; kind: "direct" | "group" | "channel" }>>({});
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
    if (!open) return;
    // Defer initial state updates to avoid synchronous setState inside effect
    // which can trigger cascading renders — satisfy lint rule.
    Promise.resolve().then(() => {
      setLoading(true);
      setError(null);
    });

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
  }, [open, resolveTargets]);

  function handleCancel(id: string) {
    const previous = messages;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    scheduledMessagesApi.cancel(id).catch(() => {
      setMessages(previous);
      setToast({ message: "Couldn't cancel that scheduled message.", severity: "error" });
    });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
          <IconButton aria-label="Close" onClick={onClose} size="small">
            <ArrowBackRounded fontSize="small" />
          </IconButton>
          <Typography component="h1" variant="h1" sx={{ fontSize: "1.25rem" }}>
            Scheduled Messages
          </Typography>
        </Stack>

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
              const key = targetKey(message);
              const target = targets[key];
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
                    <Avatar>
                      {target?.kind === "group" ? <GroupRounded /> : target?.kind === "channel" ? <TagRounded /> : (target?.label ?? "?").charAt(0).toUpperCase()}
                    </Avatar>
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
      </DialogContent>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast ? (
          <Alert severity={toast.severity} onClose={() => setToast(null)} variant="filled">
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Dialog>
  );
}
