'use client';
// src/app/auth/login/page.tsx
import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getApiError } from '@/lib/api';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // If already authenticated, go to intended page or dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const from = searchParams.get('from') || '/dashboard';
      router.replace(from);
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      const { mustSetPassword } = await login(email, password);
      if (mustSetPassword) {
        // Newly invited user — must set a permanent password first
        router.push('/auth/set-password?required=true');
        return;
      }
      const from = searchParams.get('from') || '/dashboard';
      router.push(from);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || isAuthenticated) return null; // middleware will redirect

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your admin account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="form-group">
          <label className="form-label">Email address</label>
          <input
            type="email"
            className="input"
            placeholder="admin@pvcdistributor.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            required
          />
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{ paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Forgot link */}
        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
          >
            Forgot password?
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg animate-fade-in"
            style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: 'var(--error)' }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary w-full"
          style={{ marginTop: 4, padding: '11px 20px', fontSize: 15 }}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="spinner" style={{ width: 16, height: 16 }} />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              Sign in <ArrowRight size={16} />
            </span>
          )}
        </button>
      </form>

      {/* No self-signup notice */}
      <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>
        Don't have an account?{' '}
        <span style={{ color: 'var(--text-secondary)' }}>
          Contact your administrator to get invited.
        </span>
      </p>
    </AuthShell>
  );
}
