"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import type { Message, User } from "@/lib/types";
import { AttachmentRenderer } from "./AttachmentRenderer";
import { chatSurfaces } from "@/lib/theme/theme";

export interface MessageBubbleProps {
  message: Message;
  sender: User;
  isOwnMessage: boolean;
  isGroupedWithPrevious?: boolean;
  onEdit?: (message: Message, newContent: string) => void;
  onDelete?: (message: Message) => void;
  onRetry?: (message: Message) => void;
}

export function MessageBubble({
  message,
  sender,
  isOwnMessage,
  isGroupedWithPrevious = false,
  onEdit,
  onDelete,
  onRetry,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const canModify = isOwnMessage && !message.isDeleted && message.deliveryState === "sent";

  function commitEdit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit?.(message, trimmed);
    }
    setIsEditing(false);
  }

  return (
    <Stack
      direction={isOwnMessage ? "row-reverse" : "row"}
      spacing={1.25}
      alignItems="flex-end"
      sx={{ px: { xs: 1.5, sm: 2 }, mt: isGroupedWithPrevious ? 0.25 : 1.5 }}
      className="group/message"
    >
      <Box sx={{ width: 32, flexShrink: 0 }}>
        {!isGroupedWithPrevious ? (
          <Avatar
            src={sender.avatarUrl || undefined}
            alt=""
            slotProps={{ img: { loading: "lazy", decoding: "async" } }}
            sx={{ width: 32, height: 32, bgcolor: chatSurfaces.raised, fontSize: 13 }}
          >
            {sender.displayName.charAt(0).toUpperCase()}
          </Avatar>
        ) : null}
      </Box>

      <Stack sx={{ maxWidth: { xs: "78%", sm: "60%" }, alignItems: isOwnMessage ? "flex-end" : "flex-start" }}>
        {!isGroupedWithPrevious ? (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, px: 0.5, fontWeight: 500 }}>
            {sender.displayName}
          </Typography>
        ) : null}

        <Stack direction={isOwnMessage ? "row-reverse" : "row"} spacing={0.5} alignItems="flex-end">
          <Box
            sx={{
              position: "relative",
              borderRadius: 3,
              px: 1.75,
              py: 1,
              bgcolor: isOwnMessage ? "primary.main" : chatSurfaces.bubbleIncoming,
              color: isOwnMessage ? "primary.contrastText" : "text.primary",
              opacity: message.deliveryState === "sending" ? 0.7 : 1,
              ...(isGroupedWithPrevious
                ? isOwnMessage
                  ? { borderTopRightRadius: 20 }
                  : { borderTopLeftRadius: 20 }
                : isOwnMessage
                  ? { borderBottomRightRadius: 8 }
                  : { borderBottomLeftRadius: 8 }),
            }}
          >
            {message.isDeleted ? (
              <Typography variant="body2" sx={{ fontStyle: "italic", opacity: 0.6 }}>
                This message was deleted
              </Typography>
            ) : isEditing ? (
              <Stack spacing={1} sx={{ minWidth: 200 }}>
                <TextField
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      commitEdit();
                    } else if (e.key === "Escape") {
                      setIsEditing(false);
                      setDraft(message.content);
                    }
                  }}
                  autoFocus
                  multiline
                  size="small"
                  variant="standard"
                  fullWidth
                  slotProps={{ input: { disableUnderline: true, sx: { color: "inherit", fontSize: 14 } } }}
                />
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <IconButton size="small" onClick={() => setIsEditing(false)} sx={{ color: "inherit" }}>
                    <CloseRoundedIcon fontSize="inherit" />
                  </IconButton>
                  <IconButton size="small" onClick={commitEdit} sx={{ color: "inherit" }}>
                    <CheckRoundedIcon fontSize="inherit" />
                  </IconButton>
                </Stack>
              </Stack>
            ) : (
              <>
                {message.content ? (
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {message.content}
                  </Typography>
                ) : null}
                {message.attachments.length > 0 ? (
                  <Stack spacing={1} sx={{ mt: message.content ? 1 : 0 }}>
                    {message.attachments.map((attachment) => (
                      <AttachmentRenderer key={attachment.id} attachment={attachment} />
                    ))}
                  </Stack>
                ) : null}
              </>
            )}
          </Box>

          {canModify && !isEditing ? (
            <Stack
              direction={isOwnMessage ? "row-reverse" : "row"}
              sx={{ opacity: 0, transition: "opacity 120ms", ".group\\/message:hover &": { opacity: 1 } }}
            >
              {onEdit ? (
                <IconButton size="small" onClick={() => setIsEditing(true)} aria-label="Edit message">
                  <EditRoundedIcon fontSize="inherit" />
                </IconButton>
              ) : null}
              {onDelete ? (
                <IconButton size="small" onClick={() => setConfirmingDelete(true)} aria-label="Delete message">
                  <DeleteRoundedIcon fontSize="inherit" />
                </IconButton>
              ) : null}
            </Stack>
          ) : null}
        </Stack>

        <Stack direction={isOwnMessage ? "row-reverse" : "row"} spacing={0.5} alignItems="center" sx={{ mt: 0.5, px: 0.5 }}>
          <Typography variant="caption" color="text.disabled">
            {formatTime(message.createdAt)}
          </Typography>
          {message.isEdited ? (
            <Typography variant="caption" color="text.disabled">
              (edited)
            </Typography>
          ) : null}
          {message.deliveryState === "sending" ? <CircularProgress size={10} /> : null}
          {message.deliveryState === "failed" ? (
            <Tooltip title="Failed to send — click to retry">
              <IconButton size="small" onClick={() => onRetry?.(message)} sx={{ p: 0.25, color: "error.main" }}>
                <ErrorOutlineRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>

      <Dialog open={confirmingDelete} onClose={() => setConfirmingDelete(false)}>
        <DialogTitle>Delete this message?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmingDelete(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              onDelete?.(message);
              setConfirmingDelete(false);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
