import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser, AuthResult } from './types';
import { AuthAdapter, getInitialUser } from './authAdapter';
import { isSupabaseConfigured } from './supabase';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, name?: string) => Promise<AuthResult>;
  loginWithMagicLink: (email: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const currentUser = await AuthAdapter.getCurrentUser();
        if (mounted) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Failed to get current user:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    const unsubscribe = AuthAdapter.subscribe((updatedUser) => {
      if (mounted) {
        setUser(updatedUser);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await AuthAdapter.signInWithEmail(email, password);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await AuthAdapter.signUpWithEmail(email, password, name);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMagicLink = async (email: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      return await AuthAdapter.signInWithOtp(email);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await AuthAdapter.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSupabaseConfigured,
        login,
        register,
        loginWithMagicLink,
        logout,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        isAuthModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
