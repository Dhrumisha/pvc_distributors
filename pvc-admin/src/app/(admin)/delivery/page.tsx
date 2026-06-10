'use client';
// src/app/(admin)/delivery/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { deliveryService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Truck, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  scheduled:  'badge-warning',
  pending:    'badge-warning',
  packed:     'badge-warning',
  dispatched: 'badge-info',
  in_transit: 'badge-info',
  delivered:  'badge-success',
  cancelled:  'badge-error',
  failed:     'badge-error',
};

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [status,     setStatus]     = useState('');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryService.list({ page, limit: LIMIT, status: status || undefined });
      setDeliveries(res.data.data?.deliveries || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Deliveries</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} deliveries total</p>
        </div>
        <Link href="/delivery/new" className="btn-primary">
          <Plus size={14} /> New Delivery
        </Link>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select
          className="input"
          style={{ width: 'auto', minWidth: 160 }}
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="packed">Packed</option>
          <option value="dispatched">Dispatched</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {status && (
          <button className="btn-icon" onClick={() => setStatus('')}><X size={13} /></button>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Delivery #</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Scheduled Date</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : deliveries.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state py-12">
                    <Truck size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No deliveries found</p>
                    <p className="empty-state-desc">Try adjusting the status filter.</p>
                  </div>
                </td></tr>
              ) : deliveries.map((d: any) => (
                <tr key={d.id}>
                  <td>
                    <div className="td-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {d.delivery_number || '—'}
                    </div>
                  </td>
                  <td>
                    <div className="td-primary">{d.customer?.business_name || '—'}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {d.vehicle_number || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {d.scheduled_date ? new Date(d.scheduled_date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ fontSize: 12, textTransform: 'capitalize' }}>
                    {d.delivery_type?.replace(/_/g, ' ') || '—'}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[d.status] || 'badge-neutral'}`}>
                      {d.status?.replace(/_/g, ' ') || '—'}
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
    </div>
  );
}
