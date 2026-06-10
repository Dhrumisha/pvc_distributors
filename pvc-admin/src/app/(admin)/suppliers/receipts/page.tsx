'use client';
// src/app/(admin)/suppliers/receipts/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { goodsReceiptService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { PackageCheck, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const DATE = (x: any) => x ? new Date(x).toLocaleDateString('en-IN') : '—';

const STATUS_BADGE: Record<string, string> = {
  pending:   'badge-warning',
  received:  'badge-success',
  partial:   'badge-warning',
  cancelled: 'badge-error',
};

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await goodsReceiptService.list({ page, limit: LIMIT });
      setReceipts(res.data.data?.receipts || res.data.data || []);
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
          <h1 className="page-title">Goods Receipts</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} goods receipts recorded</p>
        </div>
        <Link href="/suppliers/receipts/new" className="btn-primary">
          <Plus size={14} /> Receive Goods
        </Link>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Received Date</th>
                <th>Received By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : receipts.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state py-12">
                    <PackageCheck size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No goods receipts found</p>
                    <p className="empty-state-desc">Receipts are created when purchase orders are received.</p>
                  </div>
                </td></tr>
              ) : receipts.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="td-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>GR-{r.id}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.po_number || '—'}</td>
                  <td style={{ fontSize: 13 }}>{r.supplier_name || '—'}</td>
                  <td style={{ fontSize: 12 }}>{DATE(r.received_date)}</td>
                  <td style={{ fontSize: 12 }}>{r.received_by_name || '—'}</td>
                  <td>
                    {r.status ? (
                      <span className={`badge ${STATUS_BADGE[r.status] || 'badge-neutral'}`}>
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    ) : '—'}
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
