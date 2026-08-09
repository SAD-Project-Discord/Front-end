"use client";

import { Suspense, useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack } from "@mui/material";
import { isAxiosError } from "axios";
import { useSearchParams } from "next/navigation";

import ProfileView from "@/components/profile/ProfileView";
import userService from "@/services/user.service";
import type { PublicUserProfile } from "@/types/user";

const pageContainerStyles = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: { xs: 2, sm: 4 },
};

const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 404) {
    return "This user could not be found.";
  }

  return "Unable to load this profile. Please try again.";
};

interface PublicProfileLoaderProps {
  userId: string;
}

function PublicProfileLoader({ userId }: PublicProfileLoaderProps) {
  const [user, setUser] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(
    userId ? null : "No user was selected.",
  );
  const [requestVersion, setRequestVersion] = useState(0);

  const retry = () => {
    setUser(null);
    setError(null);
    setIsLoading(true);
    setRequestVersion((version) => version + 1);
  };

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isCancelled = false;

    const loadProfile = async () => {
      try {
        const profile = await userService.getPublicProfile(userId);

        if (!isCancelled) {
          setUser(profile);
        }
      } catch (requestError: unknown) {
        if (!isCancelled) {
          setUser(null);
          setError(getErrorMessage(requestError));
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
  }, [requestVersion, userId]);

  return (
    <Box component="main" sx={pageContainerStyles}>
      {isLoading ? (
        <CircularProgress aria-label="Loading public profile" />
      ) : null}

      {!isLoading && error ? (
        <Stack spacing={2} sx={{ width: "100%", maxWidth: 600 }}>
          <Alert severity="error">{error}</Alert>
          {userId ? (
            <Button variant="contained" onClick={retry}>
              Try again
            </Button>
          ) : null}
        </Stack>
      ) : null}

      {!isLoading && user ? <ProfileView user={user} /> : null}
    </Box>
  );
}

function PublicProfileContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId")?.trim() ?? "";

  return <PublicProfileLoader key={userId} userId={userId} />;
}

export default function PublicProfilePage() {
  return (
    <Suspense
      fallback={
        <Box component="main" sx={pageContainerStyles}>
          <CircularProgress aria-label="Loading public profile" />
        </Box>
      }
    >
      <PublicProfileContent />
    </Suspense>
  );
}
