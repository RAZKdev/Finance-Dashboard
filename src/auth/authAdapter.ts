import { supabase, isSupabaseConfigured } from './supabase';
import type { AuthUser, AuthResult } from './types';

const DEMO_USER_STORAGE_KEY = 'finance-dashboard-demo-user-v1';

export const DEFAULT_DEMO_USER: AuthUser = {
  id: 'usr_demo',
  email: 'demo@financedashboard.app',
  name: 'Akun Demo',
  provider: 'demo',
  createdAt: '2024-01-01T00:00:00Z',
};

export const getInitialUser = (): AuthUser => {
  try {
    const saved = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.email === 'string') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_DEMO_USER;
};

export class AuthAdapter {
  private static listeners: Array<(user: AuthUser | null) => void> = [];

  static subscribe(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private static notify(user: AuthUser | null) {
    for (const listener of this.listeners) {
      listener(user);
    }
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
          return null;
        }
        return {
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          avatarUrl: session.user.user_metadata?.avatar_url,
          provider: 'supabase',
          createdAt: session.user.created_at,
        };
      } catch (err) {
        console.warn('Supabase getSession error:', err);
      }
    }

    return getInitialUser();
  }

  static async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: 'Email wajib diisi' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email ?? trimmedEmail,
          name: data.user.user_metadata?.full_name || trimmedEmail.split('@')[0] || 'User',
          avatarUrl: data.user.user_metadata?.avatar_url,
          provider: 'supabase',
          createdAt: data.user.created_at,
        };

        this.notify(user);
        return { success: true, user };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    }

    // Demo Mode fallback
    const user: AuthUser = {
      id: `usr_${Date.now()}`,
      email: trimmedEmail,
      name: trimmedEmail === DEFAULT_DEMO_USER.email ? DEFAULT_DEMO_USER.name : (trimmedEmail.split('@')[0] || 'Akun Demo'),
      provider: 'demo',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(user));
    this.notify(user);
    return { success: true, user };
  }

  static async signUpWithEmail(email: string, password: string, name?: string): Promise<AuthResult> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: 'Email wajib diisi' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { full_name: name || trimmedEmail.split('@')[0] },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (!data.user) {
          return { success: false, error: 'Gagal membuat akun pengguna' };
        }

        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email ?? trimmedEmail,
          name: name || data.user.user_metadata?.full_name || trimmedEmail.split('@')[0],
          provider: 'supabase',
          createdAt: data.user.created_at,
        };

        this.notify(user);
        return {
          success: true,
          user,
          message: data.session ? 'Akun berhasil dibuat' : 'Silakan periksa email Anda untuk konfirmasi pendaftaran.',
        };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    }

    // Demo Mode fallback
    const user: AuthUser = {
      id: `usr_${Date.now()}`,
      email: trimmedEmail,
      name: name || trimmedEmail.split('@')[0] || 'Akun Demo',
      provider: 'demo',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(user));
    this.notify(user);
    return { success: true, user, message: 'Akun berhasil didaftarkan (Mode Demo)' };
  }

  static async signInWithOtp(email: string): Promise<AuthResult> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, error: 'Email wajib diisi' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: trimmedEmail,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, message: 'Magic link telah dikirim ke email Anda!' };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Gagal mengirim link OTP' };
      }
    }

    return {
      success: true,
      message: 'Mode Demo: Magic link disimulasikan. Anda dapat langsung masuk dengan email demo.',
    };
  }

  static async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }

    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    this.notify(null);
  }
}
