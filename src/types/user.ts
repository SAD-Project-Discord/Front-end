export interface PublicUserProfile {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar_url: string;
  is_contact: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsersSearchResponse {
  success: boolean;
  data: PublicUserProfile[];
}
