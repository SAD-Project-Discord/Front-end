/**
 * A chat participant, mapped from the backend's user representation.
 * There is no presence/"online status" API, so no such field exists here —
 * showing a fake online indicator would be dishonest UI.
 */
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
}
