// src/components/auth/AuthShell.tsx
// Shared two-column layout shell for all auth pages.
// Left panel = branding. Right panel = form (children).
'use client';
import { Package, ShieldCheck, BarChart2, Truck, CreditCard } from 'lucide-react';

const FEATURES = [
  { icon: ShieldCheck, title: 'Role-Based Access',   desc: 'Each staff member sees only what they need' },
  { icon: BarChart2,   title: 'Live Dashboard',      desc: 'Real-time KPIs, revenue charts, low-stock alerts' },
  { icon: Truck,       title: 'End-to-End Delivery', desc: 'From purchase order to delivery confirmation' },
  { icon: CreditCard,  title: 'Payment Tracking',    desc: 'Ledger, aging, post-dated cheque reminders' },
];

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg-deepest)', fontFamily: 'var(--font-body)' }}
    >
      {/* ── Left branding panel ────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 flex-shrink-0"
        style={{
          width: '420px',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-default)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}
          >
            <Package size={20} color="#0a0c10" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              PVC Admin
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
              Distributor Management System
            </div>
          </div>
        </div>

        {/* Feature list */}
        <div className="space-y-6">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.03em' }}>
            Manage your entire distribution chain from one place
          </h2>
          {FEATURES.map(({ icon: Icon, title: t, desc }) => (
            <div key={t} className="flex items-start gap-3">
              <div
                className="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}
              >
                <Icon size={11} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} PVC Distributor Admin · All data encrypted in transit
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent)' }}>
              <Package size={18} color="#0a0c10" strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
              PVC Admin
            </span>
          </div>

          {/* Page heading */}
          <div className="mb-8">
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
