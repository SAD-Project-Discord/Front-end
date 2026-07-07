"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Alert, Box, Button, Stack } from "@mui/material";
import { AccountCircle, AlternateEmail, Email, ArrowForward } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { observer } from "mobx-react-lite";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthCard from "@/components/auth/AuthCard";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthFooter from "@/components/auth/AuthFooter";
import IconTextField from "@/components/auth/IconTextField";
import PasswordField from "@/components/auth/PasswordField";
import authStore from "@/stores/AuthStore";

interface RegisterFormValues {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const initialValues: RegisterFormValues = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function RegisterPage() {
  const router = useRouter();
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange =
    (field: keyof RegisterFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      if (formError) {
        setFormError(null);
      }
    };

  const validateForm = () => {
    const fullName = values.fullName.trim();
    const username = values.username.trim();
    const email = values.email.trim();

    if (!fullName) {
      return "Full name is required.";
    }

    if (fullName.length < 2) {
      return "Full name must be at least 2 characters long.";
    }

    if (!username) {
      return "Username is required.";
    }

    if (username.length < 3) {
      return "Username must be at least 3 characters long.";
    }

    if (!email) {
      return "Email is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address.";
    }

    if (values.password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    if (!values.confirmPassword) {
      return "Please confirm your password.";
    }

    if (values.password !== values.confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      authStore.error = null;
      return;
    }

    setFormError(null);
    authStore.error = null;

    const success = await authStore.register(
      values.fullName.trim(),
      values.username.trim(),
      values.email.trim(),
      values.password
    );

    if (success) {
      router.push("/");
    }
  };

  return (
    <AuthBackground>
      <AuthCard>
        <AuthHeader
          icon={AccountCircle}
          title="Create Account"
          subtitle="Sign up to join your community."
        />

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <IconTextField
            label="Full Name"
            icon={AccountCircle}
            placeholder="John Doe"
            value={values.fullName}
            onChange={handleChange("fullName")}
            autoComplete="name"
            required
          />

          <IconTextField
            label="Username"
            icon={AlternateEmail}
            placeholder="johndoe88"
            value={values.username}
            onChange={handleChange("username")}
            autoComplete="username"
            required
          />

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
            autoComplete="new-password"
            required
          />

          <PasswordField
            label="Confirm Password"
            placeholder="••••••••"
            value={values.confirmPassword}
            onChange={handleChange("confirmPassword")}
            autoComplete="new-password"
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
              {authStore.isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </Stack>
        </Box>

        <AuthFooter prompt="Already have an account?" linkLabel="Log In" href="/login" />
      </AuthCard>
    </AuthBackground>
  );
}

export default observer(RegisterPage);
