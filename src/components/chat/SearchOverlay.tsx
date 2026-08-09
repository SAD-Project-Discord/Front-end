"use client";

import { useEffect, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export interface MessageSearchResultItem {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
}

export interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  showParticipant: boolean;
  onSearch: (query: string) => Promise<MessageSearchResultItem[]>;
  onSelectResult: (result: MessageSearchResultItem) => void;
}

export function SearchOverlay({
  open,
  onClose,
  title,
  placeholder,
  showParticipant,
  onSearch,
  onSelectResult,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessageSearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    // Resetting local UI state in response to the dialog closing — a plain
    // client-side interaction reset, not state derived from render.
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (!trimmed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current;
      onSearch(trimmed)
        .then((items) => {
          if (requestId === requestIdRef.current) setResults(items);
        })
        .finally(() => {
          if (requestId === requestIdRef.current) setLoading(false);
        });
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { height: "70vh" } } }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", p: 2, borderBottom: 1, borderColor: "divider" }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <IconButton onClick={onClose} aria-label="Close search">
          <CloseRoundedIcon />
        </IconButton>
      </Stack>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : results.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5, px: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {query.trim() ? "No messages found" : `Search ${title.toLowerCase()}`}
            </Typography>
          </Box>
        ) : (
          <List>
            {results.map((result) => (
              <ListItemButton key={result.id} onClick={() => onSelectResult(result)} sx={{ alignItems: "flex-start" }}>
                {showParticipant ? (
                  <ListItemAvatar>
                    <Avatar
                      src={result.otherUserAvatarUrl || undefined}
                      slotProps={{ img: { loading: "lazy", decoding: "async" } }}
                      sx={{ width: 32, height: 32, fontSize: 13 }}
                    >
                      {result.otherUserName.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                ) : null}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  {showParticipant ? (
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {result.otherUserName}
                    </Typography>
                  ) : null}
                  <Typography variant="body2" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {result.content}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {new Date(result.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Dialog>
  );
}
