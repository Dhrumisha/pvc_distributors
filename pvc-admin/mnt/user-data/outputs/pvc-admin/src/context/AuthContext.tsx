'use client';
// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getToken, setToken, clearToken } from '@/lib/api';
import { authService } from '@/lib/services';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  roles: string[];
  permissions: string[];
  must_set_password?: boolean;
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

  // ── On mount: if a token exists in cookie, call /auth/me to restore session ─
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // Token exists — try to restore the user session
    fetchMe().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await authService.me();
      const u = res.data?.data?.user ?? res.data?.data;
      setUser(u ?? null);
    } catch {
      // /auth/me failed — the api.ts interceptor already tried to refresh.
      // If we're here the session is truly gone.
      clearToken();
      setUser(null);
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    const { token, user: u } = res.data.data;
    setToken(token); // stores in cookie + memory
    setUser(u);
    return { mustSetPassword: !!u?.must_set_password };
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearToken();
    setUser(null);
    window.location.href = '/auth/login';
  }, []);

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
