import type { User } from "@/types/auth";

export type ContactStatus = "pending" | "accepted" | "rejected";

export interface Contact {
  id: string;
  user: User;
  status: ContactStatus;
  created_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ContactsResponse {
  success: boolean;
  data: Contact[];
  meta?: PaginationMeta;
}
