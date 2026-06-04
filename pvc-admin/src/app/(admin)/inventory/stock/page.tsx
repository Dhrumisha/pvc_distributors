'use client';
// src/app/(admin)/inventory/stock/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { stockService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Search, Layers, X, ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';

const LIMIT = 20;

export default function StockLedgerPage() {
  const [stock,   setStock]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stockService.list({ page, limit: LIMIT, search: search || undefined });
      setStock(res.data.data?.stock || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Stock Ledger</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {total} SKUs tracked
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 30 }}
            placeholder="Search by product name or SKU..."
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
                <th>Product</th>
                <th>SKU</th>
                <th>Dimension</th>
                <th>Unit</th>
                <th>Current Qty</th>
                <th>Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="spinner mx-auto" />
                  </td>
                </tr>
              ) : stock.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state py-12">
                      <Layers size={32} className="empty-state-icon" />
                      <p className="empty-state-title">No stock records found</p>
                      <p className="empty-state-desc">Add products with dimensions to track stock here.</p>
                    </div>
                  </td>
                </tr>
              ) : stock.map((s: any) => (
                <tr key={s.id}>
                  <td>
                    <div className="td-primary">{s.name}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.sku || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.dimension_label || '—'}</td>
                  <td style={{ fontSize: 12 }}>{s.unit || '—'}</td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: s.is_low ? 'var(--error)' : 'inherit',
                    }}>
                      {Number(s.current_qty ?? 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {s.low_stock_threshold != null
                      ? Number(s.low_stock_threshold).toLocaleString('en-IN')
                      : '—'}
                  </td>
                  <td>
                    {s.is_low ? (
                      <span className="badge badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={10} /> Low Stock
                      </span>
                    ) : (
                      <span className="badge badge-success">OK</span>
                    )}
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
    </div>
  );
}
