'use client';
// src/app/(admin)/inventory/batches/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { batchLotService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Package, X, ChevronLeft, ChevronRight,
} from 'lucide-react';

const LIMIT = 20;

export default function BatchLotsPage() {
  const [lots,       setLots]       = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [showModal,  setShowModal]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState({
    lot_number: '',
    product_dimension_id: '',
    supplier_id: '',
    quantity: '',
    manufacture_date: '',
    expiry_date: '',
    received_date: '',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await batchLotService.list({ page, limit: LIMIT });
      setLots(res.data.data?.lots || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const openAdd = () => {
    setForm({
      lot_number: '', product_dimension_id: '', supplier_id: '',
      quantity: '', manufacture_date: '', expiry_date: '', received_date: '', notes: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.lot_number.trim()) { toast.error('Lot number is required'); return; }
    if (!form.product_dimension_id.trim()) { toast.error('Product dimension ID is required'); return; }
    setSaving(true);
    try {
      const payload: any = {
        lot_number: form.lot_number.trim(),
        product_dimension_id: Number(form.product_dimension_id),
        quantity: form.quantity ? Number(form.quantity) : undefined,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : undefined,
        manufacture_date: form.manufacture_date || undefined,
        expiry_date: form.expiry_date || undefined,
        received_date: form.received_date || undefined,
        notes: form.notes || undefined,
      };
      await batchLotService.create(payload);
      toast.success('Batch lot created');
      setShowModal(false);
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  // Client-side search filter (backend doesn't support search on this endpoint)
  const filtered = search
    ? lots.filter(l =>
        (l.lot_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.supplier_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : lots;

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Batch &amp; Lots</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {total} lots recorded
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={15} /> New Batch
        </button>
      </div>

      {/* Search */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 30 }}
            placeholder="Search by lot number or supplier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <button className="btn-icon" onClick={() => setSearch('')}><X size={13} /></button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Lot Number</th>
                <th>Supplier</th>
                <th>Quantity</th>
                <th>Received Date</th>
                <th>Manufacture Date</th>
                <th>Expiry Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="spinner mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state py-12">
                      <Package size={32} className="empty-state-icon" />
                      <p className="empty-state-title">No batch lots found</p>
                      <p className="empty-state-desc">Create a batch lot to track incoming stock.</p>
                      <button className="btn-primary mt-3" onClick={openAdd}>
                        <Plus size={14} /> New Batch
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((l: any) => (
                <tr key={l.id}>
                  <td>
                    <div className="td-primary" style={{ fontFamily: 'var(--font-mono)' }}>{l.lot_number || '—'}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{l.supplier_name || '—'}</td>
                  <td style={{ fontWeight: 600 }}>
                    {l.quantity != null ? Number(l.quantity).toLocaleString('en-IN') : '—'}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {l.received_date ? new Date(l.received_date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {l.manufacture_date ? new Date(l.manufacture_date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {l.expiry_date ? new Date(l.expiry_date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200 }}>
                    {l.notes || '—'}
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
                >
                  {p}
                </button>
              ))}
              <button className="btn-icon" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="card w-full max-w-lg p-6 animate-slide-up overflow-y-auto"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">New Batch Lot</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Lot Number *</label>
                  <input
                    className="input"
                    placeholder="e.g. LOT-2025-001"
                    value={form.lot_number}
                    onChange={e => setForm(f => ({ ...f, lot_number: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Product Dimension ID *</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Dimension ID"
                    value={form.product_dimension_id}
                    onChange={e => setForm(f => ({ ...f, product_dimension_id: e.target.value }))}
                  />
                  <span className="form-hint">Numeric ID from the product dimensions table.</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Supplier ID</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Supplier ID"
                    value={form.supplier_id}
                    onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    placeholder="0"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">Received Date</label>
                  <input
                    type="date"
                    className="input"
                    value={form.received_date}
                    onChange={e => setForm(f => ({ ...f, received_date: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Manufacture Date</label>
                  <input
                    type="date"
                    className="input"
                    value={form.manufacture_date}
                    onChange={e => setForm(f => ({ ...f, manufacture_date: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    className="input"
                    value={form.expiry_date}
                    onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Optional remarks..."
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
                  : 'Create Batch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
