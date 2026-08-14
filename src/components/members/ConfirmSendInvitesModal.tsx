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
      setLoading(false);
      setSummary(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await onConfirm();
      setSummary(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Send invitations instead?</DialogTitle>
      <DialogContent>
        {summary ? (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Sent {summary.invited.length} invitations.
            </Typography>
            {summary.inviteForbidden.length > 0 ? (
              <Typography variant="body2" color="error">{summary.inviteForbidden.length} could not be invited due to their privacy settings.</Typography>
            ) : null}
            {Object.keys(summary.errors).length > 0 ? (
              <Typography variant="body2" color="error">{Object.keys(summary.errors).length} other errors occurred.</Typography>
            ) : null}
            <Stack direction="row" spacing={1.5} sx={{ mt: 2, justifyContent: "flex-end" }}>
              <Button onClick={onClose}>Close</Button>
            </Stack>
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              The following users could not be added directly. Send them group invitations instead?
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
              <Button onClick={onClose} disabled={loading}>Cancel</Button>
              <Button variant="contained" onClick={handleConfirm} disabled={loading}>
                {loading ? "Working..." : `Send invitations (${users.length})`}
              </Button>
            </Stack>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default observer(ConfirmSendInvitesModal);
