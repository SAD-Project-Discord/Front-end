"use client";

import { Box } from "@mui/material";

/**
 * Full-viewport backdrop for the auth pages. Uses the app's theme background
 * so it matches dark mode. By default it's locked to the viewport height so
 * the page doesn't scroll; pass `scrollable` for taller forms (e.g. Register)
 * that may not fit on smaller screens.
 */
export default function AuthBackground({
  children,
  scrollable = false,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <Box
      sx={{
        height: scrollable ? "auto" : "100vh",
        minHeight: "100vh",
        width: "100%",
        overflow: scrollable ? "auto" : "hidden",
        bgcolor: "background.default",
        backgroundImage: (theme) =>
          `radial-gradient(${theme.palette.divider} 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 2,
      }}
    >
      {children}
    </Box>
  );
}
