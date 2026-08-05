"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import BrokenImageRoundedIcon from "@mui/icons-material/BrokenImageRounded";
import type { MessageAttachment } from "@/lib/types";
import { storageApi } from "@/lib/api/storage";
import { chatSurfaces } from "@/lib/theme/theme";

export interface AttachmentRendererProps {
  attachment: MessageAttachment;
}

/**
 * The backend never tells us an attachment's mimetype unless *this* session
 * uploaded it (see attachmentMetaCache) — so only those get an inline image
 * preview. Everything else renders as a generic file chip whose download
 * link is resolved lazily, on click, rather than eagerly for every message.
 */
export function AttachmentRenderer({ attachment }: AttachmentRendererProps) {
  const isKnownImage = attachment.mimeType?.startsWith("image/") ?? false;
  return isKnownImage ? (
    <ImageAttachment attachment={attachment} />
  ) : (
    <FileAttachment attachment={attachment} />
  );
}

function ImageAttachment({ attachment }: { attachment: MessageAttachment }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    storageApi
      .getFileUrl(attachment.id)
      .then((res) => {
        if (!cancelled) setUrl(res.data.presigned_url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attachment.id]);

  if (failed) return <FileAttachment attachment={attachment} broken />;

  if (!url) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 220,
          height: 160,
          borderRadius: 3,
          bgcolor: chatSurfaces.raised,
        }}
      >
        <CircularProgress size={22} />
      </Box>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={attachment.fileName ?? "Image attachment"}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
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

function FileAttachment({
  attachment,
  broken,
}: {
  attachment: MessageAttachment;
  broken?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setLoading(true);
    try {
      const res = await storageApi.getFileUrl(attachment.id);
      window.open(res.data.presigned_url, "_blank", "noopener,noreferrer");
    } catch {
      // Storage is a known-broken backend dependency right now; the disabled
      // spinner-then-idle affordance is the honest signal here.
    } finally {
      setLoading(false);
    }
  }

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
          {attachment.fileName ?? "Attachment"}
        </Typography>
        {attachment.sizeBytes ? (
          <Typography variant="caption" color="text.secondary">
            {formatBytes(attachment.sizeBytes)}
          </Typography>
        ) : null}
      </Stack>
      <IconButton size="small" onClick={handleOpen} disabled={loading} aria-label="Open attachment">
        {loading ? <CircularProgress size={16} /> : <DownloadRoundedIcon fontSize="small" />}
      </IconButton>
    </Stack>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
