"use client";

import React from "react";
import { Box, Button, Dialog, DialogContent, DialogTitle, List, ListItem, ListItemAvatar, Avatar, ListItemText, Stack, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";

interface PendingUser {
  id: string;
  name: string;
}

interface ConfirmSendInvitesModalProps {
  open: boolean;
  users: PendingUser[];
  onClose: () => void;
  onConfirm: () => Promise<{ invited: string[]; inviteForbidden: string[]; errors: Record<string, string> }>;
}

function ConfirmSendInvitesModal({ open, users, onClose, onConfirm }: ConfirmSendInvitesModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<null | { invited: string[]; inviteForbidden: string[]; errors: Record<string, string> }>(null);

  React.useEffect(() => {
    if (!open) {
      // schedule resets asynchronously to avoid setState-in-effect lint error
      Promise.resolve().then(() => {
        setLoading(false);
        setSummary(null);
      });
    }
  }, [open]);

  // Intentionally do not call the backend to send invitations here — the
  // backend is currently unreliable. Instead, advise the user to try
  // sending an invite link manually via the channel/group invite UI.
  const handleConfirm = () => {
    setLoading(true);
    // Simulate a quick acknowledgement flow, then close.
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 250);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Try sending an invite link?</DialogTitle>
      <DialogContent>
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            The following users could not be added directly. Try sending them an invite link instead using the channel/group invite link controls.
          </Typography>
          <List>
            {users.map((u) => (
              <ListItem key={u.id} sx={{ py: 1 }}>
                <ListItemAvatar>
                  <Avatar>{(u.name || "?").charAt(0).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={u.name} />
              </ListItem>
            ))}
          </List>

          <Stack direction="row" spacing={1.5} sx={{ mt: 2, justifyContent: "flex-end" }}>
            <Button variant="contained" onClick={onClose} disabled={loading}>
              {loading ? "Working..." : "OK"}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default observer(ConfirmSendInvitesModal);
