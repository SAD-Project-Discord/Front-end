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
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import EmojiEmotionsRoundedIcon from "@mui/icons-material/EmojiEmotionsRounded";
import StickyNote2RoundedIcon from "@mui/icons-material/StickyNote2Rounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { storageApi } from "@/lib/api/storage";
import { setAttachmentMeta } from "@/lib/chat/attachmentMetaCache";
import { EmojiPicker } from "./EmojiPicker";
import { StickerPicker } from "./StickerPicker";

interface PendingAttachment {
  localId: string;
  file: File;
  status: "uploading" | "done" | "error";
  fileKey?: string;
}

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string, attachmentIds: string[]) => void;
  onTyping?: () => void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onTyping,
  disabled = false,
  isSending = false,
  placeholder = "Message…",
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const [stickerAnchor, setStickerAnchor] = useState<HTMLElement | null>(null);

  const isUploading = pending.some((p) => p.status === "uploading");
  const readyAttachmentIds = pending.filter((p) => p.status === "done" && p.fileKey).map((p) => p.fileKey!);
  const canSend = (value.trim().length > 0 || readyAttachmentIds.length > 0) && !disabled && !isSending && !isUploading;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) handleSend();
    }
  }

  function handleSend() {
    onSend(value.trim(), readyAttachmentIds);
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
        setAttachmentMeta(res.data.file_key, {
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });
        setPending((prev) =>
          prev.map((p) => (p.localId === localId ? { ...p, status: "done", fileKey: res.data.file_key } : p)),
        );
      })
      .catch(() => {
        setPending((prev) => prev.map((p) => (p.localId === localId ? { ...p, status: "error" } : p)));
      });
  }

  function removePending(localId: string) {
    setPending((prev) => prev.filter((p) => p.localId !== localId));
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
                  <Tooltip title="Upload failed">
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
        sx={{ alignItems: "flex-end", bgcolor: "action.hover", borderRadius: 4, px: 1, py: 0.5, opacity: disabled ? 0.6 : 1 }}
      >
        <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} disabled={disabled} />
        <IconButton
          size="small"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach a file"
          sx={{ mb: 0.5 }}
        >
          <AttachFileRoundedIcon fontSize="small" />
        </IconButton>

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

        <IconButton
          size="small"
          disabled={disabled}
          onClick={(e) => setStickerAnchor(e.currentTarget)}
          aria-label="Send a sticker"
          sx={{ mb: 0.5 }}
        >
          <StickyNote2RoundedIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          disabled={disabled}
          onClick={(e) => setEmojiAnchor(e.currentTarget)}
          aria-label="Open emoji picker"
          sx={{ mb: 0.5 }}
        >
          <EmojiEmotionsRoundedIcon fontSize="small" />
        </IconButton>

        <IconButton
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          color="primary"
          sx={{
            mb: 0.5,
            bgcolor: canSend ? "primary.main" : "transparent",
            color: canSend ? "primary.contrastText" : "text.disabled",
            "&:hover": { bgcolor: canSend ? "primary.dark" : "transparent" },
          }}
        >
          {isSending ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon fontSize="small" />}
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
        // No sticker packs are seeded on the backend yet, so this path is
        // unverified against a live sticker id — revisit once real packs exist.
        onSelect={(sticker) => onSend("", [sticker.id])}
      />
    </Box>
  );
}
