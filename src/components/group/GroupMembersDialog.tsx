"use client";

import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { Close, PersonAddAlt, PersonRemove } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import groupStore from "@/stores/GroupStore";
import AddMembersModal from "@/components/members/AddMembersModal";
import type { GroupInfo } from "@/types/group";

export interface GroupMembersDialogProps {
  open: boolean;
  onClose: () => void;
  group: GroupInfo;
  currentUserId: string;
  onLeftOrDeleted: () => void;
}

function GroupMembersDialog({ open, onClose, group, currentUserId, onLeftOrDeleted }: GroupMembersDialogProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [working, setWorking] = useState(false);

  const isOwner = groupStore.roleForMember(group.id, currentUserId) === "owner";

  async function handleRemove(userId: string) {
    setWorking(true);
    await groupStore.removeGroupMember(group.id, userId);
    setWorking(false);
  }

  async function handleLeaveOrDelete() {
    setWorking(true);
    const ok = isOwner ? await groupStore.deleteGroup(group.id) : await groupStore.leaveGroup(group.id);
    setWorking(false);
    if (ok) {
      setConfirmLeave(false);
      onClose();
      onLeftOrDeleted();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h1" component="h2" sx={{ fontSize: "1.4rem" }}>
              {group.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {groupStore.groupMembers.length} members
            </Typography>
          </Box>
          <IconButton aria-label="Close" onClick={onClose} edge="end" size="small">
            <Close fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {groupStore.groupMembersError ? (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {groupStore.groupMembersError}
          </Alert>
        ) : null}
        {groupStore.invitationActionError ? (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {groupStore.invitationActionError}
          </Alert>
        ) : null}

        <Box sx={{ maxHeight: 320, overflowY: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          {groupStore.groupMembersLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List disablePadding>
              {groupStore.groupMembers.map((member) => (
                <ListItem
                  key={member.user_id}
                  secondaryAction={
                    isOwner && member.user_id !== currentUserId ? (
                      <IconButton
                        edge="end"
                        size="small"
                        disabled={working}
                        onClick={() => handleRemove(member.user_id)}
                        aria-label={`Remove ${member.name}`}
                      >
                        <PersonRemove fontSize="small" />
                      </IconButton>
                    ) : null
                  }
                >
                  <ListItemAvatar>
                    <Avatar>{member.name.charAt(0).toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.name}
                    secondary={`@${member.username}`}
                  />
                  {member.role === "owner" ? <Chip label="Owner" size="small" sx={{ mr: 1 }} /> : null}
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<PersonAddAlt fontSize="small" />}
          sx={{ mt: 2 }}
          onClick={() => setInviteOpen(true)}
        >
          Invite people
        </Button>

        <Divider sx={{ my: 2 }} />

        {confirmLeave ? (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              {isOwner
                ? "Deleting this group removes it for everyone. This can't be undone."
                : "You'll need a new invitation to rejoin this group."}
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button fullWidth variant="text" color="inherit" onClick={() => setConfirmLeave(false)} disabled={working}>
                Cancel
              </Button>
              <Button fullWidth variant="contained" color="error" onClick={handleLeaveOrDelete} disabled={working}>
                {working ? "Working..." : isOwner ? "Delete group" : "Leave group"}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Button fullWidth variant="text" color="error" onClick={() => setConfirmLeave(true)}>
            {isOwner ? "Delete group" : "Leave group"}
          </Button>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }} />

      <AddMembersModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        existingMemberIds={groupStore.myGroupMemberIds}
        onSubmit={(userIds) => groupStore.sendGroupInvitations(group.id, userIds)}
        isSubmitting={groupStore.isSubmittingInvitation}
        submitError={groupStore.invitationActionError}
        title="Invite to group"
        subtitle="Enter a user's ID to send them a group invitation."
        submitLabel="Invite"
      />
    </Dialog>
  );
}

export default observer(GroupMembersDialog);
