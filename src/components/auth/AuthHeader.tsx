"use client";

import { Box, Typography } from "@mui/material";
import { SvgIconComponent } from "@mui/icons-material";
import { palette } from "@/theme/theme";

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
          border: `2px solid ${palette.slateLight}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 1.5,
        }}
      >
        <Icon sx={{ fontSize: 30, color: palette.slateLight }} />
      </Box>
      <Typography variant="h1" component="h1" gutterBottom={false}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        {subtitle}
      </Typography>
    </Box>
  );
}
