'use client';
// src/app/(admin)/delivery/routes/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { routeGroupService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, MapPin, ChevronLeft, ChevronRight, X,
} from 'lucide-react';

export default function RouteGroupsPage() {
  const [groups,    setGroups]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState<any | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({
    name:       '',
    trip_date:  '',
    notes:      '',
  });
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await routeGroupService.list({ page, limit: LIMIT });
      setGroups(res.data.data?.groups || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', trip_date: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (g: any) => {
    setEditing(g);
    setForm({
      name:      g.name      || '',
      trip_date: g.trip_date ? g.trip_date.slice(0, 10) : '',
      notes:     g.notes     || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload: any = {
        name:      form.name.trim(),
        trip_date: form.trip_date || undefined,
        notes:     form.notes    || undefined,
      };
      if (editing) {
        await routeGroupService.update(editing.id, payload);
        toast.success('Route group updated');
      } else {
        await routeGroupService.create(payload);
        toast.success('Route group created');
      }
      setShowModal(false);
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Route Groups</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} route groups</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> New Group</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Trip Date</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : groups.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state py-12">
                    <MapPin size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No route groups found</p>
                    <p className="empty-state-desc">Create a route group to organise deliveries by trip.</p>
                    <button className="btn-primary mt-3" onClick={openAdd}><Plus size={14} /> New Group</button>
                  </div>
                </td></tr>
              ) : groups.map((g: any) => (
                <tr key={g.id}>
                  <td>
                    <div className="td-primary">{g.name || '—'}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {g.trip_date ? new Date(g.trip_date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {g.vehicle_number || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <span className={`badge ${g.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                      {g.status || '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {g.created_at ? new Date(g.created_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button className="btn-icon" onClick={() => openEdit(g)} title="Edit">
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button className="btn-icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 30, height: 30, borderRadius: 6, fontSize: 12, fontWeight: 600,
                    border: '1px solid', cursor: 'pointer',
                    background: page === p ? 'var(--accent-muted)' : 'transparent',
                    color: page === p ? 'var(--accent)' : 'var(--text-muted)',
                    borderColor: page === p ? 'var(--accent-border)' : 'var(--border-default)',
                  }}
                >{p}</button>
              ))}
              <button className="btn-icon" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="card w-full max-w-md p-6 animate-slide-up overflow-y-auto"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">{editing ? 'Edit Route Group' : 'New Route Group'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  className="input"
                  placeholder="e.g. North Zone Morning Run"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Trip Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.trip_date}
                  onChange={e => setForm(f => ({ ...f, trip_date: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Any notes about this route..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                {saving
                  ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</span>
                  : (editing ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
