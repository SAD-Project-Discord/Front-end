"use client";

import { useState } from "react";
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
import { usersApi } from "@/lib/api/users";
import { ApiError } from "@/lib/api/api";

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

export function NewDirectMessageDialog({ open, onClose, onStart, currentUserId }: NewDirectMessageDialogProps) {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<ResolvedUser | null>(null);

  function reset() {
    setUserId("");
    setLoading(false);
    setError(null);
    setFound(null);
  }

  async function handleLookup() {
    const trimmed = userId.trim();
    if (!trimmed) return;

    if (trimmed === currentUserId) {
      setError("That's your own user id.");
      return;
    }

    setLoading(true);
    setError(null);
    setFound(null);
    try {
      const res = await usersApi.getUser(trimmed);
      setFound({
        id: res.data.id,
        username: res.data.username,
        name: res.data.name,
        avatarUrl: res.data.avatar_url,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't find that user.");
    } finally {
      setLoading(false);
    }
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
          Enter the user ID of the person you want to message (ask them for it from their profile).
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="usr_xxxxxxxxxxxx"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          />
          <Button variant="outlined" onClick={handleLookup} disabled={loading || !userId.trim()}>
            {loading ? <CircularProgress size={18} /> : "Look up"}
          </Button>
        </Stack>

        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : null}

        {found ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mt: 2, p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}>
            <Avatar
              src={found.avatarUrl || undefined}
              slotProps={{ img: { loading: "lazy", decoding: "async" } }}
            >
              {found.name.charAt(0).toUpperCase()}
            </Avatar>
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {found.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                @{found.username}
              </Typography>
            </Stack>
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
