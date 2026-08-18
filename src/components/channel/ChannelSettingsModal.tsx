"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent, type SyntheticEvent } from "react";
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
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AdminPanelSettingsRounded,
  CloseRounded,
  DeleteOutlineRounded,
  PersonAddAltRounded,
  PersonRemoveRounded,
  SaveRounded,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import AddMembersModal from "@/components/members/AddMembersModal";
import type { PublicUserProfile } from "@/types/user";
import { InviteLinkSection } from "@/components/members/InviteLinkSection";
import ChannelRolesPanel from "@/components/channel/ChannelRolesPanel";
import MemberRolesPopover from "@/components/channel/MemberRolesPopover";
import channelStore from "@/stores/ChannelStore";
import { openUserProfile } from "@/lib/profileNav";
import { hasChannelPermission } from "@/lib/permissions/channelPermissions";
import type { Channel, ChannelMember, UpdateChannelRequest } from "@/types/channel";

interface ChannelSettingsModalProps {
  open: boolean;
  onClose: () => void;
  channel: Channel;
  currentUserId: string;
  onLeftOrDeleted: () => void;
}

type SettingsTab = "general" | "members" | "roles";

/** Fixed height for tab panel bodies so switching tabs doesn't jump the dialog around. */
const PANEL_HEIGHT = 480;

