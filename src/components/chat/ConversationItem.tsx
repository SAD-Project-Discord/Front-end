import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import type { DmContact } from "@/lib/chat/dmContacts";
import { chatSurfaces } from "@/lib/theme/theme";

export interface ConversationItemProps {
  contact: DmContact;
  isActive?: boolean;
  onSelect: (userId: string) => void;
}

export function ConversationItem({ contact, isActive = false, onSelect }: ConversationItemProps) {
  const hasUnread = contact.unreadCount > 0;

  return (
    <ListItemButton
      selected={isActive}
      onClick={() => onSelect(contact.userId)}
      sx={{ borderRadius: 3, mx: 1, py: 1 }}
    >
      <ListItemAvatar>
        <Avatar
          src={contact.avatarUrl || undefined}
          alt=""
          slotProps={{ img: { loading: "lazy", decoding: "async" } }}
          sx={{ bgcolor: chatSurfaces.raised }}
        >
          {contact.name.charAt(0).toUpperCase()}
        </Avatar>
      </ListItemAvatar>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography
            variant="body2"
            noWrap
            sx={{ fontWeight: hasUnread ? 600 : 500 }}
          >
            {contact.name}
          </Typography>
          {contact.lastMessageAt ? (
            <Typography variant="caption" color={hasUnread ? "primary.main" : "text.disabled"} sx={{ flexShrink: 0 }}>
              {formatRelativeTime(contact.lastMessageAt)}
            </Typography>
          ) : null}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" color={hasUnread ? "text.primary" : "text.secondary"} noWrap sx={{ flex: 1 }}>
            {contact.lastMessagePreview || "No messages yet"}
          </Typography>
          {hasUnread ? (
            <Box
              sx={{
                flexShrink: 0,
                minWidth: 18,
                height: 18,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontSize: 11,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 0.5,
              }}
            >
              {contact.unreadCount > 99 ? "99+" : contact.unreadCount}
            </Box>
          ) : null}
        </Stack>
      </Box>
    </ListItemButton>
  );
}

function formatRelativeTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "";

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
