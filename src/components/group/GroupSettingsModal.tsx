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
  ListItemText,
  Stack,
  Typography,
  Tooltip,
} from "@mui/material";
import {
  Close,
  Delete,
  Groups,
  PersonAdd,
  Shield,
  Subject,
  ArrowForward,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import IconTextField from "@/components/auth/IconTextField";
import AddMembersModal from "@/components/members/AddMembersModal";
import groupStore from "@/stores/GroupStore";
import authStore from "@/stores/AuthStore";
import userService from "@/services/user.service";
import { runInAction } from "mobx";
import type { Group, GroupMember, UpdateGroupRequest, GroupRole } from "@/types/group";

interface GroupSettingsModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  onUpdated?: (group: Group) => void;
  onDeleted?: () => void;
}

interface GroupFormValues {
  name: string;
  description: string;
}

const initialValues: GroupFormValues = {
  name: "",
  description: "",
};

function getInitials(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

function GroupSettingsModal({ open, onClose, groupId, onUpdated, onDeleted }: GroupSettingsModalProps) {
  const [values, setValues] = useState<GroupFormValues>(initialValues);
  const [formError, setFormError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const group = groupStore.currentGroup;
  const members = group?.members ?? [];
  const isAdmin =
    group?.my_role === "admin" ||
    group?.my_role === "owner" ||
    group?.creator_id === authStore.user?.id ||
    members.some((m) => m.user?.id === authStore.user?.id && (m.role === "admin" || m.role === "owner"));
  const isLoading = groupStore.isGroupLoading;
  const isWorking = isLoading || groupStore.isSavingGroup || groupStore.isDeletingGroup || groupStore.isSubmittingMembers;
  const hasMembers = members.length > 0;

  useEffect(() => {
    if (open && groupId) {
      groupStore.loadGroup(groupId);
    }
  }, [open, groupId]);

  // Ensure we have the current user's profile when opening the modal
  useEffect(() => {
    if (open && authStore.isAuthenticated && !authStore.user) {
      (async () => {
        try {
          const profile = await userService.getMyProfile();
          runInAction(() => {
            authStore.user = profile;
          });
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [open]);

  useEffect(() => {
    if (open && group) {
      setValues({
        name: group.name ?? "",
        description: group.description ?? "",
      });
      setFormError(null);
    }
  }, [open, group]);

  const handleChange = (field: keyof GroupFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
    if (formError) {
      setFormError(null);
    }
  };

  const validateForm = () => {
    const trimmedName = values.name.trim();
    if (!trimmedName) {
      return "Group name is required.";
    }
    if (trimmedName.length < 2) {
      return "Group name must be at least 2 characters long.";
    }
    return null;
  };

  const handleSave = async () => {
    if (!group) return;

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    // Always send all fields: backend expects full payload for PATCH
    const payload: UpdateGroupRequest = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
    };

    const updated = await groupStore.updateGroup(group.id, payload);
    if (updated) {
      onUpdated?.(updated);
    }
  };

  const handleToggleRole = async (member: GroupMember) => {
    if (!group) return;

    const nextRole: GroupRole = member.role === "admin" ? "member" : "admin";
    await groupStore.updateGroupMemberRole(group.id, member.user.id, nextRole);
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (!group) return;
    const confirmed = window.confirm(`Remove ${member.user.name} from the group?`);
    if (!confirmed) return;

    await groupStore.removeGroupMember(group.id, member.user.id);
  };

  const handleDeleteGroup = async () => {
    if (!group) return;

    setIsDeleting(true);
    const deleted = await groupStore.deleteGroup(group.id);
    setIsDeleting(false);

    if (deleted) {
      setDeleteConfirmOpen(false);
      onDeleted?.();
      onClose();
    }
  };

  const handleAddMembers = async (userIds: string[]) => {
    if (!group) return false;
    return groupStore.addMembers(group.id, userIds);
  };

  const handleClose = () => {
    if (isWorking) return;
    setFormError(null);
    setInviteOpen(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={isWorking ? undefined : handleClose}
      fullWidth
      maxWidth="md"
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
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h1" component="h2" sx={{ fontSize: "1.4rem" }}>
              Group Settings
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Manage group information and members.
            </Typography>
          </Box>
          <IconButton aria-label="Close" onClick={handleClose} disabled={isWorking} edge="end" size="small">
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {groupStore.groupError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {groupStore.groupError}
          </Alert>
        ) : null}

        {isLoading && !group ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : null}

        {group ? (
          <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "360px 1fr" } }}>
            <Box>
              <Box component="form" noValidate>
                <IconTextField
                  label="Group Name"
                  icon={Groups}
                  placeholder="Project Team"
                  value={values.name}
                  onChange={handleChange("name")}
                  autoFocus
                  required
                  disabled={!isAdmin || isWorking}
                />

                <IconTextField
                  label="Description"
                  icon={Subject}
                  placeholder="What is this group about?"
                  value={values.description}
                  onChange={handleChange("description")}
                  multiline
                  minRows={3}
                  disabled={!isAdmin || isWorking}
                />


                {(formError || groupStore.groupSaveError) ? (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {formError ?? groupStore.groupSaveError}
                  </Alert>
                ) : null}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    color="inherit"
                    size="large"
                    fullWidth
                    onClick={handleClose}
                    disabled={isWorking}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    disabled={!isAdmin || isWorking}
                    onClick={handleSave}
                    endIcon={<ArrowForward fontSize="small" />}
                  >
                    {groupStore.isSavingGroup ? "Saving..." : "Save Changes"}
                  </Button>
                </Stack>

                {isAdmin ? (
                  <Box sx={{ mt: 3, p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                      <Shield fontSize="small" /> Danger zone
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                      Delete the group if you no longer need it. This action cannot be undone.
                    </Typography>
                    <Button
                      type="button"
                      variant="contained"
                      color="error"
                      fullWidth
                      size="large"
                      onClick={() => setDeleteConfirmOpen(true)}
                      disabled={isWorking}
                    >
                      {groupStore.isDeletingGroup ? "Deleting..." : "Delete Group"}
                    </Button>
                    {groupStore.groupDeleteError ? (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {groupStore.groupDeleteError}
                      </Alert>
                    ) : null}
                  </Box>
                ) : null}
              </Box>
            </Box>

            <Box>
              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="subtitle1">
                      Members ({group.member_count})
                    </Typography>
                    {isAdmin ? (
                      <Tooltip title="Add members">
                        <IconButton
                          size="small"
                          onClick={() => setInviteOpen(true)}
                          disabled={isWorking}
                          aria-label="Add members"
                        >
                          <PersonAdd fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Box>

                  <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                    {isLoading ? (
                      <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                        <CircularProgress size={28} />
                      </Box>
                    ) : !hasMembers ? (
                      <Box sx={{ p: 3, textAlign: "center" }}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          No members found yet.
                        </Typography>
                      </Box>
                    ) : (
                      <List disablePadding>
                        {members.map((member, index) => {
                          const user = member.user;
                          const isSelf = user?.id === authStore.user?.id;
                          const canModify = isAdmin && !!user && !isSelf;
                          const isMemberAdmin = member.role === "admin";
                          const displayName = user?.name || user?.username || "Unknown member";
                          const displayUsername = user?.username ? `@${user.username}` : "@unknown";

                          return (
                            <ListItem key={member.id ?? user?.id ?? `member-${index}`} sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                              <ListItemAvatar>
                                <Avatar src={user?.avatar_url || undefined}>
                                  {getInitials(displayName)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={displayName}
                                secondary={displayUsername}
                              />
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 2 }}>
                                {/* Promote/Demote button intentionally removed for now */}
                                {canModify ? (
                                  <Tooltip title="Remove member">
                                    <IconButton
                                      edge="end"
                                      size="small"
                                      color="error"
                                      onClick={() => handleRemoveMember(member)}
                                      disabled={isWorking}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                ) : null}
                                <Chip
                                  label={member.role === "admin" ? "Admin" : member.role === "owner" ? "Owner" : "Member"}
                                  size="small"
                                  color={member.role === "admin" ? "primary" : "default"}
                                />
                              </Box>
                            </ListItem>
                          );
                        })}
                      </List>
                    )}
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !isDeleting && setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete group?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Delete this group? This cannot be undone.
          </Typography>
        </DialogContent>
        <Stack direction="row" spacing={1.5} sx={{ px: 3, pb: 2, justifyContent: "flex-end" }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteGroup} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete group"}
          </Button>
        </Stack>
      </Dialog>

      <AddMembersModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        existingMemberIds={groupStore.memberUserIds}
        onSubmit={handleAddMembers}
        title="Add Members"
        submitLabel="Add"
        isSubmitting={groupStore.isSubmittingMembers}
        submitError={groupStore.membersActionError}
      />
    </Dialog>
  );
}

export default observer(GroupSettingsModal);
