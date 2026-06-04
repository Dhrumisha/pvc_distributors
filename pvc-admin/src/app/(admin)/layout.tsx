'use client';
// src/app/(admin)/layout.tsx
// Middleware already ensures only authenticated users reach here.
// This layout just shows the loading screen while AuthContext hydrates,
// then renders the sidebar + topbar shell.
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar  from '@/components/layout/Topbar';
import { Package } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // If user must set password (newly invited), redirect immediately
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.must_set_password) {
      router.replace('/auth/set-password?required=true');
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Loading screen while JWT / /auth/me resolves
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-deepest)' }}
      >
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--accent)', boxShadow: '0 0 24px rgba(245,158,11,0.35)' }}
          >
            <Package size={22} color="#0a0c10" strokeWidth={2.5} />
          </div>
          <div className="spinner" style={{ width: 22, height: 22 }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading PVC Admin…</p>
        </div>
      </div>
    );
  }

  // Middleware already blocked unauthenticated users — render shell
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: '24px 28px' }}
        >
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
