import profileModalStore from "@/stores/ProfileModalStore";

/** Shareable/direct-linkable URL for a user's profile (rendered as its own full page). */
export function profileHref(userId: string): string {
  return `/users/profile?userId=${encodeURIComponent(userId)}`;
}

/**
 * Opens the user-profile modal for `userId` on top of whatever page is
 * currently mounted. Purely client-side state — no navigation, no URL
 * change — so it behaves like any other modal/dialog in the app and never
 * disturbs the page underneath (open chats, other dialogs, the nav rail).
 */
export function openUserProfile(userId: string): void {
  if (!userId) return;
  profileModalStore.open(userId);
}

/** Closes the profile modal opened via `openUserProfile`. */
export function closeUserProfile(): void {
  profileModalStore.close();
}
