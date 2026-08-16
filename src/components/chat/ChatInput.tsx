"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Popover from "@mui/material/Popover";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import EmojiEmotionsRoundedIcon from "@mui/icons-material/EmojiEmotionsRounded";
import StickyNote2RoundedIcon from "@mui/icons-material/StickyNote2Rounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import ScheduleSendRoundedIcon from "@mui/icons-material/ScheduleSendRounded";
import { storageApi } from "@/lib/api/storage";
import { ApiError } from "@/lib/api/api";
import type { MessageAttachment } from "@/lib/types";
import { EmojiPicker } from "./EmojiPicker";
import { StickerPicker } from "./StickerPicker";

/** Local-time value a `datetime-local` input needs, e.g. "2026-08-10T14:05". */
function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface PendingAttachment {
  localId: string;
  file: File;
  status: "uploading" | "done" | "error";
  attachment?: MessageAttachment;
  errorMessage?: string;
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string, attachments: MessageAttachment[]) => void;
  onSchedule?: (content: string, attachments: MessageAttachment[], scheduledAt: Date) => void;
  onTyping?: () => void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
  /** Whether this member may attach files/stickers in this conversation (channels only; defaults to allowed). */
  canUploadMedia?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onSchedule,
  onTyping,
  disabled = false,
  isSending = false,
  placeholder = "Message…",
  canUploadMedia = true,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const [stickerAnchor, setStickerAnchor] = useState<HTMLElement | null>(null);
  const [scheduleAnchor, setScheduleAnchor] = useState<HTMLElement | null>(null);
  const [scheduleValue, setScheduleValue] = useState("");
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [stickerError, setStickerError] = useState<string | null>(null);

  const isUploading = pending.some((p) => p.status === "uploading");
  const readyAttachments = pending.filter((p) => p.status === "done" && p.attachment).map((p) => p.attachment!);
  const canSend = (value.trim().length > 0 || readyAttachments.length > 0) && !disabled && !isSending && !isUploading;
  const canSchedule = canSend && !!onSchedule;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) handleSend();
    }
  }

  function handleSend() {
    onSend(value.trim(), readyAttachments);
    setPending([]);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(uploadFile);
    }
    event.target.value = "";
  }

  function uploadFile(file: File) {
    const localId = `${file.name}-${Date.now()}-${Math.random()}`;
    setPending((prev) => [...prev, { localId, file, status: "uploading" }]);

    storageApi
      .upload(file)
      .then((res) => {
        const attachment: MessageAttachment = {
          id: res.data.id,
          type: res.data.media_type,
          fileName: res.data.filename,
          mimeType: res.data.content_type,
          sizeBytes: res.data.size,
          fileUrl: res.data.file_url,
        };
        setPending((prev) => prev.map((p) => (p.localId === localId ? { ...p, status: "done", attachment } : p)));
      })
      .catch((err) => {
        const errorMessage = err instanceof ApiError ? err.message : "Upload failed";
        setPending((prev) => prev.map((p) => (p.localId === localId ? { ...p, status: "error", errorMessage } : p)));
      });
  }

  function removePending(localId: string) {
    setPending((prev) => prev.filter((p) => p.localId !== localId));
  }

  async function sendSticker(sticker: { id: string; url: string }) {
    try {
      const res = await fetch(sticker.url);
      if (!res.ok) throw new Error("Could not load sticker image");
      const blob = await res.blob();
      const file = new File([blob], `sticker-${sticker.id}.png`, { type: blob.type || "image/png" });
      // Stickers aren't real uploaded media on the backend, so re-upload the
      // image as a genuine attachment first — sending the sticker catalog id
      // directly as a media_id gets rejected by the backend as unknown media.
      const uploaded = await storageApi.upload(file);
      onSend("", [
        {
          id: uploaded.data.id,
          type: uploaded.data.media_type,
          fileName: uploaded.data.filename,
          mimeType: uploaded.data.content_type,
          sizeBytes: uploaded.data.size,
          fileUrl: uploaded.data.file_url,
        },
      ]);
    } catch (err) {
      setStickerError(err instanceof ApiError ? err.message : "Failed to send sticker");
    }
  }

  function openSchedulePopover(event: React.MouseEvent<HTMLElement>) {
    setScheduleError(null);
    setScheduleValue(toDatetimeLocalValue(new Date(Date.now() + 5 * 60 * 1000)));
    setScheduleAnchor(event.currentTarget);
  }

  function handleConfirmSchedule() {
    if (!onSchedule || !scheduleValue) return;
    const scheduledAt = new Date(scheduleValue);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      setScheduleError("Pick a time in the future.");
      return;
    }
    onSchedule(value.trim(), readyAttachments, scheduledAt);
    setPending([]);
    setScheduleAnchor(null);
  }

  return (
    <Box sx={{ flexShrink: 0, borderTop: 1, borderColor: "divider", p: { xs: 1.5, sm: 2 } }}>
      {pending.length > 0 ? (
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap", rowGap: 1 }}>
          {pending.map((p) => (
            <Chip
              key={p.localId}
              size="small"
              label={p.file.name}
              onDelete={() => removePending(p.localId)}
              icon={
                p.status === "uploading" ? (
                  <CircularProgress size={14} sx={{ ml: 1 }} />
                ) : p.status === "error" ? (
                  <Tooltip title={p.errorMessage ?? "Upload failed"}>
                    <ErrorOutlineRoundedIcon color="error" sx={{ fontSize: 16 }} />
                  </Tooltip>
                ) : undefined
              }
            />
          ))}
        </Stack>
      ) : null}

      <Stack
        direction="row"
        spacing={0.5}
        sx={{ alignItems: "center", bgcolor: "action.hover", borderRadius: 4, px: 1, py: 0.5, opacity: disabled ? 0.6 : 1 }}
      >
        <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} disabled={disabled || !canUploadMedia} />
        <Tooltip title={canUploadMedia ? "Attach a file" : "You don't have permission to upload media here"}>
          <span>
            <IconButton
              disabled={disabled || !canUploadMedia}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach a file"
            >
              <AttachFileRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>

        <TextField
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onTyping?.();
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          variant="standard"
          multiline
          maxRows={8}
          fullWidth
          slotProps={{ input: { disableUnderline: true }, htmlInput: { "aria-label": "Message" } }}
          sx={{ px: 0.5, py: 0.75 }}
        />

        <Tooltip title={canUploadMedia ? "Send a sticker" : "You don't have permission to upload media here"}>
          <span>
            <IconButton
              disabled={disabled || !canUploadMedia}
              onClick={(e) => setStickerAnchor(e.currentTarget)}
              aria-label="Send a sticker"
            >
              <StickyNote2RoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
        <IconButton
          disabled={disabled}
          onClick={(e) => setEmojiAnchor(e.currentTarget)}
          aria-label="Open emoji picker"
        >
          <EmojiEmotionsRoundedIcon />
        </IconButton>

        {onSchedule ? (
          <Tooltip title="Schedule send">
            <span>
              <IconButton
                disabled={!canSchedule}
                onClick={openSchedulePopover}
                aria-label="Schedule send"
              >
                <ScheduleSendRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>
        ) : null}

        <IconButton
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          color="primary"
          sx={{
            bgcolor: canSend ? "primary.main" : "transparent",
            color: canSend ? "primary.contrastText" : "text.disabled",
            "&:hover": { bgcolor: canSend ? "primary.dark" : "transparent" },
          }}
        >
          {isSending ? <CircularProgress size={20} color="inherit" /> : <SendRoundedIcon />}
        </IconButton>
      </Stack>

      <EmojiPicker
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        onSelect={(emoji) => onChange(`${value}${emoji}`)}
      />
      <StickerPicker
        anchorEl={stickerAnchor}
        onClose={() => setStickerAnchor(null)}
        onSelect={(sticker) => {
          setStickerAnchor(null);
          void sendSticker(sticker);
        }}
      />

      <Snackbar open={Boolean(stickerError)} autoHideDuration={4000} onClose={() => setStickerError(null)}>
        <Alert severity="error" onClose={() => setStickerError(null)} sx={{ width: "100%" }}>
          {stickerError}
        </Alert>
      </Snackbar>

      <Popover
        open={Boolean(scheduleAnchor)}
        anchorEl={scheduleAnchor}
        onClose={() => setScheduleAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Stack spacing={1.5} sx={{ p: 2, width: 260 }}>
          <Typography variant="subtitle2">Schedule this message</Typography>
          <TextField
            type="datetime-local"
            size="small"
            value={scheduleValue}
            onChange={(e) => {
              setScheduleValue(e.target.value);
              setScheduleError(null);
            }}
            slotProps={{ htmlInput: { min: toDatetimeLocalValue(new Date()) } }}
          />
          {scheduleError ? (
            <Typography variant="caption" color="error">
              {scheduleError}
            </Typography>
          ) : null}
          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
            <Button size="small" onClick={() => setScheduleAnchor(null)}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={handleConfirmSchedule}>
              Schedule
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </Box>
  );
}
