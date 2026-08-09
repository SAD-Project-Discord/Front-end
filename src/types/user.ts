import type { User } from "@/types/auth";
import type { PaginationMeta } from "@/types/contact";

export interface PublicUserProfile {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface UsersSearchResponse {
  success: boolean;
  data: User[];
  meta?: PaginationMeta;
}
