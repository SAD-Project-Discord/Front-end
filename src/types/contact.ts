import type { PublicUserProfile } from "@/types/user";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// The live endpoint (`GET /users/contacts`) returns the users the current
// user has exchanged direct messages with, as a flat list — not a
// friend-request/pending-accepted-rejected relationship model.
export interface ContactsResponse {
  success: boolean;
  data: PublicUserProfile[];
  meta?: PaginationMeta;
}
