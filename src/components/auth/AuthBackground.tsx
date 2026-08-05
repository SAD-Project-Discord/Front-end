"use client";

import { Box } from "@mui/material";

/**
 * Full-viewport backdrop: page background with a faint dot grid.
 * Centers whatever's passed as children (the auth card).
 */
export default function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: "background.default",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        borderTop: "6px solid",
        borderColor: "primary.main",
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
