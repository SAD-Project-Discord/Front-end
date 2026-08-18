import type { PublicUserProfile } from "@/types/user";

export interface ContactPaginationMeta {
  next_cursor: string | null;
  has_more: boolean;
}

export interface ContactsResponse {
  success: boolean;
  data: PublicUserProfile[];
  meta: ContactPaginationMeta;
}

export interface ContactResponse {
  success: boolean;
  data: PublicUserProfile;
}

export interface ListContactsParams {
  q?: string;
  cursor?: string;
  limit?: number;
}
