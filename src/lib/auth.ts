// src/lib/auth.ts
//
// Thin client-side session helpers built on the same localStorage keys that
// src/lib/api/api.ts reads/writes during requests (kept as plain string keys
// rather than a shared import to avoid a circular dependency between the two
// modules).

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const CURRENT_USER_KEY = "current_user";

export interface CachedUser {
  id: string;
  username: string;
  name: string;
  avatar_url: string;
}

/**
 * Coarse client-side gate for the protected route group. Only checks for the
 * *presence* of an access token, not its expiry — an expired-but-present
 * token still lets the user into the shell, and the first API call will
 * transparently refresh it (see fetchApi's 401 handling).
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}

export function getAccessToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
}

export function getRefreshToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
}

export function setSessionTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
}

/**
 * A small cached snapshot of the logged-in user, stored alongside the tokens
 * at login time. Lets the DM UI (contact list keying, "is this my own
 * message" checks) render synchronously without waiting on a `/users/me`
 * round trip on every page load.
 */
export function getCachedUser(): CachedUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedUser;
  } catch {
    return null;
  }
}

export function setCachedUser(user: CachedUser): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}
