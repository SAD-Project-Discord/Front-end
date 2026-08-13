"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { isAxiosError } from "axios";
import { observer } from "mobx-react-lite";
import ProfileView from "@/components/profile/ProfileView";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import userService from "@/services/user.service";
import authStore from "@/stores/AuthStore";
import type { User } from "@/types/auth";
import type { PublicUserProfile } from "@/types/user";

interface UserProfilePanelProps {
  userId: string;
  /** Strip outer card chrome from the rendered view/edit form (see `ProfileView`/`ProfileEditForm`). */
  embedded?: boolean;
}

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 404) {
    return "This user could not be found.";
  }
  return "Unable to load this profile. Please try again.";
}

/**
 * Fetches and renders a single user's profile, merging the "my profile"
 * (editable) and "someone else's profile" (read-only) experiences into one
 * component keyed off whether `userId` matches the signed-in user.
 */
function UserProfilePanel({ userId, embedded = false }: UserProfilePanelProps) {
  const [user, setUser] = useState<User | PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  const isSelf = Boolean(authStore.user && authStore.user.id === userId);

  useEffect(() => {
    if (!userId) return;

    let isCancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        await authStore.hydrateUser();
        if (isCancelled) return;

        if (authStore.user && authStore.user.id === userId) {
          setUser(authStore.user);
          return;
        }

        const profile = await userService.getPublicProfile(userId);
        if (!isCancelled) setUser(profile);
      } catch (requestError: unknown) {
        if (!isCancelled) {
          setUser(null);
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [userId, requestVersion]);

  if (!userId) {
    return (
      <Typography variant="body2" color="text.secondary">
        No user was selected.
      </Typography>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress aria-label="Loading profile" />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error ?? "Unable to load this profile."}</Alert>
        <Button variant="contained" onClick={() => setRequestVersion((v) => v + 1)} sx={{ alignSelf: "flex-start" }}>
          Try again
        </Button>
      </Stack>
    );
  }

  if (isSelf && isEditing) {
    return (
      <ProfileEditForm
        user={user as User}
        embedded={embedded}
        onCancel={() => setIsEditing(false)}
        onSaved={(updated) => {
          setUser(updated);
          authStore.setUserProfile(updated);
          setIsEditing(false);
        }}
      />
    );
  }

  return <ProfileView user={user} embedded={embedded} onEdit={isSelf ? () => setIsEditing(true) : undefined} />;
}

export default observer(UserProfilePanel);
