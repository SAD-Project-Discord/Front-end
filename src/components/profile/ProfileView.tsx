import { Avatar, Box, Card, Divider, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { ArrowBackRounded, EditRounded } from "@mui/icons-material";

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
  /** Strip the outer card chrome (border/shadow/max-width) — used inside a Dialog that already provides it. */
  embedded?: boolean;
}

export default function ProfileView({ user, onBack, onEdit, embedded = false }: ProfileViewProps) {
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
