"use client";

import { useEffect, useState } from "react";
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
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { CloseRounded, PersonAddRounded, SearchRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";

import IconTextField from "@/components/auth/IconTextField";
import { openUserProfile } from "@/lib/profileNav";
import authStore from "@/stores/AuthStore";
import contactStore from "@/stores/ContactStore";
import userStore from "@/stores/UserStore";

interface AddContactDialogProps {
  open: boolean;
  onClose: () => void;
}

const SEARCH_DEBOUNCE_MS = 300;

function AddContactDialog({ open, onClose }: AddContactDialogProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    userStore.clearSearch();
    contactStore.clearActionError();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      userStore.clearSearch();
      return;
    }

    const handle = setTimeout(() => userStore.searchUsers(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [open, query]);

  const results = userStore.searchResults.filter((user) => user.id !== authStore.user?.id);

  function handleClose() {
    setQuery("");
    userStore.clearSearch();
    contactStore.clearActionError();
    onClose();
  }

  async function handleAdd(userId: string) {
    const saved = await contactStore.addContact(userId);
    if (saved) userStore.setContactStatus(userId, true);
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography component="h2" variant="h1" sx={{ fontSize: "1.35rem", fontWeight: 700 }}>
              Add a contact
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Search for someone by name, username, or email.
            </Typography>
          </Box>
          <IconButton aria-label="Close" onClick={handleClose} edge="end">
            <CloseRounded />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <IconTextField
          autoFocus
          label="Find people"
          icon={SearchRounded}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a name or username"
        />

        {userStore.error || contactStore.actionError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {userStore.error ?? contactStore.actionError}
          </Alert>
        ) : null}

        <Box
          sx={{
            minHeight: 260,
            maxHeight: 420,
            overflowY: "auto",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          {userStore.isSearching ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 7 }}>
              <CircularProgress size={28} aria-label="Searching for people" />
            </Box>
          ) : !query.trim() ? (
            <Stack sx={{ alignItems: "center", textAlign: "center", px: 3, py: 7 }} spacing={1}>
              <SearchRounded color="disabled" sx={{ fontSize: 40 }} />
              <Typography variant="body2" color="text.secondary">
                Search to find someone you want to save as a contact.
              </Typography>
            </Stack>
          ) : results.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", px: 3, py: 7 }}>
              No users found.
            </Typography>
          ) : (
            <List disablePadding aria-label="User search results">
              {results.map((user) => {
                const isContact = contactStore.contactStatusFor(user.id) ?? user.is_contact;
                const isAdding = contactStore.isAdding(user.id);

                return (
                  <ListItem
                    key={user.id}
                    disablePadding
                    secondaryAction={
                      isContact ? (
                        <Chip label="Contact" size="small" color="success" variant="outlined" />
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PersonAddRounded fontSize="small" />}
                          disabled={isAdding}
                          onClick={() => handleAdd(user.id)}
                        >
                          {isAdding ? "Adding…" : "Add"}
                        </Button>
                      )
                    }
                  >
                    <ListItemButton onClick={() => openUserProfile(user.id)} sx={{ pr: 14 }}>
                      <ListItemAvatar>
                        <Avatar src={user.avatar_url || undefined}>
                          {(user.name || user.username).charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={user.name} secondary={`@${user.username}`} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default observer(AddContactDialog);
