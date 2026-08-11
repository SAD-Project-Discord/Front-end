"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowBackRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import settingsStore from "@/stores/SettingsStore";
import type { GroupAddPermission } from "@/types/settings";

function SettingsPage() {
  const router = useRouter();

  const [groupAddPermission, setGroupAddPermission] = useState<GroupAddPermission>("everyone");

  useEffect(() => {
    settingsStore.loadSettings();
  }, []);

  useEffect(() => {
    // Synchronizing local editable form state from the mobx store once its
    // fetch resolves — a legitimate effect, not state derivable from render.
    if (settingsStore.settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroupAddPermission(settingsStore.settings.group_add_permission);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsStore.settings]);

  async function handleSave() {
    const ok = await settingsStore.saveSettings({
      group_add_permission: groupAddPermission,
    });
    if (ok) router.back();
  }

  return (
    <Box
      component="main"
      sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 2, sm: 4 } }}
    >
      <Card
        elevation={0}
        sx={{ width: "100%", maxWidth: 560, p: { xs: 3, sm: 4 }, border: "1px solid", borderColor: "divider", borderRadius: 3 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
          <IconButton aria-label="Back" onClick={() => router.back()} size="small">
            <ArrowBackRounded fontSize="small" />
          </IconButton>
          <Typography component="h1" variant="h1" sx={{ fontSize: "1.4rem" }}>
            Settings &amp; Privacy
          </Typography>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {settingsStore.isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={26} />
          </Box>
        ) : (
          <Stack spacing={3}>
            <FormControl>
              <FormLabel sx={{ fontWeight: 600, color: "text.primary" }}>Who can add you to groups</FormLabel>
              <RadioGroup
                value={groupAddPermission}
                onChange={(e) => setGroupAddPermission(e.target.value as GroupAddPermission)}
              >
                <FormControlLabel value="everyone" control={<Radio />} label="Everyone" />
                <FormControlLabel value="contacts" control={<Radio />} label="Contacts only" />
                <FormControlLabel value="nobody" control={<Radio />} label="Nobody" />
              </RadioGroup>
            </FormControl>

            {settingsStore.error ? <Alert severity="error">{settingsStore.error}</Alert> : null}

            <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end" }}>
              <Button variant="contained" onClick={handleSave} disabled={settingsStore.isSaving}>
                {settingsStore.isSaving ? "Saving..." : "Save changes"}
              </Button>
            </Stack>
          </Stack>
        )}
      </Card>
    </Box>
  );
}

export default observer(SettingsPage);
