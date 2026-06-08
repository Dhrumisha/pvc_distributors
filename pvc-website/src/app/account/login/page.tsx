'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn, Leaf } from 'lucide-react';

// Inner component reads searchParams safely inside Suspense
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.success) {
        router.push(from);
        router.refresh();
      } else {
        setError(json.message || 'Invalid email or password.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f7f9fb' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, var(--brand-800), var(--brand-600))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={22} color="#fff" strokeWidth={2} />
            </span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-.02em' }}>PVC Distributors</span>
          </Link>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>Customer Portal</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '36px 32px', borderRadius: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-.02em' }}>Sign in</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 28px' }}>Access your trade account &amp; orders.</p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', color: '#dc2626', fontSize: 14, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #d1d5db',
                  fontSize: 15, outline: 'none', fontFamily: 'inherit', color: 'var(--ink)',
                  transition: 'border-color .15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '11px 44px 11px 14px', borderRadius: 10, border: '1px solid #d1d5db',
                    fontSize: 15, outline: 'none', fontFamily: 'inherit', color: 'var(--ink)',
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
                  onBlur={e => (e.target.style.borderColor = '#d1d5db')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, lineHeight: 0 }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '13px 22px', marginTop: 4, opacity: loading ? 0.75 : 1 }}
            >
              <LogIn size={17} />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 14, color: 'var(--muted)' }}>
            New customer?{' '}
            <Link href="/account/register" style={{ color: 'var(--brand-700)', fontWeight: 700, textDecoration: 'none' }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f9fb' }}>
        <div style={{ color: 'var(--muted)', fontSize: 15 }}>Loading…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
