'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus, Leaf, BadgeCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    business_name: '',
    contact_person: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(v => ({ ...v, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/portal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message || 'Account created! Redirecting…');
        setTimeout(() => {
          router.push('/account');
          router.refresh();
        }, 1800);
      } else {
        setError(json.message || 'Could not create account. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #d1d5db',
    fontSize: 15, outline: 'none', fontFamily: 'inherit', color: 'var(--ink)',
    transition: 'border-color .15s', background: '#fff',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f7f9fb' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
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
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-.02em' }}>Create trade account</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 6px' }}>Join to access wholesale pricing &amp; invoicing.</p>

          {/* Info badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 10, padding: '10px 14px', marginBottom: 24, marginTop: 14 }}>
            <BadgeCheck size={17} color="var(--brand-700)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'var(--brand-700)', margin: 0, lineHeight: 1.55 }}>
              Trade pricing &amp; credit (Udhaar) unlock after we approve your account.
            </p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', color: '#dc2626', fontSize: 14, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid var(--brand-100)', borderRadius: 10, padding: '14px 16px', color: 'var(--brand-700)', fontSize: 15, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <BadgeCheck size={18} />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Business name */}
            <div>
              <label htmlFor="business_name" style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                Business name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="business_name"
                type="text"
                required
                value={form.business_name}
                onChange={update('business_name')}
                placeholder="e.g. Sharma Contractors"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>

            {/* Contact person */}
            <div>
              <label htmlFor="contact_person" style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                Contact person
              </label>
              <input
                id="contact_person"
                type="text"
                value={form.contact_person}
                onChange={update('contact_person')}
                placeholder="Your name"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                Email address <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={update('phone')}
                placeholder="+91 98765 43210"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                Password <span style={{ color: '#dc2626' }}>*</span>{' '}
                <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 13 }}>(min. 6 characters)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={update('password')}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 44 }}
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
              disabled={loading || !!successMsg}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '13px 22px', marginTop: 4, opacity: loading || successMsg ? 0.75 : 1 }}
            >
              <UserPlus size={17} />
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 14, color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link href="/account/login" style={{ color: 'var(--brand-700)', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
