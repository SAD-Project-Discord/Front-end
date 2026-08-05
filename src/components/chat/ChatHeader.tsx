import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import type { User } from "@/lib/types";
import { chatSurfaces } from "@/lib/theme/theme";

export interface ChatHeaderProps {
  otherUser: User;
  onBack?: () => void;
  onToggleSearch?: () => void;
  isSearchOpen?: boolean;
}

export function ChatHeader({ otherUser, onBack, onToggleSearch, isSearchOpen = false }: ChatHeaderProps) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: "center",
        height: 64,
        flexShrink: 0,
        px: { xs: 1.5, sm: 2 },
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: chatSurfaces.header,
      }}
    >
      {onBack ? (
        <IconButton onClick={onBack} aria-label="Back to conversations" sx={{ display: { md: "none" } }}>
          <ArrowBackRoundedIcon />
        </IconButton>
      ) : null}

      <Avatar
        src={otherUser.avatarUrl || undefined}
        alt=""
        slotProps={{ img: { loading: "lazy", decoding: "async" } }}
        sx={{ width: 36, height: 36, bgcolor: chatSurfaces.raised, fontSize: 14 }}
      >
        {otherUser.displayName.charAt(0).toUpperCase()}
      </Avatar>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="subtitle2" noWrap sx={{ lineHeight: 1.3 }}>
          {otherUser.displayName}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", lineHeight: 1.3 }}>
          @{otherUser.username}
        </Typography>
      </Box>

      {onToggleSearch ? (
        <IconButton
          onClick={onToggleSearch}
          aria-label="Search in conversation"
          color={isSearchOpen ? "primary" : "default"}
        >
          <SearchRoundedIcon />
        </IconButton>
      ) : null}
    </Stack>
  );
}
