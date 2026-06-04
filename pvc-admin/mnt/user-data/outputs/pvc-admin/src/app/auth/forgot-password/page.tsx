'use client';
// src/app/auth/forgot-password/page.tsx
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSubmitted(true);
    } catch (err) {
      // Show the real server error (e.g. "SMTP not configured")
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={submitted ? 'Check your email' : 'Forgot password?'}
      subtitle={
        submitted
          ? `We sent a reset link to ${email}`
          : "Enter your email and we'll send you a reset link."
      }
    >
      {submitted ? (
        <div className="space-y-5 animate-fade-in">
          {/* Success icon */}
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto"
            style={{ background: 'var(--success-bg)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <CheckCircle size={28} style={{ color: 'var(--success)' }} />
          </div>

          {/* Info */}
          <div
            className="p-4 rounded-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}
          >
            <p>A password reset link was sent to:</p>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{email}</p>
            <p style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 12 }}>
              The link expires in <strong style={{ color: 'var(--text-secondary)' }}>1 hour</strong>.
              Check your spam / junk folder if you don't see it.
            </p>
          </div>

          <button
            onClick={() => { setSubmitted(false); setEmail(''); }}
            className="btn-secondary w-full"
          >
            Try a different email
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link href="/auth/login"
              style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={13} /> Back to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
                required
                style={{ paddingLeft: 34 }}
              />
            </div>
          </div>

          {/* Error — shows real server errors like missing SMTP config */}
          {error && (
            <div
              className="p-3 rounded-lg animate-fade-in"
              style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: 'var(--error)', lineHeight: 1.5 }}
            >
              ⚠ {error}
              {/* Hint if SMTP is not configured */}
              {error.toLowerCase().includes('smtp') && (
                <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  Ask your developer to set <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 4 }}>SMTP_USER</code> and{' '}
                  <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 4 }}>SMTP_PASS</code> in the backend <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 4 }}>.env</code> file.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            style={{ padding: '11px 20px', fontSize: 15 }}
            disabled={loading}
          >
            {loading
              ? <span className="flex items-center gap-2 justify-center"><span className="spinner" style={{ width: 16, height: 16 }} /> Sending…</span>
              : 'Send reset link'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link href="/auth/login"
              style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={13} /> Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
