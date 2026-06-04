'use client';
// src/app/(admin)/admin/users/[id]/page.tsx
// Admin-only: edit a single user — details, active status, roles, resend invite, delete.
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { userService, roleService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, Trash2, Send, ShieldCheck, Mail, Phone, User as UserIcon,
} from 'lucide-react';

interface Role { id: number; name: string; slug: string; }
interface UserDetail {
  id: number; name: string; email: string; phone?: string;
  is_active: number; status: string; must_set_password?: boolean;
  last_login_at?: string; created_at?: string;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge-success', INACTIVE: 'badge-neutral', INVITED: 'badge-warning',
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = Number(params.id);
  const { hasRole, user: currentUser } = useAuth();
  const isAdmin = hasRole('Admin');

  const [user,    setUser]    = useState<UserDetail | null>(null);
  const [allRoles,setAllRoles]= useState<Role[]>([]);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [resending, setResending] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', is_active: 1 });

  const isSelf = currentUser?.id === userId;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        userService.get(userId),
        roleService.list(),
      ]);
      const u: UserDetail = uRes.data.data?.user || uRes.data.data;
      const uRoles: Role[] = uRes.data.data?.roles || [];
      setUser(u);
      setForm({ name: u.name || '', phone: u.phone || '', is_active: u.is_active });
      setRoleIds(uRoles.map(r => r.id));
      setAllRoles(rRes.data.data?.roles || rRes.data.data || []);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { if (userId) load(); }, [userId, load]);
  useEffect(() => { if (!isAdmin) router.replace('/dashboard'); }, [isAdmin, router]);

  const toggleRole = (id: number) =>
    setRoleIds(ids => ids.includes(id) ? ids.filter(r => r !== id) : [...ids, id]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required.'); return; }
    if (roleIds.length === 0) { toast.error('Assign at least one role.'); return; }
    setSaving(true);
    try {
      await userService.update(userId, {
        name: form.name.trim(),
        phone: form.phone || null,
        is_active: form.is_active,
      });
      await userService.assignRoles(userId, roleIds);
      toast.success('User updated');
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await userService.resendInvite(userId);
      toast.success(`Invite resent to ${user?.email}`);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setResending(false); }
  };

  const handleDelete = async () => {
    if (isSelf) { toast.error("You can't delete your own account."); return; }
    if (!confirm(`Delete ${user?.name}? This cannot be undone.`)) return;
    try {
      await userService.remove(userId);
      toast.success('User deleted');
      router.push('/admin/users');
    } catch (e) { toast.error(getApiError(e)); }
  };

  if (!isAdmin) return null;

  if (loading) {
    return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  }
  if (!user) {
    return (
      <div className="empty-state py-20">
        <p className="empty-state-title">User not found</p>
        <Link href="/admin/users" className="btn-secondary mt-3"><ArrowLeft size={14} /> Back to Users</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-up" style={{ maxWidth: 720 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/users" className="btn-icon"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="page-title">{user.name}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{user.email}</span>
              {isSelf && <span className="badge badge-accent" style={{ fontSize: 10, marginLeft: 8 }}>You</span>}
            </p>
          </div>
        </div>
        <span className={`badge ${STATUS_BADGE[user.status] || 'badge-neutral'}`}>{user.status}</span>
      </div>

      {/* Details card */}
      <div className="card p-6 space-y-4">
        <h2 className="section-title mb-1">Profile</h2>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <div className="relative">
            <UserIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 32 }}
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email <span style={{ color: 'var(--text-muted)' }}>(cannot be changed)</span></label>
          <div className="relative">
            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 32, opacity: 0.6 }} value={user.email} disabled />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <div className="relative">
            <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 32 }} placeholder="+91 98xxxxxxxx"
              value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>

        {/* Active toggle */}
        <div className="form-group">
          <label className="form-label">Account Status</label>
          <div className="flex gap-2">
            <button type="button" className={form.is_active ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setForm(f => ({ ...f, is_active: 1 }))}
              disabled={isSelf} style={{ flex: 1, opacity: isSelf ? 0.6 : 1 }}>Active</button>
            <button type="button" className={!form.is_active ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setForm(f => ({ ...f, is_active: 0 }))}
              disabled={isSelf} style={{ flex: 1, opacity: isSelf ? 0.6 : 1 }}>Inactive</button>
          </div>
          {isSelf && <span className="form-hint">You cannot deactivate your own account.</span>}
        </div>
      </div>

      {/* Roles card */}
      <div className="card p-6">
        <h2 className="section-title mb-1 flex items-center gap-2"><ShieldCheck size={15} style={{ color: 'var(--accent)' }} /> Roles</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Click to assign one or more roles.</p>
        <div className="flex flex-wrap gap-2">
          {allRoles.map(r => {
            const selected = roleIds.includes(r.id);
            return (
              <button key={r.id} type="button" onClick={() => toggleRole(r.id)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                  background: selected ? 'var(--accent-muted)' : 'transparent',
                  color: selected ? 'var(--accent)' : 'var(--text-muted)',
                  borderColor: selected ? 'var(--accent-border)' : 'var(--border-default)',
                }}>
                {selected && '✓ '}{r.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Invite resend (for users who never logged in) */}
      {!user.last_login_at && (
        <div className="card p-4 flex items-center justify-between">
          <div>
            <div className="td-primary" style={{ fontSize: 13 }}>Invite pending</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              This user hasn’t set their password yet. Resend the set-password email.
            </p>
          </div>
          <button className="btn-secondary" onClick={handleResend} disabled={resending}>
            {resending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><Send size={14} /> Resend Invite</>}
          </button>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between">
        {!isSelf ? (
          <button className="btn-secondary" style={{ color: 'var(--error)' }} onClick={handleDelete}>
            <Trash2 size={14} /> Delete User
          </button>
        ) : <span />}
        <div className="flex gap-3">
          <Link href="/admin/users" className="btn-secondary">Cancel</Link>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</span> : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
