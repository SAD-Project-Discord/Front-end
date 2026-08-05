import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import BrokenImageRoundedIcon from "@mui/icons-material/BrokenImageRounded";
import type { MessageAttachment } from "@/lib/types";
import { chatSurfaces } from "@/lib/theme/theme";

export interface AttachmentRendererProps {
  attachment: MessageAttachment;
}

export function AttachmentRenderer({ attachment }: AttachmentRendererProps) {
  switch (attachment.type) {
    case "image":
      return <ImageAttachment attachment={attachment} />;
    case "video":
      return (
        <video
          src={attachment.fileUrl}
          controls
          preload="metadata"
          style={{ maxWidth: 320, maxHeight: 320, borderRadius: 12, display: "block", backgroundColor: "#000" }}
        />
      );
    case "audio":
      return (
        <Box sx={{ minWidth: 260 }}>
          <audio src={attachment.fileUrl} controls preload="metadata" style={{ width: "100%" }} />
        </Box>
      );
    default:
      return <FileAttachment attachment={attachment} />;
  }
}

function ImageAttachment({ attachment }: { attachment: MessageAttachment }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <FileAttachment attachment={attachment} broken />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={attachment.fileUrl}
      alt={attachment.fileName}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      onClick={() => window.open(attachment.fileUrl, "_blank", "noopener,noreferrer")}
      style={{
        maxWidth: 280,
        maxHeight: 320,
        borderRadius: 12,
        objectFit: "cover",
        cursor: "zoom-in",
        display: "block",
      }}
    />
  );
}

function FileAttachment({ attachment, broken }: { attachment: MessageAttachment; broken?: boolean }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: "center", bgcolor: chatSurfaces.raised, borderRadius: 3, px: 1.5, py: 1, maxWidth: 320 }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: "50%",
          bgcolor: "rgba(91,110,245,0.15)",
          color: "primary.main",
          flexShrink: 0,
        }}
      >
        {broken ? (
          <BrokenImageRoundedIcon fontSize="small" />
        ) : (
          <InsertDriveFileRoundedIcon fontSize="small" />
        )}
      </Box>
      <Stack sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
          {attachment.fileName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatBytes(attachment.sizeBytes)}
        </Typography>
      </Stack>
      <IconButton
        size="small"
        component="a"
        href={attachment.fileUrl}
        download={attachment.fileName}
        target="_blank"
        rel="noreferrer"
        aria-label="Download attachment"
      >
        <DownloadRoundedIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
