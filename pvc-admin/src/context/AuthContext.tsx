'use client';
// src/context/AuthContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Global authentication state.
// - Reads JWT from cookie on mount, fetches /auth/me to hydrate user
// - Exposes login, logout, hasPermission, hasRole helpers
// - Does NOT redirect — middleware.ts handles all routing logic
// ─────────────────────────────────────────────────────────────────────────────
import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import Cookies from 'js-cookie';
import { authService } from '@/lib/services';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  roles: string[];
  permissions: string[];
  must_set_password?: boolean; // true for newly invited users
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ mustSetPassword: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]    = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  // ── Hydrate on mount from existing cookie ───────────────────────────────────
  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) { setLoading(false); return; }
    fetchMe().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await authService.me();
      setUser(res.data.data?.user ?? res.data.data);
    } catch {
      Cookies.remove('access_token');
      setUser(null);
    }
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    const payload = res.data.data;
    const { token, user: u } = payload;

    Cookies.set('access_token', token, {
      expires:  1,        // 1 day — refreshed via /auth/refresh
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    setUser(u);

    return { mustSetPassword: !!u?.must_set_password };
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* swallow */ }
    Cookies.remove('access_token');
    setUser(null);
    // Hard redirect so middleware picks it up cleanly
    window.location.href = '/auth/login';
  }, []);

  // ── Permission check ────────────────────────────────────────────────────────
  const hasPermission = useCallback((module: string, action: string) => {
    if (!user) return false;
    if (user.roles.includes('Admin')) return true;
    return user.permissions.includes(`${module}.${action}`);
  }, [user]);

  const hasRole = useCallback((role: string) => {
    return user?.roles.includes(role) ?? false;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      isAuthenticated: !!user,
      login, logout,
      refreshUser: fetchMe,
      hasPermission, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
