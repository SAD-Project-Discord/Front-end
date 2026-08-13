"use client";

// Direct/hard navigation to this URL (typed, refreshed, or a shared link)
// renders as its own standalone page — clicking a name/avatar elsewhere in
// the app instead opens the same profile as a plain client-side modal (see
// `openUserProfile` in `@/lib/profileNav`), without touching this route at
// all.

import { Suspense, useCallback } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { ArrowBackRounded } from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";
import UserProfilePanel from "@/components/profile/UserProfilePanel";

const pageContainerStyles = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: { xs: 2, sm: 4 },
};

function UsersProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId")?.trim() ?? "";

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/dm");
    }
  }, [router]);

  return (
    <Box component="main" sx={pageContainerStyles}>
      <Box sx={{ width: "100%", maxWidth: 600 }}>
        <Tooltip title="Back">
          <IconButton aria-label="Back" onClick={handleBack} sx={{ mb: 1 }}>
            <ArrowBackRounded />
          </IconButton>
        </Tooltip>
        <UserProfilePanel key={userId} userId={userId} />
      </Box>
    </Box>
  );
}

export default function UsersProfilePage() {
  return (
    <Suspense fallback={<Box component="main" sx={pageContainerStyles} />}>
      <UsersProfilePageContent />
    </Suspense>
  );
}
