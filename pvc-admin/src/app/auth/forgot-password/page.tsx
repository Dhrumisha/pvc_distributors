'use client';
// src/app/auth/forgot-password/page.tsx
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
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
          ? `We've sent a reset link to ${email}`
          : 'Enter your email and we\'ll send you a reset link.'
      }
    >
      {submitted ? (
        <div className="space-y-5">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto animate-fade-in"
            style={{ background: 'var(--success-bg)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <CheckCircle size={28} style={{ color: 'var(--success)' }} />
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            If <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> is registered in
            our system, you'll receive a password reset link within a few minutes.
            Check your spam folder if you don't see it.
          </div>

          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setEmail('');
              setError('');
            }}
            className="btn-secondary w-full"
          >
            Send to a different email
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link
              href="/auth/login"
              style={{
                fontSize: 13,
                color: 'var(--accent)',
                textDecoration: 'none',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ArrowLeft size={13} /> Back to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
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

          {error && (
            <div
              className="p-3 rounded-lg animate-fade-in"
              style={{
                background: 'var(--error-bg)',
                border: '1px solid rgba(239,68,68,0.2)',
                fontSize: 13,
                color: 'var(--error)',
              }}
            >
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            style={{ padding: '11px 20px', fontSize: 15 }}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="spinner" style={{ width: 16, height: 16 }} /> Sending...
              </span>
            ) : (
              'Send reset link'
            )}
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link
              href="/auth/login"
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ArrowLeft size={13} /> Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
