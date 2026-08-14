"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Stack,
  Typography,
} from "@mui/material";
import { Search, Close, PersonAdd } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import IconTextField from "@/components/auth/IconTextField";
import contactStore from "@/stores/ContactStore";
import userStore from "@/stores/UserStore";
import authStore from "@/stores/AuthStore";
import type { PublicUserProfile } from "@/types/user";

interface AddMembersModalProps {
  open: boolean;
  onClose: () => void;
  /** Callback that actually adds/invites the chosen users. Returns true on success. */
  onSubmit: (users: PublicUserProfile[]) => Promise<boolean>;
  /** User ids already in the target group/channel — marked and unchoosable. */
  existingMemberIds: string[];
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  /** Optional controlled submit state (e.g. from a store). Falls back to internal state. */
  isSubmitting?: boolean;
  submitError?: string | null;
}

const SEARCH_DEBOUNCE_MS = 300;

function getInitials(user: PublicUserProfile): string {
  const source = user.name || user.username || "";
  return source.trim().charAt(0).toUpperCase();
}

function AddMembersModal({
  open,
  onClose,
  onSubmit,
  existingMemberIds,
  title = "Invite People",
  subtitle = "Add people from your contacts, or search everyone.",
  submitLabel = "Add",
  isSubmitting,
  submitError,
}: AddMembersModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Map<string, PublicUserProfile>>(new Map());
  const [localSubmitError, setLocalSubmitError] = useState<string | null>(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  useEffect(() => {
    // Reset of local form state happens in handleClose (every close path runs it),
    // so the open effect only drives external side-effects.
    if (open) {
      userStore.clearSearch();
      contactStore.loadContacts();
    }
  }, [open]);

  useEffect(() => {
    const handle = setTimeout(() => {
      userStore.searchUsers(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query]);

  const submitting = Boolean(isSubmitting) || localSubmitting;
  const displayError = submitError ?? localSubmitError;

  const searching = query.trim().length > 0;
  const existingSet = new Set(existingMemberIds);
  const selfId = authStore.user?.id;

  const users: PublicUserProfile[] = (searching ? userStore.searchResults : contactStore.contacts)
    .filter((user) => user.id !== selfId);

  const listLoading = searching ? userStore.isSearching : contactStore.isLoading;
  const loadError = searching ? userStore.error : contactStore.error;

  const toggle = (user: PublicUserProfile) => {
    if (existingSet.has(user.id)) return;
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) {
        next.delete(user.id);
      } else {
        next.set(user.id, user);
      }
      return next;
    });
  };

  const handleClose = () => {
    if (submitting) return;
    setQuery("");
    setSelected(new Map());
    setLocalSubmitError(null);
    userStore.clearSearch();
    onClose();
  };

  const handleSubmit = async () => {
    const users = Array.from(selected.values());
    if (users.length === 0) return;

    setLocalSubmitError(null);
    setLocalSubmitting(true);

    const ok = await onSubmit(users);

    setLocalSubmitting(false);

    if (ok) {
      handleClose();
    } else {
      setLocalSubmitError("Could not add the selected people. Please try again.");
    }
  };

  const selectedCount = selected.size;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: { xs: 1, sm: 1.5 },
          },
        },
      }}
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
          <IconButton
            aria-label="Close"
            onClick={handleClose}
            disabled={submitting}
            edge="end"
            size="small"
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <IconTextField
          label="Search"
          icon={Search}
          placeholder="Search by name or username"
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
        />

        {loadError ? (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {loadError}
          </Alert>
        ) : null}

        <Box
          sx={{
            minHeight: 200,
            maxHeight: 320,
            overflowY: "auto",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          {listLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress size={26} />
            </Box>
          ) : users.length === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5, px: 2 }}>
              <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
                {searching ? "No users found." : "You have no contacts yet. Try searching."}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {users.map((user) => {
                const already = existingSet.has(user.id);
                const checked = already || selected.has(user.id);

                return (
                  <ListItem
                    key={user.id}
                    disablePadding
                    secondaryAction={
                      already ? <Chip label="Member" size="small" /> : null
                    }
                  >
                    <ListItemButton dense disabled={already} onClick={() => toggle(user)}>
                      <ListItemIcon sx={{ minWidth: 0, mr: 1 }}>
                        <Checkbox
                          edge="start"
                          checked={checked}
                          disabled={already}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemAvatar>
                        <Avatar src={user.avatar_url || undefined}>{getInitials(user)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={user.name} secondary={`@${user.username}`} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>

        {displayError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {displayError}
          </Alert>
        ) : null}

        <Stack direction="row" spacing={1.5} sx={{ mt: 3, alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary", mr: "auto" }}>
            {selectedCount} selected
          </Typography>
          <Button
            type="button"
            variant="text"
            color="inherit"
            size="large"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSubmit}
            disabled={submitting || selectedCount === 0}
            endIcon={<PersonAdd fontSize="small" />}
          >
            {submitting ? "Working..." : `${submitLabel} (${selectedCount})`}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default observer(AddMembersModal);
