"use client";

import { Box } from "@mui/material";
import { palette } from "@/theme/theme";

/**
 * Full-viewport backdrop: soft lavender wash with a faint dot grid,
 * plus the thin near-black bar along the very top edge from the mock.
 * Centers whatever's passed as children (the auth card).
 */
export default function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: palette.backdrop,
        backgroundImage: `radial-gradient(${palette.backdropDot} 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
        borderTop: `6px solid ${palette.ink}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 6,
      }}
    >
      {children}
    </Box>
  );
}
