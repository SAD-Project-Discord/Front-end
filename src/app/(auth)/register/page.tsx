"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import MuiLink from "@mui/material/Link";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/api";
import { isAuthenticated, setSessionTokens, setCachedUser } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) router.replace("/dm");
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await authApi.register({ name, username, email, password });
      setSessionTokens(res.data.tokens.access_token, res.data.tokens.refresh_token);
      setCachedUser({
        id: res.data.user.id,
        username: res.data.user.username,
        name: res.data.user.name,
        avatar_url: res.data.user.avatar_url,
      });
      router.push("/dm");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.details ?? {});
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Paper elevation={0} sx={{ p: 4, width: "100%", maxWidth: 380, borderRadius: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Create an account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Join to start messaging your team.
        </Typography>

        <Stack component="form" onSubmit={handleSubmit} spacing={2}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            autoFocus
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name?.[0]}
          />
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
            error={Boolean(fieldErrors.username)}
            helperText={fieldErrors.username?.[0]}
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            error={Boolean(fieldErrors.email)}
            helperText={fieldErrors.email?.[0]}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            error={Boolean(fieldErrors.password)}
            helperText={fieldErrors.password?.[0]}
          />

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
          Already have an account?{" "}
          <MuiLink component={NextLink} href="/login">
            Log in
          </MuiLink>
        </Typography>
      </Paper>
    </Box>
  );
}
