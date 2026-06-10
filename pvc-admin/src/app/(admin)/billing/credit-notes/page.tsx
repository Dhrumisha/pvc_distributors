'use client';
// src/app/(admin)/billing/credit-notes/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { creditNoteService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FileText, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';

const FMT  = (n: any) => `₹${Number(n).toLocaleString('en-IN')}`;
const DATE = (x: any) => x ? new Date(x).toLocaleDateString('en-IN') : '—';

const STATUS_BADGE: Record<string, string> = {
  draft:    'badge-neutral',
  issued:   'badge-info',
  applied:  'badge-success',
  cancelled:'badge-error',
};

const LIMIT = 20;

export default function CreditNotesPage() {
  const [rows,         setRows]         = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await creditNoteService.list({ page, limit: LIMIT, status: statusFilter || undefined });
      setRows(res.data.data?.credit_notes || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Credit Notes</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} credit notes</p>
        </div>
        <Link href="/billing/credit-notes/new" className="btn-primary">
          <Plus size={14} /> New Credit Note
        </Link>
      </div>

      {/* Filter bar */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select
          className="input"
          style={{ width: 'auto', minWidth: 160 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="applied">Applied</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {statusFilter && (
          <button className="btn-icon" onClick={() => setStatusFilter('')}><X size={13} /></button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>CN Number</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className="empty-state py-12">
                    <FileText size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No credit notes found</p>
                    <p className="empty-state-desc">Credit notes will appear here once created from returns or adjustments.</p>
                  </div>
                </td></tr>
              ) : rows.map((cn: any) => (
                <tr key={cn.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {cn.cn_number || '—'}
                  </td>
                  <td>
                    <div className="td-primary">{cn.customer_name || '—'}</div>
                    {cn.invoice_number && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        Inv: {cn.invoice_number}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 13 }}>{DATE(cn.created_at)}</td>
                  <td style={{ fontWeight: 600 }}>{FMT(cn.total_amount ?? 0)}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[cn.status] || 'badge-neutral'}`}>
                      {cn.status || '—'}
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
                    color:      page === p ? 'var(--accent)'       : 'var(--text-muted)',
                    borderColor:page === p ? 'var(--accent-border)': 'var(--border-default)',
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
