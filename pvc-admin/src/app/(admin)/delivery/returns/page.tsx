'use client';
// src/app/(admin)/delivery/returns/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { deliveryService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const CONDITION_BADGE: Record<string, string> = {
  good:    'badge-success',
  damaged: 'badge-error',
  unknown: 'badge-neutral',
};

const STOCK_ACTION_BADGE: Record<string, string> = {
  pending:    'badge-warning',
  restocked:  'badge-success',
  discarded:  'badge-error',
  quarantine: 'badge-info',
};

export default function DeliveryReturnsPage() {
  const [returns,  setReturns]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deliveryService.allReturns({ page, limit: LIMIT });
      setReturns(res.data.data?.returns || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Delivery Returns</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} returns recorded</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Delivery #</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Returned Qty</th>
                <th>Reason</th>
                <th>Condition</th>
                <th>Stock Action</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : returns.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state py-12">
                    <RotateCcw size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No delivery returns</p>
                    <p className="empty-state-desc">Returned items from deliveries will appear here.</p>
                  </div>
                </td></tr>
              ) : returns.map((r: any) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {r.delivery_number || '—'}
                    </div>
                  </td>
                  <td>
                    <div className="td-primary">{r.product_name || '—'}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {r.sku || '—'}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>
                    {r.returned_qty != null ? Number(r.returned_qty).toLocaleString('en-IN') : '—'}
                  </td>
                  <td style={{ fontSize: 12, maxWidth: 200 }}>
                    <span title={r.reason || ''}>{r.reason || '—'}</span>
                  </td>
                  <td>
                    <span className={`badge ${CONDITION_BADGE[r.condition] || 'badge-neutral'}`}>
                      {r.condition || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${STOCK_ACTION_BADGE[r.stock_action] || 'badge-neutral'}`}>
                      {r.stock_action?.replace(/_/g, ' ') || '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'}
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
