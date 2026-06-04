'use client';
// src/app/auth/invite-sent/page.tsx
// Shown after admin creates a new user — confirms invite email was sent.
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, Users } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

export default function InviteSentPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'the user';
  const name  = searchParams.get('name')  || '';

  return (
    <AuthShell
      title="Invite sent!"
      subtitle={`An email has been sent to ${email}`}
    >
      <div className="space-y-5">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto animate-fade-in"
          style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}>
          <Mail size={28} style={{ color: 'var(--accent)' }} />
        </div>

        {/* Detail card */}
        <div className="p-4 rounded-xl space-y-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
          {name && (
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Name</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{email}</span>
          </div>
          <div className="divider" />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {name || 'The user'} will receive an email with a link to set their password.
            The link expires in <strong style={{ color: 'var(--text-secondary)' }}>48 hours</strong>.
          </p>
        </div>

        {/* What happens next */}
        <div className="space-y-2">
          {[
            '1. User receives the invite email',
            '2. They click the link and create their password',
            '3. They can immediately sign in to the admin',
          ].map(s => (
            <div key={s} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: 'var(--accent)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/admin/users"
            className="btn-primary flex-1"
            style={{ textDecoration: 'none', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Users size={14} /> View users
          </Link>
          <Link href="/admin/users?invite=true"
            className="btn-secondary flex-1"
            style={{ textDecoration: 'none', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 7 }}>
            Invite another
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
