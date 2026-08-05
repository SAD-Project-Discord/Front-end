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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) router.replace("/dm");
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setSessionTokens(res.data.tokens.access_token, res.data.tokens.refresh_token);
      setCachedUser({
        id: res.data.user.id,
        username: res.data.user.username,
        name: res.data.user.name,
        avatar_url: res.data.user.avatar_url,
      });
      router.push("/dm");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Paper elevation={0} sx={{ p: 4, width: "100%", maxWidth: 380, borderRadius: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Log in to continue to your messages.
        </Typography>

        <Stack component="form" onSubmit={handleSubmit} spacing={2}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
          Don&apos;t have an account?{" "}
          <MuiLink component={NextLink} href="/register">
            Register
          </MuiLink>
        </Typography>
      </Paper>
    </Box>
  );
}
