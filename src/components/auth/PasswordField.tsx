"use client";

import { useState } from "react";
import { IconButton, InputAdornment, TextFieldProps } from "@mui/material";
import { Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import IconTextField from "./IconTextField";

type PasswordFieldProps = Omit<TextFieldProps, "label" | "type"> & {
  label: string;
};

export default function PasswordField({ label, ...textFieldProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <IconTextField
      label={label}
      icon={Lock}
      type={visible ? "text" : "password"}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible((v) => !v)}
                edge="end"
                size="small"
              >
                {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      {...textFieldProps}
    />
  );
}