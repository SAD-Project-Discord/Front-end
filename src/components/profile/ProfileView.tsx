import { Avatar, Box, Card, Divider, Stack, Typography } from "@mui/material";
import type { User } from "@/types/auth";

interface ProfileViewProps {
  user: User;
}

export default function ProfileView({ user }: ProfileViewProps) {
  const avatarFallback = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: 600,
        p: { xs: 3, sm: 4 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
      }}
    >
      <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center" }}>
        <Avatar
          src={user.avatar_url || undefined}
          alt={`${user.name}'s avatar`}
          sx={{ width: 112, height: 112, mb: 1, fontSize: "2.5rem" }}
        >
          {avatarFallback}
        </Avatar>

        <Typography component="h1" variant="h1">
          {user.name}
        </Typography>
        <Typography color="text.secondary">@{user.username}</Typography>
        <Typography color="text.secondary">{user.email}</Typography>
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
