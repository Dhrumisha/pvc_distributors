'use client';
// src/app/(admin)/admin/roles/page.tsx
// Admin-only: list roles, create/edit/delete custom roles, and manage each
// role's permissions (grant/revoke per module-action).
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { roleService, moduleService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import {
  Plus, X, Edit2, Trash2, ShieldCheck, Lock, KeyRound, RefreshCw, Search,
} from 'lucide-react';

interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_system: number;
  status: string;
}
interface Module { id: number; code: string; label: string; sort_order: number; }
interface ModuleAction { id: number; module_id: number; action: string; label: string; }
interface GrantedPerm { id: number; module: string; action: string; }

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

export default function RolesPage() {
  const router = useRouter();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Admin');

  const [roles,   setRoles]   = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  // create / edit modal
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Role | null>(null);
  const [form,     setForm]     = useState({ name: '', slug: '', description: '' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving,   setSaving]   = useState(false);

  // permission editor
  const [permRole,    setPermRole]    = useState<Role | null>(null);
  const [modules,     setModules]     = useState<Module[]>([]);
  const [actionsByMod,setActionsByMod]= useState<Record<number, ModuleAction[]>>({});
  const [granted,     setGranted]     = useState<Record<string, number>>({}); // "module.action" -> mapping id
  const [permLoading, setPermLoading] = useState(false);
  const [savingPerm,  setSavingPerm]  = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roleService.list();
      setRoles(res.data.data?.roles || res.data.data || []);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);
  useEffect(() => { if (!isAdmin) router.replace('/dashboard'); }, [isAdmin, router]);

  // ── Create / Edit ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '' });
    setSlugTouched(false);
    setFormError('');
    setShowForm(true);
  };
  const openEdit = (r: Role) => {
    setEditing(r);
    setForm({ name: r.name, slug: r.slug, description: r.description || '' });
    setSlugTouched(true);
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Role name is required.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editing) {
        await roleService.update(editing.id, { name: form.name, description: form.description });
        toast.success('Role updated');
      } else {
        await roleService.create({
          name: form.name.trim(),
          slug: (form.slug || slugify(form.name)),
          description: form.description,
        });
        toast.success('Role created');
      }
      setShowForm(false);
      loadRoles();
    } catch (e) { setFormError(getApiError(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (r: Role) => {
    if (r.is_system) { toast.error('System roles cannot be deleted.'); return; }
    if (!confirm(`Delete role "${r.name}"? Users with only this role will lose its access.`)) return;
    try {
      await roleService.remove(r.id);
      toast.success('Role deleted');
      loadRoles();
    } catch (e) { toast.error(getApiError(e)); }
  };

  // ── Permission editor ────────────────────────────────────────────────────────
  const openPerms = async (r: Role) => {
    setPermRole(r);
    setPermLoading(true);
    try {
      // Load modules + their actions (once), and this role's granted perms.
      let mods = modules;
      let byMod = actionsByMod;
      if (!mods.length) {
        const mRes = await moduleService.list();
        mods = mRes.data.data?.modules || mRes.data.data || [];
        const actionsLists = await Promise.all(
          mods.map(m => moduleService.getActions(m.id).then(a => a.data.data?.actions || a.data.data || []))
        );
        byMod = {};
        mods.forEach((m, i) => { byMod[m.id] = actionsLists[i]; });
        setModules(mods);
        setActionsByMod(byMod);
      }
      await refreshGranted(r.id);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setPermLoading(false); }
  };

  const refreshGranted = async (roleId: number) => {
    const res = await roleService.getPermissions(roleId);
    const perms: GrantedPerm[] = res.data.data?.permissions || res.data.data || [];
    const map: Record<string, number> = {};
    perms.forEach(p => { map[`${p.module}.${p.action}`] = p.id; });
    setGranted(map);
  };

  const togglePerm = async (mod: Module, action: ModuleAction) => {
    if (!permRole || permRole.is_system) return;
    const key = `${mod.code}.${action.action}`;
    setSavingPerm(key);
    try {
      if (granted[key]) {
        await roleService.removePermission(permRole.id, granted[key]);
      } else {
        await roleService.addPermissions(permRole.id, [action.id]);
      }
      await refreshGranted(permRole.id);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSavingPerm(null); }
  };

  const setAllForModule = async (mod: Module, grant: boolean) => {
    if (!permRole || permRole.is_system) return;
    const acts = actionsByMod[mod.id] || [];
    setSavingPerm(`mod:${mod.id}`);
    try {
      if (grant) {
        const toAdd = acts.filter(a => !granted[`${mod.code}.${a.action}`]).map(a => a.id);
        if (toAdd.length) await roleService.addPermissions(permRole.id, toAdd);
      } else {
        const toRemove = acts.map(a => granted[`${mod.code}.${a.action}`]).filter(Boolean);
        await Promise.all(toRemove.map(pid => roleService.removePermission(permRole.id, pid as number)));
      }
      await refreshGranted(permRole.id);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSavingPerm(null); }
  };

  const grantedCount = Object.keys(granted).length;
  const filtered = roles.filter(r =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Roles &amp; Permissions</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {roles.length} roles · Manage what each role can access
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={15} /> New Role
        </button>
      </div>

      {/* Search */}
      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 30 }} placeholder="Search roles..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {search && <button className="btn-icon" onClick={() => setSearch('')}><X size={13} /></button>}
        <button className="btn-icon" onClick={loadRoles} title="Refresh">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className="empty-state py-12">
                    <ShieldCheck size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No roles found</p>
                    <p className="empty-state-desc">Create a role to start assigning permissions.</p>
                    <button className="btn-primary mt-3" onClick={openCreate}><Plus size={14} /> New Role</button>
                  </div>
                </td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}>
                        <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />
                      </div>
                      <div className="td-primary">{r.name}</div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{r.slug}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 320 }}>{r.description || '—'}</td>
                  <td>
                    {r.is_system
                      ? <span className="badge badge-neutral" style={{ fontSize: 10 }}><Lock size={9} style={{ marginRight: 3 }} />System</span>
                      : <span className="badge badge-accent" style={{ fontSize: 10 }}>Custom</span>}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button className="btn-icon" style={{ color: 'var(--accent)' }}
                        onClick={() => openPerms(r)} title="Manage permissions">
                        <KeyRound size={13} />
                      </button>
                      <button className="btn-icon" onClick={() => openEdit(r)}
                        disabled={!!r.is_system} title={r.is_system ? 'System role — cannot edit' : 'Edit role'}
                        style={{ opacity: r.is_system ? 0.4 : 1 }}>
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-icon" style={{ color: 'var(--error)', opacity: r.is_system ? 0.4 : 1 }}
                        onClick={() => handleDelete(r)} disabled={!!r.is_system}
                        title={r.is_system ? 'System role — cannot delete' : 'Delete role'}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create / Edit Modal ───────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">{editing ? 'Edit Role' : 'New Role'}</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Role Name *</label>
                <input className="input" placeholder="e.g. Regional Manager" autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({
                    ...f, name: e.target.value,
                    slug: slugTouched ? f.slug : slugify(e.target.value),
                  }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Slug {editing && <span style={{ color: 'var(--text-muted)' }}>(locked)</span>}</label>
                <input className="input" placeholder="regional_manager" disabled={!!editing}
                  value={form.slug}
                  onChange={e => { setSlugTouched(true); setForm(f => ({ ...f, slug: slugify(e.target.value) })); }}
                  style={{ fontFamily: 'var(--font-mono)', opacity: editing ? 0.6 : 1 }} />
                <span className="form-hint">Unique identifier used internally. {editing ? '' : 'Auto-filled from the name.'}</span>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="input" rows={2} placeholder="What can this role do?"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            {formError && (
              <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: 'var(--error)' }}>
                ⚠ {formError}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</span> : (editing ? 'Save Changes' : 'Create Role')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Permission Editor Drawer ──────────────────────────────────────────── */}
      {permRole && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setPermRole(null); }}>
          <div className="h-full w-full max-w-lg flex flex-col animate-slide-in"
            style={{ background: 'var(--bg-surface, #181c27)', borderLeft: '1px solid var(--border-default)' }}
            onClick={e => e.stopPropagation()}>
            {/* header */}
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}>
                  <KeyRound size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h2 className="section-title">{permRole.name} — Permissions</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                    {grantedCount} granted{permRole.is_system ? ' · read-only (system role)' : ''}
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setPermRole(null)}><X size={14} /></button>
            </div>

            {permRole.slug === 'admin' && (
              <div className="m-5 mb-0 p-3 rounded-lg" style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)', fontSize: 12, color: 'var(--accent)' }}>
                The Admin role bypasses all permission checks and always has full access.
              </div>
            )}

            {/* body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {permLoading ? (
                <div className="flex justify-center py-12"><div className="spinner" /></div>
              ) : modules.map(mod => {
                const acts = actionsByMod[mod.id] || [];
                const allOn = acts.length > 0 && acts.every(a => granted[`${mod.code}.${a.action}`]);
                const locked = !!permRole.is_system;
                return (
                  <div key={mod.id} className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="td-primary" style={{ fontSize: 13 }}>{mod.label}</div>
                      {!locked && (
                        <button className="btn-link" style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                          onClick={() => setAllForModule(mod, !allOn)}
                          disabled={savingPerm === `mod:${mod.id}`}>
                          {savingPerm === `mod:${mod.id}` ? '…' : (allOn ? 'Clear all' : 'Select all')}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {acts.map(a => {
                        const key = `${mod.code}.${a.action}`;
                        const on = !!granted[key];
                        const busy = savingPerm === key;
                        return (
                          <button key={a.id} type="button"
                            onClick={() => togglePerm(mod, a)}
                            disabled={locked || busy}
                            style={{
                              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                              border: '1px solid', cursor: locked ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s', textTransform: 'capitalize',
                              background: on ? 'var(--accent-muted)' : 'transparent',
                              color: on ? 'var(--accent)' : 'var(--text-muted)',
                              borderColor: on ? 'var(--accent-border)' : 'var(--border-default)',
                              opacity: locked ? 0.6 : 1,
                            }}>
                            {busy ? '…' : (on ? '✓ ' : '')}{a.action}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
