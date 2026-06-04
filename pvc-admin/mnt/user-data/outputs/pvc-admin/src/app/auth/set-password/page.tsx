'use client';
// src/app/auth/set-password/page.tsx
// Used in TWO scenarios:
//   1. Newly invited user — arrives via email link: /auth/set-password?token=<INVITE_TOKEN>
//   2. Logged-in user who still has must_set_password=true: /auth/set-password?required=true
import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthShell from '@/components/auth/AuthShell';

type PageState = 'verifying' | 'valid' | 'invalid' | 'submitting' | 'success';

const RULES = [
  { label: 'At least 8 characters',          test: (p: string) => p.length >= 8 },
  { label: 'At least one uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'At least one lowercase letter',  test: (p: string) => /[a-z]/.test(p) },
  { label: 'At least one number',            test: (p: string) => /\d/.test(p) },
];

export default function SetPasswordPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';
  const required     = searchParams.get('required') === 'true'; // logged-in forced case
  const { user, refreshUser, logout } = useAuth();

  const [state,    setState]    = useState<PageState>(required ? 'valid' : 'verifying');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');

  // Verify invite token (only for the invite flow, not the logged-in forced flow)
  useEffect(() => {
    if (required) return; // already logged in — skip token verification
    if (!token)   { setState('invalid'); return; }
    authService.verifyToken(token, 'invite')
      .then(() => setState('valid'))
      .catch(() => setState('invalid'));
  }, [token, required]);

  const allRulesPassed = RULES.every(r => r.test(password));
  const passwordsMatch = password === confirm && confirm.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!allRulesPassed) { setError('Password does not meet requirements.'); return; }
    if (!passwordsMatch) { setError('Passwords do not match.'); return; }
    setState('submitting'); setError('');
    try {
      if (required && user) {
        // Already logged in — use changePassword (current_password is the temp one from invite)
        // Backend should detect must_set_password and allow setting without old password
        await authService.setPassword('', password); // blank token = use session
      } else {
        await authService.setPassword(token, password);
      }
      setState('success');
      if (required) await refreshUser(); // refresh to clear must_set_password flag
    } catch (err) {
      setError(getApiError(err));
      setState('valid');
    }
  };

  const isInviteFlow = !required;

  return (
    <AuthShell
      title={
        state === 'success'
          ? 'Password set successfully!'
          : isInviteFlow
          ? 'Welcome! Set your password'
          : 'Set your password'
      }
      subtitle={
        state === 'success'
          ? isInviteFlow ? 'Your account is ready. Sign in to get started.' : 'You can now use your new password.'
          : isInviteFlow
          ? 'Your account has been created by an administrator. Choose a secure password to get started.'
          : 'You need to set a permanent password before continuing.'
      }
    >
      {/* Verifying */}
      {state === 'verifying' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Verifying your invite link…</p>
        </div>
      )}

      {/* Invalid token */}
      {state === 'invalid' && (
        <div className="space-y-5">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto"
            style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={26} style={{ color: 'var(--error)' }} />
          </div>
          <div className="p-4 rounded-lg text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This invite link is <strong style={{ color: 'var(--error)' }}>invalid or has expired</strong>.
            Please ask your administrator to resend the invite.
          </div>
          <button className="btn-secondary w-full" onClick={() => router.push('/auth/login')}>
            Go to sign in
          </button>
        </div>
      )}

      {/* Success */}
      {state === 'success' && (
        <div className="space-y-5">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto animate-fade-in"
            style={{ background: 'var(--success-bg)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <CheckCircle size={28} style={{ color: 'var(--success)' }} />
          </div>
          {isInviteFlow ? (
            <button className="btn-primary w-full" style={{ padding: '11px 20px' }}
              onClick={() => router.push('/auth/login')}>
              Sign in to your account
            </button>
          ) : (
            <button className="btn-primary w-full" style={{ padding: '11px 20px' }}
              onClick={() => router.push('/dashboard')}>
              Continue to dashboard
            </button>
          )}
        </div>
      )}

      {/* Form */}
      {(state === 'valid' || state === 'submitting') && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invite welcome badge */}
          {isInviteFlow && (
            <div className="flex items-center gap-3 p-3 rounded-lg mb-2"
              style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}>
              <Package size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                You've been invited by your administrator.
              </span>
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label className="form-label">
              {isInviteFlow ? 'Create your password' : 'New password'}
            </label>
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

            {password.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                {RULES.map(rule => (
                  <div key={rule.label} className="flex items-center gap-1.5"
                    style={{ fontSize: 11, color: rule.test(password) ? 'var(--success)' : 'var(--text-muted)' }}>
                    <span style={{ fontSize: 14, lineHeight: 1 }}>{rule.test(password) ? '✓' : '○'}</span>
                    {rule.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm */}
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

          <button type="submit" className="btn-primary w-full"
            style={{ padding: '11px 20px', fontSize: 15 }}
            disabled={state === 'submitting' || !allRulesPassed || !passwordsMatch}>
            {state === 'submitting'
              ? <span className="flex items-center gap-2 justify-center"><span className="spinner" style={{ width: 16, height: 16 }} /> Setting password…</span>
              : isInviteFlow ? 'Activate my account' : 'Set password & continue'}
          </button>

          {/* Invite flow: offer logout if they land here by accident */}
          {required && (
            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={logout}
                style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Sign out instead
              </button>
            </div>
          )}
        </form>
      )}
    </AuthShell>
  );
}
