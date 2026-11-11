export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'supabase' | 'demo';
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser | null;
  token?: string;
  expiresAt?: number;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
  message?: string;
}
