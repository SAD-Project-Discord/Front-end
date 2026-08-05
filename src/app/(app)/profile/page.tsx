"use client";

import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress } from "@mui/material";
import ProfileView from "@/components/profile/ProfileView";
import userService from "@/services/user.service";
import type { User } from "@/types/auth";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadProfile = async () => {
      try {
        const profile = await userService.getMyProfile();

        if (!isCancelled) {
          setUser(profile);
        }
      } catch {
        if (!isCancelled) {
          setError("Unable to load your profile. Please log in and try again.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 4 },
      }}
    >
      {isLoading ? <CircularProgress aria-label="Loading profile" /> : null}
      {!isLoading && error ? <Alert severity="error">{error}</Alert> : null}
      {!isLoading && user ? <ProfileView user={user} /> : null}
    </Box>
  );
}
