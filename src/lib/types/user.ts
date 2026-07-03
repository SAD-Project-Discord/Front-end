/**
 * Represents a chat participant.
 *
 * This is intentionally minimal and chat-scoped — it is NOT the full
 * application user/profile model. If a global `User` type already exists
 * elsewhere (e.g. auth/session), prefer mapping to/from that at the
 * boundary rather than importing it directly here, to keep this module
 * decoupled from auth concerns.
 */
export interface User {
  /** Stable unique identifier for the user. */
  id: string;

  /** Display name shown in the UI. */
  displayName: string;

  /** Optional handle/username (e.g. "@jane"), if the product uses one. */
  username?: string;

  /** URL to the user's avatar image. */
  avatarUrl?: string;

  /** Whether the user is currently online. */
  isOnline?: boolean;

  /** ISO 8601 timestamp of the user's last activity, if known. */
  lastSeenAt?: string;
}
