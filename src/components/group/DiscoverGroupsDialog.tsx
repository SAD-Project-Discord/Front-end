"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Close, SearchRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import groupStore from "@/stores/GroupStore";
import type { GroupInfo } from "@/types/group";

export interface DiscoverGroupsDialogProps {
  open: boolean;
  onClose: () => void;
  onJoined: (group: GroupInfo) => void;
}

// Backed by endpoints that don't exist on the live backend yet — see
// docs/BACKEND_REQUIREMENTS.md (GET /groups/public/, POST /groups/{id}/join).
function DiscoverGroupsDialog({ open, onClose, onJoined }: DiscoverGroupsDialogProps) {
  const [query, setQuery] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Resetting local UI state in response to the dialog closing — a plain
    // client-side interaction reset, not state derived from render.
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      return;
    }
    groupStore.searchPublicGroups("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      groupStore.searchPublicGroups(query.trim());
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const myGroupIds = new Set(groupStore.myGroups.map((g) => g.id));

  async function handleJoin(group: GroupInfo) {
    setJoiningId(group.id);
    const joined = await groupStore.joinPublicGroup(group.id);
    setJoiningId(null);
    if (joined) {
      onClose();
      onJoined(joined);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 3, height: "70vh" } } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h1" component="h2" sx={{ fontSize: "1.4rem" }}>
            Discover public groups
          </Typography>
          <IconButton aria-label="Close" onClick={onClose} edge="end" size="small">
            <Close fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search public groups"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 1 }}>
        {groupStore.publicGroupsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : groupStore.publicGroupsError ? (
          <Typography variant="body2" color="error" sx={{ px: 2, py: 2 }}>
            {groupStore.publicGroupsError}
          </Typography>
        ) : groupStore.publicGroups.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2, textAlign: "center" }}>
            No public groups found.
          </Typography>
        ) : (
          <List disablePadding>
            {groupStore.publicGroups.map((group) => {
              const alreadyMember = myGroupIds.has(group.id);
              return (
                <ListItem
                  key={group.id}
                  secondaryAction={
                    alreadyMember ? (
                      <Typography variant="caption" color="text.secondary">
                        Joined
                      </Typography>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={joiningId === group.id}
                        onClick={() => handleJoin(group)}
                      >
                        {joiningId === group.id ? "Joining…" : "Join"}
                      </Button>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        bgcolor: "action.hover",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                      }}
                    >
                      {group.name.charAt(0).toUpperCase()}
                    </Box>
                  </ListItemAvatar>
                  <ListItemText
                    primary={group.name}
                    secondary={`${group.member_count} member${group.member_count === 1 ? "" : "s"}`}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>
    </Dialog>
  );
}

export default observer(DiscoverGroupsDialog);
