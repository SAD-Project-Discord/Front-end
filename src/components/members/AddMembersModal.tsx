"use client";

import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { Close, PersonAdd } from "@mui/icons-material";
import IconTextField from "@/components/auth/IconTextField";
import { Search } from "@mui/icons-material";
import userService from "@/services/user.service";
import authStore from "@/stores/AuthStore";
import type { User } from "@/types/auth";

export interface AddMembersModalProps {
  open: boolean;
  onClose: () => void;
  /** Callback that actually sends the invitations. Returns true on success. */
  onSubmit: (userIds: string[]) => Promise<boolean>;
  /** User ids already in the group — looked up but shown as already-a-member instead of addable. */
  existingMemberIds: string[];
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  submitError?: string | null;
}

function getInitials(user: User): string {
  const source = user.name || user.username || "";
  return source.trim().charAt(0).toUpperCase();
}

export default function AddMembersModal({
  open,
  onClose,
  onSubmit,
  existingMemberIds,
  title = "Invite People",
  subtitle = "Enter a user's ID to invite them (ask them for it from their profile).",
  submitLabel = "Invite",
  isSubmitting,
  submitError,
}: AddMembersModalProps) {
  const [userId, setUserId] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const [pending, setPending] = useState<Map<string, User>>(new Map());
  const [localSubmitError, setLocalSubmitError] = useState<string | null>(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const submitting = Boolean(isSubmitting) || localSubmitting;
  const displayError = submitError ?? localSubmitError;
  const existingSet = new Set(existingMemberIds);

  async function handleLookup() {
    const trimmed = userId.trim();
    if (!trimmed) return;

    if (trimmed === authStore.user?.id) {
      setLookupError("That's your own user id.");
      return;
    }

    if (existingSet.has(trimmed) || pending.has(trimmed)) {
      setLookupError("That person is already in the list.");
      return;
    }

    setLooking(true);
    setLookupError(null);
    try {
      const user = await userService.getUser(trimmed);
      setPending((prev) => new Map(prev).set(user.id, user));
      setUserId("");
    } catch {
      setLookupError("Couldn't find a user with that ID.");
    } finally {
      setLooking(false);
    }
  }

  function removePending(id: string) {
    setPending((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }

  function reset() {
    setUserId("");
    setLookupError(null);
    setPending(new Map());
    setLocalSubmitError(null);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit() {
    const ids = Array.from(pending.keys());
    if (ids.length === 0) return;

    setLocalSubmitError(null);
    setLocalSubmitting(true);
    const ok = await onSubmit(ids);
    setLocalSubmitting(false);

    if (ok) {
      reset();
      onClose();
    } else {
      setLocalSubmitError("Could not invite the selected people. Please try again.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: 3, p: { xs: 1, sm: 1.5 } } } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h1" component="h2" sx={{ fontSize: "1.4rem" }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          </Box>
          <IconButton aria-label="Close" onClick={handleClose} disabled={submitting} edge="end" size="small">
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          <Box sx={{ flex: 1 }}>
            <IconTextField
              label="User ID"
              icon={Search}
              placeholder="usr_xxxxxxxxxxxx"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              error={Boolean(lookupError)}
              helperText={lookupError ?? undefined}
            />
          </Box>
          <Button
            variant="outlined"
            sx={{ mt: 0.25 }}
            onClick={handleLookup}
            disabled={looking || !userId.trim()}
          >
            {looking ? <CircularProgress size={18} /> : "Add"}
          </Button>
        </Stack>

        {pending.size > 0 ? (
          <List
            dense
            sx={{ maxHeight: 240, overflowY: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2 }}
          >
            {Array.from(pending.values()).map((user) => (
              <ListItem
                key={user.id}
                secondaryAction={
                  <IconButton edge="end" size="small" onClick={() => removePending(user.id)} disabled={submitting}>
                    <Close fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar src={user.avatar_url || undefined}>{getInitials(user)}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={user.name} secondary={`@${user.username}`} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No one added yet — look someone up by their user ID above.
            </Typography>
          </Box>
        )}

        {displayError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {displayError}
          </Alert>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}>
          {pending.size} selected
        </Typography>
        <Button variant="text" color="inherit" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || pending.size === 0}
          endIcon={<PersonAdd fontSize="small" />}
        >
          {submitting ? "Working..." : `${submitLabel} (${pending.size})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
