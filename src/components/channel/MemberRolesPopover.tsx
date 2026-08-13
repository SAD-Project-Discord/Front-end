"use client";

import { useState } from "react";
import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Popover,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import channelStore from "@/stores/ChannelStore";
import type { ChannelMember, ChannelRole } from "@/types/channel";

interface MemberRolesPopoverProps {
  channelId: string;
  member: ChannelMember;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

function MemberRolesPopover({ channelId, member, anchorEl, onClose }: MemberRolesPopoverProps) {
  const [working, setWorking] = useState(false);

  async function handleBaseRoleChange(role: ChannelRole) {
    setWorking(true);
    await channelStore.updateMemberRole(channelId, member.user_id, role);
    setWorking(false);
  }

  async function handleToggleCustomRole(roleId: string, assigned: boolean) {
    setWorking(true);
    if (assigned) {
      await channelStore.removeRoleFromMember(channelId, member.user_id, roleId);
    } else {
      await channelStore.assignRoleToMember(channelId, member.user_id, roleId);
    }
    setWorking(false);
  }

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Box sx={{ p: 2, width: 260 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Roles for {member.name}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Base role
        </Typography>
        <Select
          size="small"
          fullWidth
          value={member.role === "owner" ? "member" : member.role}
          disabled={working}
          onChange={(e) => handleBaseRoleChange(e.target.value as ChannelRole)}
          sx={{ mt: 0.5, mb: 1.5 }}
        >
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="member">Member</MenuItem>
        </Select>

        <Divider sx={{ mb: 1 }} />

        <Typography variant="caption" color="text.secondary">
          Custom roles
        </Typography>
        <Stack sx={{ mt: 0.5 }}>
          {channelStore.channelRoles.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              No custom roles yet.
            </Typography>
          ) : (
            channelStore.channelRoles.map((role) => {
              const assigned = member.custom_roles.some((r) => r.id === role.id);
              return (
                <FormControlLabel
                  key={role.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={assigned}
                      disabled={working}
                      onChange={() => handleToggleCustomRole(role.id, assigned)}
                    />
                  }
                  label={<Typography variant="body2">{role.name}</Typography>}
                />
              );
            })
          )}
        </Stack>
      </Box>
    </Popover>
  );
}

export default observer(MemberRolesPopover);
