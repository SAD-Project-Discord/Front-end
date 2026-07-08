"use client";

import { Box, InputAdornment, TextField, TextFieldProps, Typography } from "@mui/material";
import { SvgIconComponent } from "@mui/icons-material";
import { palette } from "@/theme/theme";

interface IconTextFieldProps extends Omit<TextFieldProps, "label"> {
  label: string;
  icon: SvgIconComponent;
}

/**
 * Label sits above the field as plain text (not the floating MUI label),
 * with an icon adornment on the left — mirrors the "Full Name / @ Username /
 * envelope Email" pattern in the mock. Built on top of MUI's TextField so
 * all standard props (value, onChange, error, helperText, name, type, etc.)
 * still work.
 */
export default function IconTextField({ label, icon: Icon, id, slotProps, ...textFieldProps }: IconTextFieldProps) {
  const fieldId = id ?? `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <Box sx={{ mb: 2.25 }}>
      <Typography
        component="label"
        htmlFor={fieldId}
        sx={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "text.primary", mb: 0.75 }}
      >
        {label}
      </Typography>
      <TextField
        id={fieldId}
        fullWidth
        {...textFieldProps}
        slotProps={{
          ...slotProps,
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Icon sx={{ fontSize: 20, color: palette.slateLight }} />
              </InputAdornment>
            ),
            ...slotProps?.input,
          },
        }}
      />
    </Box>
  );
}