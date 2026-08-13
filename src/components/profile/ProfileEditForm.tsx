"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowBackRounded,
  DeleteOutlineRounded,
  PhotoCameraRounded,
  SaveRounded,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { ApiError } from "@/lib/api/api";
import { storageApi } from "@/lib/api/storage";
import { usersApi } from "@/lib/api/users";
import settingsStore from "@/stores/SettingsStore";
import type { User } from "@/types/auth";
import type { GroupAddPermission } from "@/types/settings";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const MAX_AVATAR_SIZE = 10 * 1024 * 1024;

interface ProfileEditFormProps {
  user: User;
  onCancel: () => void;
  onSaved: (user: User) => void;
  /** Strip the outer card chrome (border/shadow/max-width) — used inside a Dialog that already provides it. */
  embedded?: boolean;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const firstDetail = Object.values(error.details ?? {}).flat()[0];
    return firstDetail || error.message;
  }
  return "Could not update your profile. Please try again.";
}

function ProfileEditForm({ user, onCancel, onSaved, embedded = false }: ProfileEditFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [groupAddPermission, setGroupAddPermission] = useState<GroupAddPermission>("everyone");
  const [allowDirectAdd, setAllowDirectAdd] = useState(true);

  useEffect(() => {
    settingsStore.loadSettings();
  }, []);

  useEffect(() => {
    // Synchronizing local editable form state from the mobx store once its
    // fetch resolves — a legitimate effect, not state derivable from render.
    if (settingsStore.settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroupAddPermission(settingsStore.settings.group_add_permission);
      setAllowDirectAdd(settingsStore.settings.allow_direct_add);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsStore.settings]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function handleGroupAddPermissionChange(permission: GroupAddPermission) {
    setGroupAddPermission(permission);
    if (permission === "nobody") {
      setAllowDirectAdd(false);
    }
  }

  const trimmedName = name.trim();
  const trimmedUsername = username.trim();
  const settingsChanged = settingsStore.settings
    ? groupAddPermission !== settingsStore.settings.group_add_permission ||
      allowDirectAdd !== settingsStore.settings.allow_direct_add
    : false;
  const hasChanges =
    trimmedName !== user.name ||
    trimmedUsername !== user.username ||
    bio !== user.bio ||
    Boolean(avatarFile) ||
    (removeAvatar && Boolean(user.avatar_url)) ||
    settingsChanged;

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError("Choose a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError("Avatar images must be 10 MB or smaller.");
      return;
    }

    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
  }

  function handleRemoveAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!trimmedName) {
      setError("Display name is required.");
      return;
    }
    if (trimmedName.length > 255) {
      setError("Display name must be 255 characters or fewer.");
      return;
    }
    if (!trimmedUsername) {
      setError("Username is required.");
      return;
    }
    if (trimmedUsername.length > 150) {
      setError("Username must be 150 characters or fewer.");
      return;
    }

    setIsSaving(true);
    let uploadedMediaId: string | null = null;

    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const uploaded = await storageApi.upload(avatarFile);
        uploadedMediaId = uploaded.data.id;
        avatarUrl = uploaded.data.file_url;
      } else if (removeAvatar) {
        avatarUrl = "";
      }

      const response = await usersApi.updateMe({
        name: trimmedName,
        username: trimmedUsername,
        bio,
        ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
      });

      if (settingsChanged) {
        const settingsSaved = await settingsStore.saveSettings({
          group_add_permission: groupAddPermission,
          allow_direct_add: allowDirectAdd,
        });
        if (!settingsSaved) {
          setError(settingsStore.error ?? "Could not save settings.");
          return;
        }
      }

      onSaved({
        ...user,
        ...response.data,
        email: response.data.email ?? user.email,
      });
    } catch (saveError) {
      if (uploadedMediaId) {
        await storageApi.deleteFile(uploadedMediaId).catch(() => undefined);
      }
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  const avatarSource = avatarPreview ?? (!removeAvatar ? user.avatar_url || undefined : undefined);
  const avatarFallback = trimmedName.charAt(0).toUpperCase() || "?";

  return (
    <Card
      component="form"
      onSubmit={handleSubmit}
      elevation={0}
      sx={
        embedded
          ? { width: "100%", p: 0, border: "none", boxShadow: "none", bgcolor: "transparent" }
          : { width: "100%", maxWidth: 640, p: { xs: 3, sm: 4 }, border: "1px solid", borderColor: "divider", borderRadius: 3 }
      }
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 3 }}>
        <IconButton aria-label="Cancel profile editing" onClick={onCancel} disabled={isSaving}>
          <ArrowBackRounded />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography component="h1" variant="h1" sx={{ fontSize: "1.4rem" }}>
            Edit profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update how other people see you.
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={3}>
        <Stack spacing={1.5} sx={{ alignItems: "center" }}>
          <Avatar
            src={avatarSource}
            alt="Avatar preview"
            sx={{ width: 112, height: 112, fontSize: "2.5rem" }}
          >
            {avatarFallback}
          </Avatar>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              type="button"
              variant="outlined"
              startIcon={<PhotoCameraRounded />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
            >
              Choose image
            </Button>
            <Button
              type="button"
              color="inherit"
              startIcon={<DeleteOutlineRounded />}
              onClick={handleRemoveAvatar}
              disabled={isSaving || (!avatarSource && !avatarFile)}
            >
              Remove
            </Button>
          </Stack>
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleAvatarChange}
          />
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
            JPEG, PNG, GIF, or WebP. Maximum 10 MB.
          </Typography>
        </Stack>

        <TextField
          label="Display name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          fullWidth
          disabled={isSaving}
          slotProps={{ htmlInput: { maxLength: 255 } }}
        />
        <TextField
          label="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
          fullWidth
          disabled={isSaving}
          slotProps={{ htmlInput: { maxLength: 150 } }}
        />
        <TextField
          label="Bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          fullWidth
          multiline
          minRows={4}
          disabled={isSaving}
          placeholder="Tell people a little about yourself"
        />

        <Divider />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
            Settings &amp; Privacy
          </Typography>

          <Stack spacing={2}>
            <FormControl>
              <FormLabel sx={{ fontWeight: 600, color: "text.primary" }}>Who can invite you to groups</FormLabel>
              <RadioGroup
                value={groupAddPermission}
                onChange={(e) => handleGroupAddPermissionChange(e.target.value as GroupAddPermission)}
              >
                <FormControlLabel value="everyone" control={<Radio />} label="Everyone" disabled={isSaving} />
                <FormControlLabel value="contacts" control={<Radio />} label="Contacts only" disabled={isSaving} />
                <FormControlLabel value="nobody" control={<Radio />} label="Nobody" disabled={isSaving} />
              </RadioGroup>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={allowDirectAdd}
                  onChange={(e) => setAllowDirectAdd(e.target.checked)}
                  disabled={isSaving || groupAddPermission === "nobody"}
                />
              }
              label="Allow people to add you directly, without an invitation"
            />
            <FormHelperText sx={{ mt: -1.5 }}>
              When disabled, permitted people can still send an invitation for you to accept.
            </FormHelperText>
          </Stack>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end" }}>
          <Button type="button" color="inherit" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveRounded />}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}

export default observer(ProfileEditForm);
