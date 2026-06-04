'use client';
// src/app/(admin)/customers/price-lists/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { priceListService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Tag, Edit2, Trash2, X, CheckCircle, XCircle } from 'lucide-react';

export default function PriceListsPage() {
  const [lists,      setLists]     = useState<any[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [showModal,  setShowModal] = useState(false);
  const [editing,    setEditing]   = useState<any | null>(null);
  const [saving,     setSaving]    = useState(false);
  const [deleting,   setDeleting]  = useState<number | null>(null);
  const [form,       setForm]      = useState({
    name: '',
    customer_type: '',
    valid_from: '',
    valid_to: '',
    is_active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await priceListService.list();
      setLists(res.data.data?.price_lists || res.data.data || []);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', customer_type: '', valid_from: '', valid_to: '', is_active: true });
    setShowModal(true);
  };

  const openEdit = (pl: any) => {
    setEditing(pl);
    setForm({
      name: pl.name || '',
      customer_type: pl.customer_type || '',
      valid_from: pl.valid_from ? pl.valid_from.slice(0, 10) : '',
      valid_to: pl.valid_to ? pl.valid_to.slice(0, 10) : '',
      is_active: !!pl.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        customer_type: form.customer_type || undefined,
        valid_from: form.valid_from || undefined,
        valid_to: form.valid_to || undefined,
        is_active: form.is_active ? 1 : 0,
      };
      if (editing) {
        await priceListService.update(editing.id, payload);
        toast.success('Price list updated');
      } else {
        await priceListService.create(payload);
        toast.success('Price list created');
      }
      setShowModal(false);
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (pl: any) => {
    if (!confirm(`Delete price list "${pl.name}"? This cannot be undone.`)) return;
    setDeleting(pl.id);
    try {
      await priceListService.remove(pl.id);
      toast.success('Price list deleted');
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setDeleting(null); }
  };

  const TYPE_BADGE: Record<string, string> = {
    retail: 'badge-info',
    wholesale_a: 'badge-accent',
    wholesale_b: 'badge-warning',
    custom: 'badge-neutral',
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Price Lists</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {lists.length} active price {lists.length === 1 ? 'list' : 'lists'}
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> New Price List</button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Customer Type</th>
                <th>Valid From</th>
                <th>Valid To</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : lists.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state py-12">
                    <Tag size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No price lists yet</p>
                    <p className="empty-state-desc">Create a price list to assign custom pricing to customer types.</p>
                    <button className="btn-primary mt-3" onClick={openAdd}><Plus size={14} /> New Price List</button>
                  </div>
                </td></tr>
              ) : lists.map(pl => (
                <tr key={pl.id}>
                  <td>
                    <div className="td-primary">{pl.name}</div>
                  </td>
                  <td>
                    {pl.customer_type
                      ? <span className={`badge ${TYPE_BADGE[pl.customer_type] || 'badge-neutral'}`}>{pl.customer_type.replace('_', ' ')}</span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {pl.valid_from ? new Date(pl.valid_from).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {pl.valid_to ? new Date(pl.valid_to).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    {pl.is_active
                      ? <span className="badge badge-success"><CheckCircle size={10} style={{ marginRight: 4 }} />Active</span>
                      : <span className="badge badge-error"><XCircle size={10} style={{ marginRight: 4 }} />Inactive</span>}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button className="btn-icon" onClick={() => openEdit(pl)} title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--error)' }}
                        onClick={() => handleDelete(pl)}
                        disabled={deleting === pl.id}
                        title="Delete"
                      >
                        {deleting === pl.id
                          ? <div className="spinner" style={{ width: 12, height: 12 }} />
                          : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="card w-full max-w-md p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">{editing ? 'Edit Price List' : 'New Price List'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Wholesale A — FY 2025"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Type</label>
                <select
                  className="input"
                  value={form.customer_type}
                  onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))}
                >
                  <option value="">All / Unassigned</option>
                  <option value="retail">Retail</option>
                  <option value="wholesale_a">Wholesale A</option>
                  <option value="wholesale_b">Wholesale B</option>
                  <option value="custom">Custom</option>
                </select>
                <span className="form-hint">Optionally restrict this list to a specific customer type.</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Valid From</label>
                  <input
                    type="date"
                    className="input"
                    value={form.valid_from}
                    onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Valid To</label>
                  <input
                    type="date"
                    className="input"
                    value={form.valid_to}
                    onChange={e => setForm(f => ({ ...f, valid_to: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="input"
                  value={form.is_active ? '1' : '0'}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.value === '1' }))}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
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
