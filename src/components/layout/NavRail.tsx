"use client";

import { useRouter, usePathname } from "next/navigation";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ForumRounded from "@mui/icons-material/ForumRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import { observer } from "mobx-react-lite";
import authStore from "@/stores/AuthStore";
import { chatSurfaces } from "@/lib/theme/theme";

const NAV_ITEMS = [
  { href: "/dm", label: "Direct Messages", icon: ForumRounded },
  { href: "/groups", label: "Groups", icon: GroupsRounded },
  { href: "/profile", label: "Profile", icon: PersonRounded },
];

function NavRail() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await authStore.logout();
    router.push("/login");
  }

  return (
    <Stack
      sx={{
        width: 64,
        flexShrink: 0,
        height: "100dvh",
        bgcolor: chatSurfaces.page,
        borderRight: 1,
        borderColor: "divider",
        alignItems: "center",
        py: 2,
      }}
    >
      <Stack spacing={1} sx={{ flex: 1, alignItems: "center" }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname?.startsWith(href);
          return (
            <Tooltip key={href} title={label} placement="right">
              <IconButton
                onClick={() => router.push(href)}
                aria-label={label}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 3,
                  color: isActive ? "primary.contrastText" : "text.secondary",
                  bgcolor: isActive ? "primary.main" : "transparent",
                  "&:hover": { bgcolor: isActive ? "primary.dark" : "action.hover" },
                }}
              >
                <Icon />
              </IconButton>
            </Tooltip>
          );
        })}
      </Stack>

      <Tooltip title="Log out" placement="right">
        <IconButton onClick={handleLogout} aria-label="Log out" sx={{ width: 44, height: 44, color: "text.secondary" }}>
          <LogoutRounded />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

export default observer(NavRail);
