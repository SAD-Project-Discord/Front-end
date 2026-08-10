"use client";

import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import { observer } from "mobx-react-lite";
import userStore from "@/stores/UserStore";

export interface ResolvedUser {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
}

export interface NewDirectMessageDialogProps {
  open: boolean;
  onClose: () => void;
  onStart: (user: ResolvedUser) => void;
  currentUserId: string;
}

const SEARCH_DEBOUNCE_MS = 300;

function NewDirectMessageDialogImpl({ open, onClose, onStart, currentUserId }: NewDirectMessageDialogProps) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<ResolvedUser | null>(null);

  function reset() {
    setQuery("");
    setFound(null);
    userStore.clearSearch();
  }

  useEffect(() => {
    if (!open) return;
    userStore.clearSearch();
  }, [open]);

  useEffect(() => {
    const handle = setTimeout(() => {
      userStore.searchUsers(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query]);

  const results = userStore.searchResults.filter((u) => u.id !== currentUserId);

  function selectUser(user: (typeof results)[number]) {
    setFound({ id: user.id, username: user.username, name: user.name, avatarUrl: user.avatar_url });
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>New direct message</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Search by name, username, or email.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Search people"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setFound(null);
          }}
        />

        {userStore.error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {userStore.error}
          </Alert>
        ) : null}

        {query.trim() && !found ? (
          <Box
            sx={{
              mt: 2,
              maxHeight: 260,
              overflowY: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            {userStore.isSearching ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={22} />
              </Box>
            ) : results.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3, px: 2 }}>
                No users found.
              </Typography>
            ) : (
              <List disablePadding>
                {results.map((user) => (
                  <ListItemButton key={user.id} dense onClick={() => selectUser(user)}>
                    <ListItemAvatar>
                      <Avatar src={user.avatar_url || undefined}>{user.name.charAt(0).toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={user.name} secondary={`@${user.username}`} />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        ) : null}

        {found ? (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center", mt: 2, p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}
          >
            <Avatar src={found.avatarUrl || undefined} slotProps={{ img: { loading: "lazy", decoding: "async" } }}>
              {found.name.charAt(0).toUpperCase()}
            </Avatar>
            <Stack sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {found.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                @{found.username}
              </Typography>
            </Stack>
            <Button size="small" onClick={() => setFound(null)}>
              Change
            </Button>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            reset();
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!found}
          onClick={() => {
            if (found) onStart(found);
            reset();
            onClose();
          }}
        >
          Start conversation
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export const NewDirectMessageDialog = observer(NewDirectMessageDialogImpl);
