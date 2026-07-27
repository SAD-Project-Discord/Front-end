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
import { Add, PersonAdd } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import CreateGroupModal from "@/components/group/CreateGroupModal";
import AddMembersModal from "@/components/members/AddMembersModal";
import groupStore from "@/stores/GroupStore";
import type { Group } from "@/types/group";

type MemberAction = "add" | "invite";

function GroupsPlaceholderPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [action, setAction] = useState<MemberAction>("add");
  const [lastCreated, setLastCreated] = useState<Group | null>(null);

  const openInvite = () => {
    if (!lastCreated) return;
    groupStore.loadMembers(lastCreated.id);
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
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<Add />}
          onClick={() => setCreateOpen(true)}
        >
          New Group
        </Button>

        {lastCreated ? (
          <>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Created: {lastCreated.name} ({lastCreated.id})
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

            <Button
              variant="outlined"
              color="primary"
              size="large"
              startIcon={<PersonAdd />}
              onClick={openInvite}
            >
              {action === "add" ? "Add members" : "Invite members"}
            </Button>
          </>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Create a group first to test adding / inviting members.
          </Typography>
        )}
      </Stack>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(group) => setLastCreated(group)}
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
