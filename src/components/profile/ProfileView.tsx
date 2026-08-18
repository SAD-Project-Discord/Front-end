import { Alert, Avatar, Box, Button, Card, Divider, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import {
  ArrowBackRounded,
  ChatBubbleOutlineRounded,
  EditRounded,
  PersonAddRounded,
  PersonRemoveRounded,
} from "@mui/icons-material";

interface ProfileUser {
  username: string;
  name: string;
  bio: string;
  avatar_url: string;
  email?: string;
}

interface ProfileViewProps {
  user: ProfileUser;
  onBack?: () => void;
  onEdit?: () => void;
  onMessage?: () => void;
  onContactToggle?: () => void;
  isContact?: boolean;
  isContactWorking?: boolean;
  contactError?: string | null;
  /** Strip the outer card chrome (border/shadow/max-width) — used inside a Dialog that already provides it. */
  embedded?: boolean;
}

export default function ProfileView({
  user,
  onBack,
  onEdit,
  onMessage,
  onContactToggle,
  isContact = false,
  isContactWorking = false,
  contactError,
  embedded = false,
}: ProfileViewProps) {
  const avatarFallback = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <Card
      elevation={0}
      sx={
        embedded
          ? { width: "100%", p: 0, border: "none", boxShadow: "none", bgcolor: "transparent" }
          : { width: "100%", maxWidth: 600, p: { xs: 3, sm: 4 }, border: "1px solid", borderColor: "divider", borderRadius: 3 }
      }
    >
      {onBack || onEdit ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          {onBack ? (
            <IconButton aria-label="Back" onClick={onBack}>
              <ArrowBackRounded />
            </IconButton>
          ) : (
            <Box />
          )}
          {onEdit ? (
            <Tooltip title="Edit profile & settings">
              <IconButton aria-label="Edit profile & settings" onClick={onEdit}>
                <EditRounded />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      ) : null}

      <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center" }}>
        <Avatar
          src={user.avatar_url || undefined}
          alt={`${user.name}'s avatar`}
          sx={{ width: 112, height: 112, mb: 1, fontSize: "2.5rem" }}
        >
          {avatarFallback}
        </Avatar>

        <Typography component="h1" variant="h1" sx={{ fontSize: "1.25rem", fontWeight: 700 }}>
          {user.name}
        </Typography>
        <Typography color="text.secondary">@{user.username}</Typography>
        {user.email ? (
          <Typography color="text.secondary">{user.email}</Typography>
        ) : null}

        {onMessage || onContactToggle ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ width: "100%", justifyContent: "center", pt: 1.5 }}>
            {onMessage ? (
              <Button variant="contained" startIcon={<ChatBubbleOutlineRounded />} onClick={onMessage}>
                Message
              </Button>
            ) : null}
            {onContactToggle ? (
              <Button
                variant="outlined"
                color={isContact ? "error" : "primary"}
                startIcon={isContact ? <PersonRemoveRounded /> : <PersonAddRounded />}
                disabled={isContactWorking}
                onClick={onContactToggle}
              >
                {isContactWorking ? "Working…" : isContact ? "Remove contact" : "Add contact"}
              </Button>
            ) : null}
          </Stack>
        ) : null}

        {contactError ? <Alert severity="error" sx={{ width: "100%", mt: 1.5 }}>{contactError}</Alert> : null}
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography component="h2" variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          About me
        </Typography>
        <Typography color="text.secondary">
          {user.bio || "No bio has been added yet."}
        </Typography>
      </Box>
    </Card>
  );
}
