"use client";

// "My profile" has been merged into the unified `/users/profile` modal
// experience (self vs. others is resolved there). This route is kept only
// so old bookmarks/links to `/profile` keep working.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import authStore from "@/stores/AuthStore";
import { profileHref } from "@/lib/profileNav";

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await authStore.hydrateUser();
      if (cancelled) return;
      const id = authStore.user?.id;
      router.replace(id ? profileHref(id) : "/dm");
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CircularProgress size={24} aria-label="Redirecting to your profile" />
    </Box>
  );
}
