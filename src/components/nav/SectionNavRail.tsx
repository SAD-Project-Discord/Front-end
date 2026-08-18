"use client";

import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ForumRounded from "@mui/icons-material/ForumRounded";
import PeopleAltRounded from "@mui/icons-material/PeopleAltRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import TagRounded from "@mui/icons-material/TagRounded";
import { chatSurfaces } from "@/lib/theme/theme";

const SECTIONS = [
  { href: "/dm", label: "Direct Messages", icon: ForumRounded },
  { href: "/contacts", label: "Contacts", icon: PeopleAltRounded },
  { href: "/groups", label: "Groups", icon: GroupsRounded },
  { href: "/channels", label: "Channels", icon: TagRounded },
] as const;

export function SectionNavRail() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Stack
      sx={{
        width: 64,
        flexShrink: 0,
        alignItems: "center",
        py: 2,
        gap: 1,
        borderRight: 1,
        borderColor: "divider",
        bgcolor: chatSurfaces.page,
      }}
    >
      {SECTIONS.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href) ?? false;
        return (
          <Tooltip key={href} title={label} placement="right">
            <IconButton
              onClick={() => router.push(href)}
              aria-label={label}
              sx={{
                width: 44,
                height: 44,
                borderRadius: active ? 3 : "50%",
                bgcolor: active ? "primary.main" : chatSurfaces.raised,
                color: active ? "primary.contrastText" : "text.secondary",
                transition: "border-radius 150ms, background-color 150ms",
                "&:hover": { bgcolor: active ? "primary.dark" : "action.hover" },
              }}
            >
              <Icon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      })}
      <Box sx={{ flex: 1 }} />
    </Stack>
  );
}