function ChannelSettingsModal({
  open,
  onClose,
  channel,
  currentUserId,
  onLeftOrDeleted,
}: ChannelSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [wasOpen, setWasOpen] = useState(false);
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description);
  const [isPrivate, setIsPrivate] = useState(channel.is_private);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [confirmActionOpen, setConfirmActionOpen] = useState(false);
  const [actionWorking, setActionWorking] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<ChannelMember | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [rolesMemberAnchor, setRolesMemberAnchor] = useState<{
    element: HTMLElement;
    userId: string;
  } | null>(null);
  const rolesMember: ChannelMember | undefined = rolesMemberAnchor
    ? channelStore.channelMembers.find((m) => m.user_id === rolesMemberAnchor.userId)
    : undefined;

  const isOwner = channel.creator_id === currentUserId;
  const currentMember = channelStore.channelMembers.find((m) => m.user_id === currentUserId);
  const canManageChannel = hasChannelPermission(currentMember, isOwner, "manage_channel");
  const canManageChannelMembers = hasChannelPermission(currentMember, isOwner, "manage_channel_members");
  const canManageRoles = hasChannelPermission(currentMember, isOwner, "manage_roles");
  const canManageInvitations = hasChannelPermission(currentMember, isOwner, "manage_invitations");
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

  if (open && !wasOpen) {
    setActiveTab("general");
  }
  if (open !== wasOpen) {
    setWasOpen(open);
  }

  useEffect(() => {
    if (!open) return;
    channelStore.setChannelsError(null);
    channelStore.clearChannelSettingsError();
    channelStore.clearChannelMemberActionError();
    channelStore.clearRoleActionError();
    channelStore.clearInviteLink();
    channelStore.loadChannelMembers(channel.id);
    channelStore.loadChannelRoles(channel.id);
  }, [open, channel.id]);

  function resetForm() {
    setName(channel.name);
    setDescription(channel.description);
    setIsPrivate(channel.is_private);
    setFormError(null);
    setSaved(false);
  }

  function handleFieldChange(setter: (value: string) => void) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
      setSaved(false);
      if (formError) setFormError(null);
      channelStore.clearChannelSettingsError();
    };
  }

  function handleClose() {
    if (isWorking) return;
    resetForm();
    setAddMembersOpen(false);
    setConfirmActionOpen(false);
    setRolesMemberAnchor(null);
    setRemoveMemberTarget(null);
    onClose();
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedName) {
      setFormError("Channel name is required.");
      return;
    }
    setFormError(null);

    const payload: UpdateChannelRequest = {};
    if (trimmedName !== channel.name) payload.name = trimmedName;
    if (trimmedDescription !== channel.description) payload.description = trimmedDescription;
    if (isPrivate !== channel.is_private) payload.is_private = isPrivate;

    if (Object.keys(payload).length === 0) return;

    const updated = await channelStore.updateChannelInfo(channel.id, payload);
    if (updated) {
      setName(updated.name);
      setDescription(updated.description);
      setIsPrivate(updated.is_private);
      setSaved(true);
    }
  }

  async function handleConfirmRemoveMember() {
    if (!removeMemberTarget) return;
    setIsRemovingMember(true);
    await channelStore.removeChannelMember(channel.id, removeMemberTarget.user_id);
    setIsRemovingMember(false);
    setRemoveMemberTarget(null);
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

  function handleTabChange(_event: SyntheticEvent, value: SettingsTab) {
    setActiveTab(value);
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={isWorking ? undefined : handleClose}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
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

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ px: 3, borderBottom: 1, borderColor: "divider", minHeight: 40 }}
        >
          <Tab label="General" value="general" sx={{ minHeight: 40 }} />
          <Tab label={`Members (${channelStore.channelMembers.length})`} value="members" sx={{ minHeight: 40 }} />
          <Tab label={`Roles (${channelStore.channelRoles.length})`} value="roles" sx={{ minHeight: 40 }} />
        </Tabs>

        <DialogContent sx={{ p: 0 }}>
          {channelStore.channelsError ? (
            <Alert severity="error" sx={{ m: 3, mb: 0 }}>
              {channelStore.channelsError}
            </Alert>
          ) : null}

          {activeTab === "general" ? (
            <Box sx={{ p: 3, maxHeight: PANEL_HEIGHT, overflowY: "auto" }}>
              <Stack spacing={3}>
                <Box component="form" onSubmit={handleSave} noValidate>
                  <Stack spacing={2} sx={{ pt: 0.5 }}>
                    <TextField
                      label="Channel name"
                      value={name}
                      onChange={handleFieldChange(setName)}
                      required
                      fullWidth
                      disabled={isWorking}
                      slotProps={{
                        input: { readOnly: !canManageChannel },
                        htmlInput: { maxLength: 100 },
                      }}
                    />
                    <TextField
                      label="Description"
                      value={description}
                      onChange={handleFieldChange(setDescription)}
                      fullWidth
                      multiline
                      minRows={3}
                      maxRows={6}
                      disabled={isWorking}
                      slotProps={{ input: { readOnly: !canManageChannel } }}
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
                          disabled={!canManageChannel || isWorking}
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
                      {canManageChannel ? (
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

                {canManageInvitations ? (
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

                <Divider />
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between" }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {isOwner ? "Delete channel" : "Leave channel"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isOwner
                        ? "Removes it for everyone and cannot be undone."
                        : "You will need another invitation to rejoin."}
                    </Typography>
                  </Box>
                  <Button
                    color="error"
                    variant="outlined"
                    size="small"
                    startIcon={<DeleteOutlineRounded fontSize="small" />}
                    onClick={() => setConfirmActionOpen(true)}
                    disabled={isWorking}
                    sx={{ flexShrink: 0 }}
                  >
                    {isOwner ? "Delete channel" : "Leave channel"}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          ) : null}

          {activeTab === "members" ? (
            <Box sx={{ p: 3, height: PANEL_HEIGHT, display: "flex", flexDirection: "column" }}>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle1">
                  Members ({channelStore.channelMembers.length})
                </Typography>
                {canManageChannelMembers ? (
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

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
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
                        sx={{
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          gap: 1,
                          pr: 2,
                        }}
                      >
                        <Box
                          onClick={() => openUserProfile(member.user_id)}
                          sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, cursor: "pointer" }}
                        >
                          <ListItemAvatar>
                            <Avatar>{member.name.trim().charAt(0).toUpperCase() || "?"}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={member.name}
                            secondary={
                              member.custom_roles.length > 0
                                ? `@${member.username} · ${member.custom_roles.map((r) => r.name).join(", ")}`
                                : `@${member.username}`
                            }
                          />
                        </Box>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexShrink: 0 }}>
                          <Chip
                            label={
                              member.role === "owner" ? "Owner" : member.role === "admin" ? "Admin" : "Member"
                            }
                            size="small"
                          />
                          {canManageRoles && member.user_id !== currentUserId ? (
                            <Tooltip title={`Edit roles for ${member.name}`}>
                              <IconButton
                                size="small"
                                disabled={isWorking}
                                onClick={(event) =>
                                  setRolesMemberAnchor({ element: event.currentTarget, userId: member.user_id })
                                }
                                aria-label={`Edit roles for ${member.name}`}
                              >
                                <AdminPanelSettingsRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                          {canManageChannelMembers && member.user_id !== currentUserId ? (
                            <Tooltip title={`Remove ${member.name}`}>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={isWorking}
                                onClick={() => setRemoveMemberTarget(member)}
                                aria-label={`Remove ${member.name}`}
                              >
                                <PersonRemoveRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                        </Stack>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Box>
          ) : null}

          {activeTab === "roles" ? (
            <Box sx={{ p: 3, maxHeight: PANEL_HEIGHT, overflowY: "auto" }}>
              <ChannelRolesPanel channelId={channel.id} canManageRoles={canManageRoles} />
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>

      {rolesMemberAnchor && rolesMember ? (
        <MemberRolesPopover
          channelId={channel.id}
          member={rolesMember}
          anchorEl={rolesMemberAnchor.element}
          onClose={() => setRolesMemberAnchor(null)}
        />
      ) : null}

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

      <Dialog
        open={Boolean(removeMemberTarget)}
        onClose={isRemovingMember ? undefined : () => setRemoveMemberTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Remove member?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Remove {removeMemberTarget?.name ?? "this member"} from “{channel.name}”?
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end", mt: 3 }}>
            <Button onClick={() => setRemoveMemberTarget(null)} disabled={isRemovingMember}>
              Cancel
            </Button>
            <Button color="error" variant="contained" onClick={handleConfirmRemoveMember} disabled={isRemovingMember}>
              {isRemovingMember ? "Removing…" : "Remove member"}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <AddMembersModal
        open={addMembersOpen}
        onClose={() => setAddMembersOpen(false)}
        existingMemberIds={channelStore.myChannelMemberIds}
        onSubmit={async (users: PublicUserProfile[]) => {
          const ids = users.map((u) => u.id);
          await channelStore.addChannelMembers(channel.id, ids);
          return true;
        }}
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
