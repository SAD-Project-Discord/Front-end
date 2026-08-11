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
  FormHelperText,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { ArrowBackRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import settingsStore from "@/stores/SettingsStore";
import type { GroupAddPermission } from "@/types/settings";

function SettingsPage() {
  const router = useRouter();

  const [groupAddPermission, setGroupAddPermission] = useState<GroupAddPermission>("everyone");
  const [allowDirectAdd, setAllowDirectAdd] = useState(true);
  const [saved, setSaved] = useState(false);

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

  const hasChanges = settingsStore.settings
    ? groupAddPermission !== settingsStore.settings.group_add_permission ||
      allowDirectAdd !== settingsStore.settings.allow_direct_add
    : false;

  function handleGroupAddPermissionChange(permission: GroupAddPermission) {
    setGroupAddPermission(permission);
    if (permission === "nobody") {
      setAllowDirectAdd(false);
    }
  }

  async function handleSave() {
    setSaved(false);
    const ok = await settingsStore.saveSettings({
      group_add_permission: groupAddPermission,
      allow_direct_add: allowDirectAdd,
    });
    if (ok) setSaved(true);
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
        ) : !settingsStore.settings ? (
          <Stack spacing={2}>
            <Alert severity="error">{settingsStore.error ?? "Could not load settings."}</Alert>
            <Button variant="outlined" onClick={() => settingsStore.loadSettings()}>
              Try again
            </Button>
          </Stack>
        ) : (
          <Stack spacing={3}>
            <FormControl>
              <FormLabel sx={{ fontWeight: 600, color: "text.primary" }}>Who can invite you to groups</FormLabel>
              <RadioGroup
                value={groupAddPermission}
                onChange={(e) => handleGroupAddPermissionChange(e.target.value as GroupAddPermission)}
              >
                <FormControlLabel value="everyone" control={<Radio />} label="Everyone" />
                <FormControlLabel value="contacts" control={<Radio />} label="Contacts only" />
                <FormControlLabel value="nobody" control={<Radio />} label="Nobody" />
              </RadioGroup>
            </FormControl>

            <FormControlLabel
              control={<Switch checked={allowDirectAdd} onChange={(e) => setAllowDirectAdd(e.target.checked)} />}
              label="Allow people to add you directly, without an invitation"
              disabled={groupAddPermission === "nobody"}
            />
            <FormHelperText sx={{ mt: -2 }}>
              When disabled, permitted people can still send an invitation for you to accept.
            </FormHelperText>

            {settingsStore.error ? <Alert severity="error">{settingsStore.error}</Alert> : null}

            <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={settingsStore.isSaving || !hasChanges}
              >
                {settingsStore.isSaving ? "Saving..." : "Save changes"}
              </Button>
            </Stack>
          </Stack>
        )}
      </Card>

      <Snackbar open={saved} autoHideDuration={3000} onClose={() => setSaved(false)}>
        <Alert severity="success" variant="filled" onClose={() => setSaved(false)}>
          Settings saved.
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default observer(SettingsPage);
