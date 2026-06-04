'use client';
// src/app/(admin)/admin/users/page.tsx
// Admin-only: list users, invite new users, manage roles.
// No self-signup — users are ONLY created by super admin here.
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { userService, roleService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import {
  Plus, Search, Edit2, Trash2, X, UserPlus, Mail,
  ChevronLeft, ChevronRight, ShieldCheck, RefreshCw,
  ToggleLeft, ToggleRight, Send,
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_active: number;
  status: string;
  last_login_at?: string;
  roles?: { id: number; name: string }[];
}

interface Role { id: number; name: string; slug: string; }

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge-success', INACTIVE: 'badge-neutral', INVITED: 'badge-warning',
};

export default function UsersPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { hasRole, user: currentUser } = useAuth();
  const isAdmin = hasRole('Admin');

  const [users,    setUsers]    = useState<User[]>([]);
  const [roles,    setRoles]    = useState<Role[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [showModal,setShowModal]= useState(searchParams.get('invite') === 'true');
  const [saving,   setSaving]   = useState(false);
  const [resending,setResending]= useState<number|null>(null);
  const [toggling, setToggling] = useState<number|null>(null);
  const [deleting, setDeleting] = useState<number|null>(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', role_ids: [] as number[],
  });
  const [formError, setFormError] = useState('');
  const LIMIT = 20;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.list({ page, limit: LIMIT, search: search || undefined });
      setUsers(res.data.data?.users || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => {
    roleService.list().then(r => setRoles(r.data.data?.roles || r.data.data || [])).catch(() => {});
  }, []);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) { router.replace('/dashboard'); }
  }, [isAdmin, router]);

  const resetForm = () => { setForm({ name:'', email:'', phone:'', role_ids:[] }); setFormError(''); };

  const handleInvite = async () => {
    if (!form.name.trim())  { setFormError('Name is required.'); return; }
    if (!form.email.trim()) { setFormError('Email is required.'); return; }
    if (form.role_ids.length === 0) { setFormError('Assign at least one role.'); return; }
    setSaving(true); setFormError('');
    try {
      await userService.create(form); // backend sends invite email with set-password link
      setShowModal(false);
      resetForm();
      loadUsers();
      // Redirect to invite-sent confirmation page
      router.push(`/auth/invite-sent?email=${encodeURIComponent(form.email)}&name=${encodeURIComponent(form.name)}`);
    } catch (e) {
      setFormError(getApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (u: User) => {
    setToggling(u.id);
    try {
      await userService.setStatus(u.id, u.is_active ? 'INACTIVE' : 'ACTIVE');
      toast.success(u.is_active ? 'User deactivated' : 'User activated');
      loadUsers();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setToggling(null); }
  };

  const handleResendInvite = async (u: User) => {
    setResending(u.id);
    try {
      await userService.resendInvite(u.id);
      toast.success(`Invite resent to ${u.email}`);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setResending(null); }
  };

  const handleDelete = async (u: User) => {
    if (u.id === currentUser?.id) { toast.error("You can't delete your own account."); return; }
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    setDeleting(u.id);
    try {
      await userService.remove(u.id);
      toast.success('User deleted');
      loadUsers();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setDeleting(null); }
  };

  const toggleRole = (id: number) =>
    setForm(f => ({
      ...f,
      role_ids: f.role_ids.includes(id)
        ? f.role_ids.filter(r => r !== id)
        : [...f.role_ids, id],
    }));

  const pages = Math.ceil(total / LIMIT);

  if (!isAdmin) return null;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">User Management</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {total} users · Invite-only — no self-signup
          </p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <UserPlus size={15} /> Invite User
        </button>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}
      >
        <ShieldCheck size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: 'var(--accent)', lineHeight: 1.5 }}>
          <strong>Invite-only system.</strong> Users cannot sign up themselves.
          Use the <em>Invite User</em> button to create an account — the user will receive
          an email with a secure link to set their own password.
        </div>
      </div>

      {/* Search */}
      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 30 }}
            placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {search && (
          <button className="btn-icon" onClick={() => setSearch('')}><X size={13} /></button>
        )}
        <button className="btn-icon" onClick={loadUsers} title="Refresh">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className="empty-state py-12">
                    <UserPlus size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No users found</p>
                    <p className="empty-state-desc">Invite your first team member to get started.</p>
                    <button className="btn-primary mt-3" onClick={() => { resetForm(); setShowModal(true); }}>
                      <UserPlus size={14} /> Invite User
                    </button>
                  </div>
                </td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                          {u.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="td-primary flex items-center gap-1.5">
                          {u.name}
                          {u.id === currentUser?.id && (
                            <span className="badge badge-accent" style={{ fontSize: 10 }}>You</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.length ? u.roles.map(r => (
                        <span key={r.id} className="badge badge-neutral" style={{ fontSize: 10 }}>
                          {r.name}
                        </span>
                      )) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[u.status] || 'badge-neutral'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
                      : <span style={{ color: 'var(--warning)', fontSize: 11 }}>Never logged in</span>
                    }
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {/* Resend invite (only for users who haven't logged in) */}
                      {!u.last_login_at && u.id !== currentUser?.id && (
                        <button className="btn-icon"
                          style={{ color: 'var(--info)' }}
                          onClick={() => handleResendInvite(u)}
                          disabled={resending === u.id}
                          title="Resend invite email"
                        >
                          {resending === u.id
                            ? <div className="spinner" style={{ width: 12, height: 12 }} />
                            : <Send size={13} />}
                        </button>
                      )}

                      {/* Toggle active/inactive */}
                      {u.id !== currentUser?.id && (
                        <button
                          className="btn-icon"
                          style={{ color: u.is_active ? 'var(--success)' : 'var(--text-muted)' }}
                          onClick={() => handleToggleStatus(u)}
                          disabled={toggling === u.id}
                          title={u.is_active ? 'Deactivate user' : 'Activate user'}
                        >
                          {toggling === u.id
                            ? <div className="spinner" style={{ width: 12, height: 12 }} />
                            : u.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                      )}

                      {/* Edit */}
                      <Link href={`/admin/users/${u.id}`} className="btn-icon" title="Edit user">
                        <Edit2 size={13} />
                      </Link>

                      {/* Delete */}
                      {u.id !== currentUser?.id && (
                        <button className="btn-icon"
                          style={{ color: 'var(--error)' }}
                          onClick={() => handleDelete(u)}
                          disabled={deleting === u.id}
                          title="Delete user"
                        >
                          {deleting === u.id
                            ? <div className="spinner" style={{ width: 12, height: 12 }} />
                            : <Trash2 size={13} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}
            </p>
            <div className="flex gap-1">
              <button className="btn-icon" disabled={page===1} onClick={() => setPage(p=>p-1)}><ChevronLeft size={14}/></button>
              {Array.from({ length: Math.min(5,pages) }, (_,i) => i+1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width:30,height:30,borderRadius:6,fontSize:12,fontWeight:600,border:'1px solid',cursor:'pointer',background:page===p?'var(--accent-muted)':'transparent',color:page===p?'var(--accent)':'var(--text-muted)',borderColor:page===p?'var(--accent-border)':'var(--border-default)' }}>{p}</button>
              ))}
              <button className="btn-icon" disabled={page===pages} onClick={() => setPage(p=>p+1)}><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Invite User Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); resetForm(); }}}
        >
          <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}>
                  <UserPlus size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h2 className="section-title">Invite User</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                    They'll receive a set-password email link
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => { setShowModal(false); resetForm(); }}>
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="input" placeholder="e.g. Rahul Sharma"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }} />
                  <input type="email" className="input" placeholder="user@company.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    style={{ paddingLeft: 32 }} />
                </div>
                <span className="form-hint">
                  A set-password link will be sent to this address.
                </span>
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">Phone <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
                <input className="input" placeholder="+91 98xxxxxxxx"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>

              {/* Roles */}
              <div className="form-group">
                <label className="form-label">Assign Roles *</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {roles.map(r => {
                    const selected = form.role_ids.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRole(r.id)}
                        style={{
                          padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                          background: selected ? 'var(--accent-muted)' : 'transparent',
                          color: selected ? 'var(--accent)' : 'var(--text-muted)',
                          borderColor: selected ? 'var(--accent-border)' : 'var(--border-default)',
                        }}
                      >
                        {selected && '✓ '}{r.name}
                      </button>
                    );
                  })}
                </div>
                <span className="form-hint">Click to select one or more roles.</span>
              </div>
            </div>

            {/* Error */}
            {formError && (
              <div className="mt-4 p-3 rounded-lg animate-fade-in"
                style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: 'var(--error)' }}>
                ⚠ {formError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1"
                onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </button>
              <button className="btn-primary flex-1" onClick={handleInvite} disabled={saving}>
                {saving
                  ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Sending invite…</span>
                  : <><Send size={14} /> Send Invite</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
