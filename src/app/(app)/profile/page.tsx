"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, CircularProgress, Snackbar } from "@mui/material";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import ProfileView from "@/components/profile/ProfileView";
import { usersApi } from "@/lib/api/users";
import authStore from "@/stores/AuthStore";
import type { User } from "@/types/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadProfile = async () => {
      try {
        const response = await usersApi.me();

        if (!isCancelled) {
          setUser(response.data as User);
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
      {!isLoading && user && isEditing ? (
        <ProfileEditForm
          user={user}
          onCancel={() => setIsEditing(false)}
          onSaved={(updatedUser) => {
            setUser(updatedUser);
            authStore.setUserProfile(updatedUser);
            setIsEditing(false);
            setSaved(true);
          }}
        />
      ) : null}
      {!isLoading && user && !isEditing ? (
        <ProfileView user={user} onBack={() => router.back()} onEdit={() => setIsEditing(true)} />
      ) : null}

      <Snackbar open={saved} autoHideDuration={3000} onClose={() => setSaved(false)}>
        <Alert severity="success" variant="filled" onClose={() => setSaved(false)}>
          Profile updated.
        </Alert>
      </Snackbar>
    </Box>
  );
}
