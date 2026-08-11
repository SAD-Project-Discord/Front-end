"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
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
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CloseRounded,
  DeleteOutlineRounded,
  PersonAddAltRounded,
  PersonRemoveRounded,
  SaveRounded,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import AddMembersModal from "@/components/members/AddMembersModal";
import { InviteLinkSection } from "@/components/members/InviteLinkSection";
import channelStore from "@/stores/ChannelStore";
import type { Channel, UpdateChannelRequest } from "@/types/channel";

interface ChannelSettingsModalProps {
  open: boolean;
  onClose: () => void;
  channel: Channel;
  currentUserId: string;
  onLeftOrDeleted: () => void;
}

function ChannelSettingsModal({
  open,
  onClose,
  channel,
  currentUserId,
  onLeftOrDeleted,
}: ChannelSettingsModalProps) {
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description);
  const [isPrivate, setIsPrivate] = useState(channel.is_private);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [confirmActionOpen, setConfirmActionOpen] = useState(false);
  const [actionWorking, setActionWorking] = useState(false);

  const isOwner = channel.creator_id === currentUserId;
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const hasChanges =
    trimmedName !== channel.name ||
    trimmedDescription !== channel.description ||
    isPrivate !== channel.is_private;
  const isWorking =
    actionWorking ||
    channelStore.isSavingChannel ||
    channelStore.isSubmittingMembers;

  useEffect(() => {
    if (!open) return;
    channelStore.setChannelsError(null);
    channelStore.clearChannelSettingsError();
    channelStore.clearChannelMemberActionError();
    channelStore.clearInviteLink();
    channelStore.loadChannelMembers(channel.id);
  }, [open, channel.id]);

  function resetForm() {
    setName(channel.name);
    setDescription(channel.description);
    setIsPrivate(channel.is_private);
    setFormError(null);
    setSaved(false);
  }

  function handleFieldChange(
    setter: (value: string) => void,
  ) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
      setFormError(null);
      setSaved(false);
      channelStore.clearChannelSettingsError();
    };
  }

  function handleClose() {
    if (isWorking) return;
    resetForm();
    setAddMembersOpen(false);
    setConfirmActionOpen(false);
    onClose();
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setFormError(null);

    if (!trimmedName) {
      setFormError("Channel name is required.");
      return;
    }
    if (!isOwner || !hasChanges) return;
    if (trimmedName.length > 100) {
      setFormError("Channel name must be 100 characters or fewer.");
      return;
    }

    const payload: UpdateChannelRequest = {};
    if (trimmedName !== channel.name) payload.name = trimmedName;
    if (trimmedDescription !== channel.description) payload.description = trimmedDescription;
    if (isPrivate !== channel.is_private) payload.is_private = isPrivate;

    const updated = await channelStore.updateChannelInfo(channel.id, payload);
    if (updated) {
      setName(updated.name);
      setDescription(updated.description);
      setIsPrivate(updated.is_private);
      setSaved(true);
    }
  }

  async function handleRemoveMember(userId: string) {
    setActionWorking(true);
    await channelStore.removeChannelMember(channel.id, userId);
    setActionWorking(false);
  }

  async function handleLeaveOrDelete() {
    setActionWorking(true);
    const completed = isOwner
      ? await channelStore.deleteChannel(channel.id)
      : await channelStore.leaveChannel(channel.id);
    setActionWorking(false);

    if (completed) {
      setConfirmActionOpen(false);
      onClose();
      onLeftOrDeleted();
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={isWorking ? undefined : handleClose}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: 3, p: { xs: 1, sm: 1.5 } } } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h1" component="h2" sx={{ fontSize: "1.4rem" }}>
                Channel settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Manage channel information, access, and members.
              </Typography>
            </Box>
            <IconButton aria-label="Close channel settings" onClick={handleClose} disabled={isWorking} edge="end">
              <CloseRounded />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          {channelStore.channelsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {channelStore.channelsError}
            </Alert>
          ) : null}

          <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "360px 1fr" } }}>
            <Stack spacing={3}>
              <Box component="form" onSubmit={handleSave} noValidate>
                <Stack spacing={2}>
                  <TextField
                    label="Channel name"
                    value={name}
                    onChange={handleFieldChange(setName)}
                    required
                    fullWidth
                    disabled={!isOwner || isWorking}
                    slotProps={{ htmlInput: { maxLength: 100 } }}
                  />
                  <TextField
                    label="Description"
                    value={description}
                    onChange={handleFieldChange(setDescription)}
                    fullWidth
                    multiline
                    minRows={3}
                    disabled={!isOwner || isWorking}
                    placeholder="What is this channel for?"
                  />

                  <FormControlLabel
                    sx={{ ml: 0, width: "100%", justifyContent: "space-between", alignItems: "flex-start" }}
                    control={
                      <Switch
                        checked={isPrivate}
                        onChange={(event) => {
                          setIsPrivate(event.target.checked);
                          setSaved(false);
                          channelStore.clearChannelSettingsError();
                        }}
                        disabled={!isOwner || isWorking}
                        slotProps={{ input: { "aria-label": "Private channel" } }}
                      />
                    }
                    labelPlacement="start"
                    label={
                      <Box sx={{ pr: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Private channel
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {isPrivate
                            ? "Only members and people with an invite link can access this channel."
                            : "Non-members can view channel details; joining still requires an invite."}
                        </Typography>
                      </Box>
                    }
                  />

                  {formError || channelStore.channelSettingsError ? (
                    <Alert severity="error">{formError ?? channelStore.channelSettingsError}</Alert>
                  ) : null}
                  {saved ? <Alert severity="success">Channel settings saved.</Alert> : null}

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Button type="button" color="inherit" fullWidth onClick={handleClose} disabled={isWorking}>
                      Close
                    </Button>
                    {isOwner ? (
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        startIcon={<SaveRounded />}
                        disabled={isWorking || !hasChanges}
                      >
                        {channelStore.isSavingChannel ? "Saving…" : "Save changes"}
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
              </Box>

              {isOwner ? (
                <>
                  <Divider />
                  <InviteLinkSection
                    targetName={channel.name}
                    link={channelStore.inviteLink}
                    loading={channelStore.inviteLinkLoading}
                    error={channelStore.inviteLinkError}
                    onGenerate={() => channelStore.getOrCreateInviteLink(channel.id)}
                  />
                </>
              ) : null}

              <Box sx={{ p: 2, border: "1px solid", borderColor: "error.main", borderRadius: 2 }}>
                <Typography variant="subtitle2" color="error" sx={{ mb: 0.5 }}>
                  {isOwner ? "Delete channel" : "Leave channel"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {isOwner
                    ? "Deleting this channel removes it for everyone and cannot be undone."
                    : "You will need another invitation to rejoin this channel."}
                </Typography>
                <Button
                  color="error"
                  variant="outlined"
                  fullWidth
                  startIcon={<DeleteOutlineRounded />}
                  onClick={() => setConfirmActionOpen(true)}
                  disabled={isWorking}
                >
                  {isOwner ? "Delete channel" : "Leave channel"}
                </Button>
              </Box>
            </Stack>

            <Box>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle1">
                  Members ({channelStore.channelMembers.length})
                </Typography>
                {isOwner ? (
                  <Tooltip title="Add members">
                    <IconButton
                      size="small"
                      onClick={() => setAddMembersOpen(true)}
                      disabled={isWorking}
                      aria-label="Add channel members"
                    >
                      <PersonAddAltRounded />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>

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

              <Box sx={{ maxHeight: 460, overflowY: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                {channelStore.channelMembersLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                    <CircularProgress size={26} />
                  </Box>
                ) : channelStore.channelMembers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
                    No members found.
                  </Typography>
                ) : (
                  <List disablePadding>
                    {channelStore.channelMembers.map((member) => (
                      <ListItem
                        key={member.user_id}
                        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                        secondaryAction={
                          isOwner && member.user_id !== currentUserId ? (
                            <Tooltip title={`Remove ${member.name}`}>
                              <IconButton
                                edge="end"
                                size="small"
                                color="error"
                                disabled={isWorking}
                                onClick={() => handleRemoveMember(member.user_id)}
                                aria-label={`Remove ${member.name}`}
                              >
                                <PersonRemoveRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null
                        }
                      >
                        <ListItemAvatar>
                          <Avatar>{member.name.trim().charAt(0).toUpperCase() || "?"}</Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={member.name} secondary={`@${member.username}`} />
                        <Chip label={member.role === "owner" ? "Owner" : "Member"} size="small" sx={{ mr: 1 }} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmActionOpen}
        onClose={actionWorking ? undefined : () => setConfirmActionOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{isOwner ? "Delete channel?" : "Leave channel?"}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {isOwner
              ? `Delete “${channel.name}” for everyone? This cannot be undone.`
              : `Leave “${channel.name}”? You will need another invitation to return.`}
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end", mt: 3 }}>
            <Button onClick={() => setConfirmActionOpen(false)} disabled={actionWorking}>
              Cancel
            </Button>
            <Button color="error" variant="contained" onClick={handleLeaveOrDelete} disabled={actionWorking}>
              {actionWorking ? "Working…" : isOwner ? "Delete channel" : "Leave channel"}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <AddMembersModal
        open={addMembersOpen}
        onClose={() => setAddMembersOpen(false)}
        existingMemberIds={channelStore.myChannelMemberIds}
        onSubmit={(userIds) => channelStore.addChannelMembers(channel.id, userIds)}
        isSubmitting={channelStore.isSubmittingMembers}
        submitError={channelStore.membersActionError}
        title="Add to channel"
        subtitle="Search for people to add directly to this channel."
        submitLabel="Add"
      />
    </>
  );
}

export default observer(ChannelSettingsModal);
