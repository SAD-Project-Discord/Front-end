export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: Tokens;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: Tokens;
}

export interface LogoutRequest {
  refresh_token: string;
}
