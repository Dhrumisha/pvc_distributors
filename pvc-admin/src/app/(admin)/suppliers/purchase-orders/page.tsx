'use client';
// src/app/(admin)/suppliers/purchase-orders/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { purchaseOrderService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ShoppingCart, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';

const FMT = (n: any) => `₹${Number(n).toLocaleString('en-IN')}`;
const DATE = (x: any) => x ? new Date(x).toLocaleDateString('en-IN') : '—';

const STATUS_BADGE: Record<string, string> = {
  draft:              'badge-neutral',
  sent:               'badge-info',
  approved:           'badge-success',
  received:           'badge-success',
  partially_received: 'badge-warning',
  cancelled:          'badge-error',
};

const STATUS_OPTIONS = [
  { value: '',                   label: 'All Statuses' },
  { value: 'draft',              label: 'Draft' },
  { value: 'sent',               label: 'Sent' },
  { value: 'approved',           label: 'Approved' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received',           label: 'Received' },
  { value: 'cancelled',          label: 'Cancelled' },
];

export default function PurchaseOrdersPage() {
  const [orders,       setOrders]       = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseOrderService.list({ page, limit: LIMIT, status: statusFilter || undefined });
      setOrders(res.data.data?.orders || res.data.data || []);
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
          <h1 className="page-title">Purchase Orders</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} purchase orders</p>
        </div>
        <Link href="/suppliers/purchase-orders/new" className="btn-primary">
          <Plus size={14} /> New Purchase Order
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
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Order Date</th>
                <th>Expected Delivery</th>
                <th>Total Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state py-12">
                    <ShoppingCart size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No purchase orders found</p>
                    <p className="empty-state-desc">Purchase orders will appear here once created.</p>
                  </div>
                </td></tr>
              ) : orders.map(o => (
                <tr key={o.id}>
                  <td>
                    <div className="td-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{o.po_number || '—'}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {o.supplier?.name || '—'}
                  </td>
                  <td style={{ fontSize: 12 }}>{DATE(o.order_date)}</td>
                  <td style={{ fontSize: 12 }}>{DATE(o.expected_delivery)}</td>
                  <td style={{ fontWeight: 600 }}>{FMT(o.total_amount ?? 0)}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[o.status] || 'badge-neutral'}`}>
                      {o.status?.replace(/_/g, ' ') || '—'}
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
