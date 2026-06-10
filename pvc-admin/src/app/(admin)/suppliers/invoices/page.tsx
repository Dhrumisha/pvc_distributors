'use client';
// src/app/(admin)/suppliers/invoices/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { purchaseInvoiceService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FileText, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';

const FMT = (n: any) => `₹${Number(n).toLocaleString('en-IN')}`;
const DATE = (x: any) => x ? new Date(x).toLocaleDateString('en-IN') : '—';

const STATUS_BADGE: Record<string, string> = {
  draft:           'badge-neutral',
  unpaid:          'badge-warning',
  partially_paid:  'badge-warning',
  paid:            'badge-success',
  overdue:         'badge-error',
  cancelled:       'badge-error',
};

const STATUS_OPTIONS = [
  { value: '',               label: 'All Statuses' },
  { value: 'draft',          label: 'Draft' },
  { value: 'unpaid',         label: 'Unpaid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid',           label: 'Paid' },
  { value: 'overdue',        label: 'Overdue' },
  { value: 'cancelled',      label: 'Cancelled' },
];

export default function SupplierInvoicesPage() {
  const [invoices,     setInvoices]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseInvoiceService.list({ page, limit: LIMIT, status: statusFilter || undefined });
      setInvoices(res.data.data?.invoices || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Supplier Invoices</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} invoices</p>
        </div>
        <Link href="/suppliers/invoices/new" className="btn-primary">
          <Plus size={14} /> Record Supplier Invoice
        </Link>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input" style={{ width: 'auto', minWidth: 190 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {statusFilter && (
          <button className="btn-icon" onClick={() => setStatusFilter('')}><X size={13} /></button>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Supplier</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th>Total Amount</th>
                <th>Paid</th>
                <th>Balance Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state py-12">
                    <FileText size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No supplier invoices found</p>
                    <p className="empty-state-desc">Supplier invoices will appear here once created.</p>
                  </div>
                </td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id}>
                  <td>
                    <div className="td-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      {inv.invoice_number || `INV-${inv.id}`}
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{inv.supplier_name || '—'}</td>
                  <td style={{ fontSize: 12 }}>{DATE(inv.invoice_date)}</td>
                  <td style={{ fontSize: 12 }}>{DATE(inv.due_date)}</td>
                  <td style={{ fontWeight: 600 }}>{FMT(inv.total_amount ?? 0)}</td>
                  <td style={{ fontSize: 13, color: 'var(--success)' }}>{FMT(inv.paid_amount ?? 0)}</td>
                  <td style={{ fontWeight: 600, color: Number(inv.balance_due) > 0 ? 'var(--error)' : undefined }}>
                    {FMT(inv.balance_due ?? 0)}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[inv.status] || 'badge-neutral'}`}>
                      {inv.status?.replace(/_/g, ' ') || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
            <div className="flex gap-1">
              <button className="btn-icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width: 30, height: 30, borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid', cursor: 'pointer', background: page === p ? 'var(--accent-muted)' : 'transparent', color: page === p ? 'var(--accent)' : 'var(--text-muted)', borderColor: page === p ? 'var(--accent-border)' : 'var(--border-default)' }}>{p}</button>
              ))}
              <button className="btn-icon" disabled={page === pages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
