'use client';
// src/app/(admin)/sales/quotations/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { quotationService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { FileText, ChevronLeft, ChevronRight, X, Search } from 'lucide-react';

const FMT = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

const STATUS_BADGE: Record<string, string> = {
  draft:     'badge-neutral',
  sent:      'badge-warning',
  approved:  'badge-success',
  rejected:  'badge-error',
  expired:   'badge-error',
  converted: 'badge-success',
};

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quotationService.list({
        page,
        limit: LIMIT,
        status: statusFilter || undefined,
      });
      setQuotations(res.data.data?.quotations || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const pages = Math.ceil(total / LIMIT);

  // Client-side search filter (quote_number / customer)
  const displayed = search
    ? quotations.filter(q =>
        (q.quotation_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (q.customer?.business_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : quotations;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {total} quotation{total !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 30 }}
            placeholder="Search by quote no. or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ width: 'auto', minWidth: 160 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
          <option value="converted">Converted</option>
        </select>
        {(search || statusFilter) && (
          <button className="btn-icon" onClick={() => { setSearch(''); setStatusFilter(''); }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Quote No.</th>
                <th>Customer</th>
                <th>Quote Date</th>
                <th>Valid Until</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : displayed.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state py-12">
                    <FileText size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No quotations found</p>
                    <p className="empty-state-desc">
                      {statusFilter ? 'Try a different status filter.' : 'No quotations have been created yet.'}
                    </p>
                  </div>
                </td></tr>
              ) : displayed.map((q: any) => (
                <tr key={q.id}>
                  <td>
                    <div className="td-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      {q.quotation_number || `#${q.id}`}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{q.customer?.business_name || '—'}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {q.created_at ? new Date(q.created_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {q.valid_until ? new Date(q.valid_until).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }}>
                    {q.total_amount != null ? FMT(q.total_amount) : '—'}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[q.status] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                      {q.status || '—'}
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
