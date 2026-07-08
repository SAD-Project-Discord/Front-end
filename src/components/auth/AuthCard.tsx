"use client";

import { Paper } from "@mui/material";

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: 400,
        p: { xs: 3.5, sm: 4.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 20px 45px -20px rgba(20, 20, 30, 0.25)",
      }}
    >
      {children}
    </Paper>
  );
}
