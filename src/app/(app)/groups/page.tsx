"use client";

/**
 * TEMPORARY placeholder page — exists only to open and test CreateGroupModal.
 * Replace this whole file with the real groups/dashboard screen once it lands.
 */

import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import CreateGroupModal from "@/components/group/CreateGroupModal";
import type { Group } from "@/types/group";

export default function GroupsPlaceholderPage() {
  const [open, setOpen] = useState(false);
  const [lastCreated, setLastCreated] = useState<Group | null>(null);

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
          onClick={() => setOpen(true)}
        >
          New Group
        </Button>

        {lastCreated ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Created: {lastCreated.name} ({lastCreated.id})
          </Typography>
        ) : null}
      </Stack>

      <CreateGroupModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(group) => setLastCreated(group)}
      />
    </Box>
  );
}
