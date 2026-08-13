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
import { Close, SearchRounded, TagRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import channelStore from "@/stores/ChannelStore";
import type { Channel } from "@/types/channel";

export interface DiscoverChannelsDialogProps {
  open: boolean;
  onClose: () => void;
  onJoined: (channel: Channel) => void;
}

// Backed by endpoints that don't exist on the live backend yet — see
// docs/BACKEND_REQUIREMENTS.md (GET /channels/public/, POST /channels/{id}/join).
function DiscoverChannelsDialog({ open, onClose, onJoined }: DiscoverChannelsDialogProps) {
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
    channelStore.searchPublicChannels("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      channelStore.searchPublicChannels(query.trim());
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const myChannelIds = new Set(channelStore.myChannels.map((c) => c.id));

  async function handleJoin(channel: Channel) {
    setJoiningId(channel.id);
    const joined = await channelStore.joinPublicChannel(channel.id);
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
            Discover public channels
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
          placeholder="Search public channels"
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
        {channelStore.publicChannelsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : channelStore.publicChannelsError ? (
          <Typography variant="body2" color="error" sx={{ px: 2, py: 2 }}>
            {channelStore.publicChannelsError}
          </Typography>
        ) : channelStore.publicChannels.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2, textAlign: "center" }}>
            No public channels found.
          </Typography>
        ) : (
          <List disablePadding>
            {channelStore.publicChannels.map((channel) => {
              const alreadyMember = myChannelIds.has(channel.id);
              return (
                <ListItem
                  key={channel.id}
                  secondaryAction={
                    alreadyMember ? (
                      <Typography variant="caption" color="text.secondary">
                        Joined
                      </Typography>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={joiningId === channel.id}
                        onClick={() => handleJoin(channel)}
                      >
                        {joiningId === channel.id ? "Joining…" : "Join"}
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
                      }}
                    >
                      <TagRounded fontSize="small" />
                    </Box>
                  </ListItemAvatar>
                  <ListItemText
                    primary={channel.name}
                    secondary={channel.description || "No description"}
                    slotProps={{ secondary: { noWrap: true } }}
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

export default observer(DiscoverChannelsDialog);
