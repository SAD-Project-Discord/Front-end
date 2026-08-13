"use client";

import { Dialog, DialogContent, IconButton } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import UserProfilePanel from "./UserProfilePanel";

interface ProfileDialogProps {
  userId: string | null;
  onClose: () => void;
}

export default function ProfileDialog({ userId, onClose }: ProfileDialogProps) {
  return (
    <Dialog
      open={Boolean(userId)}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 3, position: "relative" } } }}
    >
      <IconButton
        aria-label="Close profile"
        onClick={onClose}
        size="small"
        sx={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
      <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
        {userId ? <UserProfilePanel userId={userId} embedded /> : null}
      </DialogContent>
    </Dialog>
  );
}
