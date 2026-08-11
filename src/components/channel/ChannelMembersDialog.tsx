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
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { observer } from "mobx-react-lite";
import channelStore from "@/stores/ChannelStore";
import AddMembersModal from "@/components/members/AddMembersModal";
import { InviteLinkSection } from "@/components/members/InviteLinkSection";
import type { Channel } from "@/types/channel";

export interface ChannelMembersDialogProps {
  open: boolean;
  onClose: () => void;
  channel: Channel;
  currentUserId: string;
  onLeftOrDeleted: () => void;
}

function ChannelMembersDialog({ open, onClose, channel, currentUserId, onLeftOrDeleted }: ChannelMembersDialogProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [working, setWorking] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const isOwner = channel.creator_id === currentUserId;

  useEffect(() => {
    if (open) channelStore.clearInviteLink();
  }, [open, channel.id]);

  async function handleRemove(userId: string) {
    setWorking(true);
    await channelStore.removeChannelMember(channel.id, userId);
    setWorking(false);
  }

  async function handleTogglePrivacy() {
    setSavingPrivacy(true);
    await channelStore.updateChannelInfo(channel.id, { is_private: !(channel.is_private ?? true) });
    setSavingPrivacy(false);
  }

  async function handleLeaveOrDelete() {
    setWorking(true);
    const ok = isOwner ? await channelStore.deleteChannel(channel.id) : await channelStore.leaveChannel(channel.id);
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
              {channel.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {channelStore.channelMembers.length} members
            </Typography>
          </Box>
          <IconButton aria-label="Close" onClick={onClose} edge="end" size="small">
            <Close fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {channelStore.channelMembersError ? (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {channelStore.channelMembersError}
          </Alert>
        ) : null}
        {channelStore.membersActionError ? (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {channelStore.membersActionError}
          </Alert>
        ) : null}

        <Box sx={{ maxHeight: 320, overflowY: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          {channelStore.channelMembersLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List disablePadding>
              {channelStore.channelMembers.map((member) => (
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

        {isOwner ? (
          <>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PersonAddAlt fontSize="small" />}
              sx={{ mt: 2 }}
              onClick={() => setAddOpen(true)}
            >
              Add members
            </Button>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              Channel settings
            </Typography>
            <FormControlLabel
              sx={{ ml: 0, width: "100%", justifyContent: "space-between", mb: 2 }}
              control={<Switch checked={channel.is_private ?? true} onChange={handleTogglePrivacy} disabled={savingPrivacy} />}
              labelPlacement="start"
              label={
                <Box>
                  <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500 }}>
                    Private channel
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {channel.is_private ?? true ? "Only added members can join." : "Anyone can find and join this channel."}
                  </Typography>
                </Box>
              }
            />
            <InviteLinkSection
              targetName={channel.name}
              link={channelStore.inviteLink}
              loading={channelStore.inviteLinkLoading}
              error={channelStore.inviteLinkError}
              onGenerate={() => channelStore.getOrCreateInviteLink(channel.id)}
            />
          </>
        ) : null}

        <Divider sx={{ my: 2 }} />

        {confirmLeave ? (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              {isOwner
                ? "Deleting this channel removes it for everyone. This can't be undone."
                : "You'll need to be added again to rejoin this channel."}
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button fullWidth variant="text" color="inherit" onClick={() => setConfirmLeave(false)} disabled={working}>
                Cancel
              </Button>
              <Button fullWidth variant="contained" color="error" onClick={handleLeaveOrDelete} disabled={working}>
                {working ? "Working..." : isOwner ? "Delete channel" : "Leave channel"}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Button fullWidth variant="text" color="error" onClick={() => setConfirmLeave(true)}>
            {isOwner ? "Delete channel" : "Leave channel"}
          </Button>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }} />

      <AddMembersModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        existingMemberIds={channelStore.myChannelMemberIds}
        onSubmit={(userIds) => channelStore.addChannelMembers(channel.id, userIds)}
        isSubmitting={channelStore.isSubmittingMembers}
        submitError={channelStore.membersActionError}
        title="Add to channel"
        subtitle="Search for people to add directly to this channel."
        submitLabel="Add"
      />
    </Dialog>
  );
}

export default observer(ChannelMembersDialog);
