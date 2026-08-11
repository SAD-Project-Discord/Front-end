import { type KeyboardEvent } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { chatSurfaces } from "@/lib/theme/theme";

export interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  onBack?: () => void;
  onToggleSearch?: () => void;
  isSearchOpen?: boolean;
  onHeaderClick?: () => void;
  /** Extra actions rendered after the search button (e.g. a members icon for groups). */
  actions?: React.ReactNode;
}

export function ChatHeader({
  title,
  subtitle,
  avatarUrl,
  onBack,
  onToggleSearch,
  isSearchOpen = false,
  onHeaderClick,
  actions,
}: ChatHeaderProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onHeaderClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onHeaderClick();
    }
  };
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
        src={avatarUrl || undefined}
        alt=""
        slotProps={{ img: { loading: "lazy", decoding: "async" } }}
        sx={{ width: 36, height: 36, bgcolor: chatSurfaces.raised, fontSize: 14 }}
      >
        {title.charAt(0).toUpperCase()}
      </Avatar>

      <Box
        onClick={onHeaderClick}
        onKeyDown={handleKeyDown}
        role={onHeaderClick ? "button" : undefined}
        tabIndex={onHeaderClick ? 0 : undefined}
        sx={{ minWidth: 0, flex: 1, cursor: onHeaderClick ? "pointer" : "default" }}
      >
        <Typography variant="subtitle2" noWrap sx={{ lineHeight: 1.3 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", lineHeight: 1.3 }}>
            {subtitle}
          </Typography>
        ) : null}
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

      {actions}
    </Stack>
  );
}
