import type { User } from "@/types/auth";
import type { PaginationMeta } from "@/types/contact";

export interface UsersSearchResponse {
  success: boolean;
  data: User[];
  meta?: PaginationMeta;
}
