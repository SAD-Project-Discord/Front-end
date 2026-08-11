"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Box, Button, Card, CircularProgress, Stack, Typography } from "@mui/material";
import { isAxiosError } from "axios";
import inviteService from "@/services/invite.service";
import type { InvitePreview } from "@/types/invite";

// Landing page for a shared group/channel invite link (e.g. /invite/abc123).
// Backed by an endpoint that doesn't exist on the live backend yet — see
// docs/BACKEND_REQUIREMENTS.md. Sits inside the (app) route group, so an
// unauthenticated visitor is redirected to /login by the layout first and
// loses the invite target — that continuation isn't handled yet either.
export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    inviteService
      .previewInvite(params.token)
      .then((res) => {
        if (!cancelled) setPreview(res.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          isAxiosError(err) && err.response?.status === 404
            ? "This invite link is invalid or has expired."
            : "Couldn't load this invite.";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.token]);

  function goToTarget(targetType: "group" | "channel", targetId: string) {
    router.push(`/${targetType === "group" ? "groups" : "channels"}?open=${targetId}`);
  }

  async function handleJoin() {
    if (!preview) return;
    setJoining(true);
    try {
      const res = await inviteService.acceptInvite(params.token);
      goToTarget(res.data.target_type, res.data.target_id);
    } catch {
      setError("Couldn't join — the invite link may have expired.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <Box
      component="main"
      sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 2, sm: 4 } }}
    >
      <Card
        elevation={0}
        sx={{ width: "100%", maxWidth: 420, p: { xs: 3, sm: 4 }, border: "1px solid", borderColor: "divider", borderRadius: 3 }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={26} />
          </Box>
        ) : error || !preview ? (
          <Alert severity="error">{error ?? "This invite link is invalid or has expired."}</Alert>
        ) : (
          <Stack spacing={2}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                {preview.target_type === "group" ? "Group invite" : "Channel invite"}
              </Typography>
              <Typography variant="h1" component="h1" sx={{ fontSize: "1.4rem" }}>
                {preview.target_name}
              </Typography>
              {preview.target_description ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {preview.target_description}
                </Typography>
              ) : null}
              <Typography variant="caption" color="text.secondary">
                {preview.member_count} member{preview.member_count === 1 ? "" : "s"}
              </Typography>
            </Box>

            {preview.is_member ? (
              <Button variant="contained" onClick={() => goToTarget(preview.target_type, preview.target_id)}>
                Open
              </Button>
            ) : (
              <Button variant="contained" onClick={handleJoin} disabled={joining}>
                {joining ? "Joining…" : "Join"}
              </Button>
            )}
          </Stack>
        )}
      </Card>
    </Box>
  );
}
