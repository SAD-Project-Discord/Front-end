"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { AddRounded, DeleteOutlineRounded, EditRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import channelStore from "@/stores/ChannelStore";
import type { ChannelAccessRole, ChannelPermission } from "@/types/channel";

interface ChannelRolesPanelProps {
  channelId: string;
  isOwner: boolean;
}

const PERMISSION_LABELS: Record<ChannelPermission, string> = {
  manage_group: "Manage group",
  manage_members: "Manage members",
  manage_roles: "Manage roles",
  manage_invitations: "Manage invitations",
  manage_channel: "Manage channel",
  manage_topics: "Manage threads",
  manage_channel_members: "Manage channel members",
  send_messages: "Send messages",
  edit_messages: "Edit messages",
  delete_messages: "Delete messages",
};

const CHANNEL_PERMISSIONS: ChannelPermission[] = [
  "manage_channel",
  "manage_channel_members",
  "manage_roles",
  "manage_topics",
  "manage_invitations",
  "send_messages",
  "edit_messages",
  "delete_messages",
];

interface RoleFormValues {
  name: string;
  permissions: Set<ChannelPermission>;
}

const emptyForm: RoleFormValues = { name: "", permissions: new Set() };

function ChannelRolesPanel({ channelId, isOwner }: ChannelRolesPanelProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [form, setForm] = useState<RoleFormValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    channelStore.loadChannelRoles(channelId);
  }, [channelId]);

  function startCreate() {
    setEditingRoleId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  }

  function startEdit(role: ChannelAccessRole) {
    setEditingRoleId(role.id);
    setForm({ name: role.name, permissions: new Set(role.permissions) });
    setFormError(null);
    setFormOpen(true);
  }

  function cancelForm() {
    setFormOpen(false);
    setEditingRoleId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function togglePermission(permission: ChannelPermission) {
    setForm((prev) => {
      const next = new Set(prev.permissions);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return { ...prev, permissions: next };
    });
  }

  async function handleSave() {
    const name = form.name.trim();
    if (!name) {
      setFormError("Role name is required.");
      return;
    }

    const payload = { name, permissions: Array.from(form.permissions) };
    const result = editingRoleId
      ? await channelStore.updateChannelRole(channelId, editingRoleId, payload)
      : await channelStore.createChannelRole(channelId, payload);

    if (result) {
      cancelForm();
    } else {
      setFormError(channelStore.roleActionError ?? "Could not save role.");
    }
  }

  async function handleDelete(roleId: string) {
    await channelStore.deleteChannelRole(channelId, roleId);
  }

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle1">Custom roles ({channelStore.channelRoles.length})</Typography>
        {isOwner && !formOpen ? (
          <Tooltip title="Create role">
            <IconButton size="small" onClick={startCreate} aria-label="Create role">
              <AddRounded />
            </IconButton>
          </Tooltip>
        ) : null}
      </Stack>

      {!isOwner ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Only the channel owner can manage roles.
        </Typography>
      ) : null}

      {channelStore.channelRolesError ? (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {channelStore.channelRolesError}
        </Alert>
      ) : null}

      {formOpen ? (
        <Box sx={{ p: 2, mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Stack spacing={1.5}>
            <TextField
              label="Role name"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                setFormError(null);
              }}
              autoFocus
              fullWidth
              required
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />

            <Typography variant="caption" color="text.secondary">
              Permissions
            </Typography>
            <FormGroup sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              {CHANNEL_PERMISSIONS.map((permission) => (
                <FormControlLabel
                  key={permission}
                  control={
                    <Checkbox
                      size="small"
                      checked={form.permissions.has(permission)}
                      onChange={() => togglePermission(permission)}
                    />
                  }
                  label={<Typography variant="body2">{PERMISSION_LABELS[permission]}</Typography>}
                />
              ))}
            </FormGroup>

            {formError ? <Alert severity="error">{formError}</Alert> : null}

            <Stack direction="row" spacing={1.5}>
              <Button color="inherit" onClick={cancelForm} disabled={channelStore.isSavingRole}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={channelStore.isSavingRole}>
                {channelStore.isSavingRole ? "Saving…" : editingRoleId ? "Save role" : "Create role"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}

      <Box sx={{ maxHeight: 320, overflowY: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        {channelStore.channelRolesLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={26} />
          </Box>
        ) : channelStore.channelRoles.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
            No custom roles yet.
          </Typography>
        ) : (
          <Stack divider={<Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />}>
            {channelStore.channelRoles.map((role) => (
              <Box key={role.id} sx={{ p: 1.5, display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {role.name}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                    {role.permissions.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        No permissions
                      </Typography>
                    ) : (
                      role.permissions.map((p) => (
                        <Chip key={p} label={PERMISSION_LABELS[p] ?? p} size="small" variant="outlined" />
                      ))
                    )}
                  </Stack>
                </Box>
                {isOwner ? (
                  <Stack direction="row">
                    <Tooltip title="Edit role">
                      <IconButton size="small" onClick={() => startEdit(role)} aria-label={`Edit ${role.name}`}>
                        <EditRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete role">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(role.id)}
                        aria-label={`Delete ${role.name}`}
                      >
                        <DeleteOutlineRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ) : null}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export default observer(ChannelRolesPanel);
