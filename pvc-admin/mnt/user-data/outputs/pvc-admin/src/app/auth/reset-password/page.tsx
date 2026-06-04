'use client';
// src/app/auth/reset-password/page.tsx
// User arrives here via link: /auth/reset-password?token=<TOKEN>
import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

type PageState = 'verifying' | 'valid' | 'invalid' | 'submitting' | 'success';

const RULES = [
  { label: 'At least 8 characters',          test: (p: string) => p.length >= 8 },
  { label: 'At least one uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'At least one lowercase letter',  test: (p: string) => /[a-z]/.test(p) },
  { label: 'At least one number',            test: (p: string) => /\d/.test(p) },
];

export default function ResetPasswordPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [state,    setState]    = useState<PageState>('verifying');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');

  // Verify token on mount
  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    authService.verifyToken(token, 'reset')
      .then(() => setState('valid'))
      .catch(() => setState('invalid'));
  }, [token]);

  const allRulesPassed = RULES.every(r => r.test(password));
  const passwordsMatch = password === confirm && confirm.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!allRulesPassed)   { setError('Password does not meet requirements.'); return; }
    if (!passwordsMatch)   { setError('Passwords do not match.'); return; }
    setState('submitting'); setError('');
    try {
      await authService.resetPassword(token, password);
      setState('success');
    } catch (err) {
      setError(getApiError(err));
      setState('valid');
    }
  };

  return (
    <AuthShell
      title={state === 'success' ? 'Password updated!' : 'Set new password'}
      subtitle={
        state === 'success'
          ? 'You can now sign in with your new password.'
          : 'Choose a strong password for your account.'
      }
    >
      {/* Verifying */}
      {state === 'verifying' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Verifying your link…</p>
        </div>
      )}

      {/* Invalid / expired token */}
      {state === 'invalid' && (
        <div className="space-y-5">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto"
            style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle size={26} style={{ color: 'var(--error)' }} />
          </div>
          <div
            className="p-4 rounded-lg text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}
          >
            This reset link is <strong style={{ color: 'var(--error)' }}>invalid or has expired</strong>.
            Reset links are valid for 1 hour.
          </div>
          <Link href="/auth/forgot-password" className="btn-primary w-full"
            style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', padding: '11px 20px' }}>
            Request a new link
          </Link>
        </div>
      )}

      {/* Success */}
      {state === 'success' && (
        <div className="space-y-5">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto animate-fade-in"
            style={{ background: 'var(--success-bg)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <CheckCircle size={28} style={{ color: 'var(--success)' }} />
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
            Your password has been updated. You can now sign in.
          </p>
          <button
            className="btn-primary w-full"
            style={{ padding: '11px 20px' }}
            onClick={() => router.push('/auth/login')}
          >
            Go to sign in
          </button>
        </div>
      )}

      {/* Form (valid / submitting) */}
      {(state === 'valid' || state === 'submitting') && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New password */}
          <div className="form-group">
            <label className="form-label">New password</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPwd ? 'text' : 'password'}
                className="input"
                placeholder="Choose a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                style={{ paddingLeft: 32, paddingRight: 42 }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Strength rules */}
            {password.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                {RULES.map(rule => (
                  <div key={rule.label}
                    className="flex items-center gap-1.5"
                    style={{ fontSize: 11, color: rule.test(password) ? 'var(--success)' : 'var(--text-muted)' }}
                  >
                    <span style={{ fontSize: 14, lineHeight: 1 }}>
                      {rule.test(password) ? '✓' : '○'}
                    </span>
                    {rule.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <input
              type={showPwd ? 'text' : 'password'}
              className="input"
              placeholder="Repeat your password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={{
                borderColor: confirm.length > 0
                  ? (passwordsMatch ? 'var(--success)' : 'var(--error)')
                  : undefined,
              }}
            />
            {confirm.length > 0 && !passwordsMatch && (
              <span className="form-error">Passwords don't match</span>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg animate-fade-in"
              style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: 'var(--error)' }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            style={{ padding: '11px 20px', fontSize: 15 }}
            disabled={state === 'submitting' || !allRulesPassed || !passwordsMatch}
          >
            {state === 'submitting'
              ? <span className="flex items-center gap-2 justify-center"><span className="spinner" style={{ width: 16, height: 16 }} /> Updating…</span>
              : 'Update password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
