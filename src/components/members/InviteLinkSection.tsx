"use client";

import { useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import ShareRounded from "@mui/icons-material/ShareRounded";

export interface InviteLinkSectionProps {
  /** Display name of the group/channel, used to build the shareable invite message. */
  targetName: string;
  /** Existing link, if one's already been generated/loaded this session. */
  link: string | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
}

/** Backed by an endpoint that doesn't exist on the live backend yet — see docs/BACKEND_REQUIREMENTS.md. */
export function InviteLinkSection({ targetName, link, loading, error, onGenerate }: InviteLinkSectionProps) {
  const [copied, setCopied] = useState<"link" | "message" | null>(null);

  function inviteMessage(url: string) {
    return `Join "${targetName}"! ${url}`;
  }

  async function handleCopyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied("link");
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleShare() {
    if (!link) return;
    const message = inviteMessage(link);
    if (navigator.share) {
      try {
        await navigator.share({ title: targetName, text: message, url: link });
      } catch {
        // User cancelled the share sheet — nothing to do.
      }
      return;
    }
    await navigator.clipboard.writeText(message);
    setCopied("message");
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
        Invite link
      </Typography>
      {link ? (
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <TextField size="small" fullWidth value={link} slotProps={{ input: { readOnly: true } }} />
            <Button size="small" variant="outlined" startIcon={<ContentCopyRounded fontSize="small" />} onClick={handleCopyLink}>
              {copied === "link" ? "Copied" : "Copy"}
            </Button>
          </Stack>
          <Button size="small" variant="text" startIcon={<ShareRounded fontSize="small" />} onClick={handleShare} sx={{ alignSelf: "flex-start" }}>
            {copied === "message" ? "Invite message copied" : "Share invite"}
          </Button>
        </Stack>
      ) : (
        <Button size="small" variant="outlined" onClick={onGenerate} disabled={loading}>
          {loading ? "Generating…" : "Generate invite link"}
        </Button>
      )}
      {error ? (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}
