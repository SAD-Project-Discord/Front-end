"use client";

/**
 * TEMPORARY placeholder page — exists only to open and test CreateGroupModal and
 * AddMembersModal. Replace this whole file with the real groups/dashboard screen
 * once it lands. The Add/Invite toggle below is throwaway test scaffolding that
 * demonstrates the modal's configurable action.
 */

import { useState } from "react";
import {
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Add, PersonAdd, Public } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import CreateGroupModal from "@/components/group/CreateGroupModal";
import GroupSettingsModal from "@/components/group/GroupSettingsModal";
import CreateChannelModal from "@/components/channel/CreateChannelModal";
import AddMembersModal from "@/components/members/AddMembersModal";
import groupStore from "@/stores/GroupStore";
import type { Group } from "@/types/group";
import type { Channel } from "@/types/channel";

type MemberAction = "add" | "invite";

function GroupsPlaceholderPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [action, setAction] = useState<MemberAction>("add");
  const [lastCreated, setLastCreated] = useState<Group | null>(null);
  const [lastCreatedChannel, setLastCreatedChannel] = useState<Channel | null>(null);

  const openInvite = () => {
    if (!lastCreated) return;
    groupStore.loadGroup(lastCreated.id);
    setInviteOpen(true);
  };

  const handleSubmitMembers = (userIds: string[]) => {
    if (!lastCreated) return Promise.resolve(false);
    return action === "add"
      ? groupStore.addMembers(lastCreated.id, userIds)
      : groupStore.inviteMembers(lastCreated.id, userIds);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: "100%", justifyContent: "center" }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<Add />}
            onClick={() => setCreateOpen(true)}
          >
            New Group
          </Button>

          <Button
            variant="contained"
            color="secondary"
            size="large"
            startIcon={<Public />}
            onClick={() => setCreateChannelOpen(true)}
          >
            New Channel
          </Button>
        </Stack>

        {lastCreated ? (
          <>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Created group: {lastCreated.name} ({lastCreated.id})
            </Typography>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={action}
              onChange={(_event, next: MemberAction | null) => {
                if (next) setAction(next);
              }}
            >
              <ToggleButton value="add">Add directly</ToggleButton>
              <ToggleButton value="invite">Send invite</ToggleButton>
            </ToggleButtonGroup>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: "100%", justifyContent: "center" }}>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                startIcon={<PersonAdd />}
                onClick={openInvite}
              >
                {action === "add" ? "Add members" : "Invite members"}
              </Button>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => setSettingsOpen(true)}
              >
                View Settings
              </Button>
            </Stack>
          </>
        ) : lastCreatedChannel ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Created channel: {lastCreatedChannel.name} ({lastCreatedChannel.id})
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Create a group or channel first to test the modal.
          </Typography>
        )}
      </Stack>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(group) => setLastCreated(group)}
      />

      <CreateChannelModal
        open={createChannelOpen}
        onClose={() => setCreateChannelOpen(false)}
        onCreated={(channel) => setLastCreatedChannel(channel)}
      />

      <GroupSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        groupId={lastCreated?.id ?? ""}
        onUpdated={(group) => setLastCreated(group)}
        onDeleted={() => setLastCreated(null)}
      />

      {lastCreated ? (
        <AddMembersModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          existingMemberIds={groupStore.memberUserIds}
          onSubmit={handleSubmitMembers}
          isSubmitting={groupStore.isSubmittingMembers}
          submitError={groupStore.membersActionError}
          title={action === "add" ? "Add Members" : "Invite Members"}
          submitLabel={action === "add" ? "Add" : "Invite"}
        />
      ) : null}
    </Box>
  );
}

export default observer(GroupsPlaceholderPage);
