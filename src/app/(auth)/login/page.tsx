"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Alert, Box, Button, Stack } from "@mui/material";
import { AccountCircle, Email, ArrowForward } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { observer } from "mobx-react-lite";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthCard from "@/components/auth/AuthCard";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthFooter from "@/components/auth/AuthFooter";
import IconTextField from "@/components/auth/IconTextField";
import PasswordField from "@/components/auth/PasswordField";
import authStore from "@/stores/AuthStore";

interface LoginFormValues {
  email: string;
  password: string;
}

function LoginPage() {
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange =
    (field: keyof LoginFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      if (formError) {
        setFormError(null);
      }
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const email = values.email.trim();
    const password = values.password.trim();

    if (!email || !password) {
      setFormError("Email and password are required.");
      authStore.setError(null);
      return;
    }

    setFormError(null);
    authStore.setError(null);

    const success = await authStore.login(email, password);

    if (success) {
      router.push("/");
    }
  };

  return (
    <AuthBackground>
      <AuthCard>
        <AuthHeader icon={AccountCircle} title="Welcome Back" subtitle="Log in to your account." />

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <IconTextField
            label="Email Address"
            icon={Email}
            placeholder="john@example.com"
            type="email"
            value={values.email}
            onChange={handleChange("email")}
            autoComplete="email"
            required
          />

          <PasswordField
            label="Password"
            placeholder="••••••••"
            value={values.password}
            onChange={handleChange("password")}
            autoComplete="current-password"
            required
          />

          {(formError || authStore.error) ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError ?? authStore.error}
            </Alert>
          ) : null}

          <Stack sx={{ mt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={authStore.isLoading}
              endIcon={<ArrowForward fontSize="small" />}
            >
              {authStore.isLoading ? "Logging in..." : "Log In"}
            </Button>
          </Stack>
        </Box>

        <AuthFooter
          prompt="Don't have an account?"
          linkLabel="Create one"
          href="/register"
          onClick={() => {
            setFormError(null);
            authStore.setError(null);
          }}
        />
      </AuthCard>
    </AuthBackground>
  );
}

export default observer(LoginPage);
