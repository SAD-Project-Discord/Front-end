"use client";

import { Box, Typography } from "@mui/material";
import { SvgIconComponent } from "@mui/icons-material";

interface AuthHeaderProps {
  icon: SvgIconComponent;
  title: string;
  subtitle: string;
}

export default function AuthHeader({ icon: Icon, title, subtitle }: AuthHeaderProps) {
  return (
    <Box sx={{ textAlign: "center", mb: 3.5 }}>
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "2px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 1.5,
        }}
      >
        <Icon sx={{ fontSize: 30, color: "text.secondary" }} />
      </Box>
      <Typography variant="h6" component="h1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        {subtitle}
      </Typography>
    </Box>
  );
}
