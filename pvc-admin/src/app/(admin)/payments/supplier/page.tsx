'use client';
// src/app/(admin)/payments/supplier/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { supplierPaymentService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Wallet, ChevronLeft, ChevronRight, X } from 'lucide-react';

const FMT  = (n: any) => `₹${Number(n).toLocaleString('en-IN')}`;
const DATE = (x: any) => x ? new Date(x).toLocaleDateString('en-IN') : '—';

const PAYMENT_MODES = ['neft', 'rtgs', 'cash', 'cheque', 'upi', 'card'];
const LIMIT = 20;

const EMPTY_FORM = {
  supplier_id:         '',
  purchase_invoice_id: '',
  amount:              '',
  mode:                'neft',
  payment_date:        '',
  reference_number:    '',
  notes:               '',
};

export default function SupplierPaymentsPage() {
  const [rows,      setRows]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({ ...EMPTY_FORM });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supplierPaymentService.list({ page, limit: LIMIT });
      setRows(res.data.data?.payments || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openModal = () => {
    setForm({ ...EMPTY_FORM, payment_date: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.supplier_id.trim())         { toast.error('Supplier ID is required'); return; }
    if (!form.purchase_invoice_id.trim()) { toast.error('Purchase Invoice ID is required'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      await supplierPaymentService.create({
        supplier_id:         Number(form.supplier_id),
        purchase_invoice_id: Number(form.purchase_invoice_id),
        amount:              Number(form.amount),
        mode:                form.mode,
        payment_date:        form.payment_date || new Date().toISOString().slice(0, 10),
        reference_number:    form.reference_number || undefined,
        notes:               form.notes || undefined,
      });
      toast.success('Payment recorded');
      setShowModal(false);
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Supplier Payments</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} payments recorded</p>
        </div>
        <button className="btn-primary" onClick={openModal}><Plus size={15} /> Record Payment</button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Supplier</th>
                <th>Purchase Invoice</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state py-12">
                    <Wallet size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No supplier payments yet</p>
                    <p className="empty-state-desc">Record payments made to suppliers against purchase invoices.</p>
                    <button className="btn-primary mt-3" onClick={openModal}><Plus size={14} /> Record Payment</button>
                  </div>
                </td></tr>
              ) : rows.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {p.reference_number || `#${p.id}`}
                  </td>
                  <td>
                    <div className="td-primary">{p.supplier_name || '—'}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {p.supplier_invoice_no || '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>{DATE(p.payment_date)}</td>
                  <td style={{ fontWeight: 600 }}>{FMT(p.amount ?? 0)}</td>
                  <td>
                    <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: 10 }}>
                      {p.mode || '—'}
                    </span>
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
                    background:  page === p ? 'var(--accent-muted)' : 'transparent',
                    color:       page === p ? 'var(--accent)'       : 'var(--text-muted)',
                    borderColor: page === p ? 'var(--accent-border)': 'var(--border-default)',
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

      {/* Record Payment Modal */}
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
              <h2 className="section-title">Record Supplier Payment</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Supplier ID *</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 3"
                    value={form.supplier_id}
                    onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Invoice ID *</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 7"
                    value={form.purchase_invoice_id}
                    onChange={e => setForm(f => ({ ...f, purchase_invoice_id: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="input"
                    value={form.mode}
                    onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                  >
                    {PAYMENT_MODES.map(m => (
                      <option key={m} value={m}>{m.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input
                    type="date"
                    className="input"
                    value={form.payment_date}
                    onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference Number</label>
                  <input
                    className="input"
                    placeholder="UTR / Cheque no."
                    value={form.reference_number}
                    onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
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
                  : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
