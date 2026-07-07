"use client";

import { Box, Divider, Link as MuiLink, Typography } from "@mui/material";
import NextLink from "next/link";

interface AuthFooterProps {
  prompt: string;
  linkLabel: string;
  href: string;
}

export default function AuthFooter({ prompt, linkLabel, href }: AuthFooterProps) {
  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 2.5 }} />
      <Typography variant="body2" align="center">
        {prompt}{" "}
        <MuiLink
          component={NextLink}
          href={href}
          sx={{ color: "text.primary", fontWeight: 600, textDecorationColor: "text.secondary" }}
        >
          {linkLabel}
        </MuiLink>
      </Typography>
    </Box>
  );
}
