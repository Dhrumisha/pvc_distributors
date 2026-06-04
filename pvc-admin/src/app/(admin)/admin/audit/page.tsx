'use client';
// src/app/(admin)/admin/audit/page.tsx
// Admin-only: read-only audit log viewer with action/module filters.
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auditService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import {
  ClipboardList, Search, X, ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';

const ACTION_BADGE: Record<string, string> = {
  create: 'badge-success',
  update: 'badge-info',
  delete: 'badge-error',
  login:  'badge-accent',
  logout: 'badge-neutral',
  view:   'badge-neutral',
};

const LIMIT = 30;

export default function AuditLogsPage() {
  const router   = useRouter();
  const { hasRole } = useAuth();
  const isAdmin  = hasRole('Admin');

  const [logs,         setLogs]         = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  // ── Admin guard ──────────────────────────────────────────────────────────────
  useEffect(() => { if (!isAdmin) router.replace('/dashboard'); }, [isAdmin, router]);
  if (!isAdmin) return null;

  // ── Data loading ─────────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditService.list({
        page,
        limit: LIMIT,
        action: actionFilter || undefined,
        module: moduleFilter || undefined,
      });
      setLogs(res.data.data?.logs || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, actionFilter, moduleFilter]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { load(); }, [load]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { setPage(1); }, [actionFilter, moduleFilter]);

  const clearFilters = () => { setActionFilter(''); setModuleFilter(''); };
  const hasFilters   = actionFilter || moduleFilter;
  const pages        = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {total} log entries · read-only
          </p>
        </div>
        <button className="btn-icon" onClick={load} disabled={loading} title="Refresh">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 30 }}
            placeholder="Filter by action…"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          />
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 30 }}
            placeholder="Filter by module…"
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
          />
        </div>
        {hasFilters && (
          <button className="btn-icon" onClick={clearFilters} title="Clear filters">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Record ID</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="spinner mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state py-12">
                      <ClipboardList size={32} className="empty-state-icon" />
                      <p className="empty-state-title">No audit logs found</p>
                      <p className="empty-state-desc">
                        {hasFilters ? 'Try adjusting your filters.' : 'Activity will appear here once actions are performed.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : logs.map((log: any) => (
                <tr key={log.id}>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : '—'}
                  </td>
                  <td>
                    <div className="td-primary">{log.user_name || '—'}</div>
                    {log.user_email && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {log.user_email}
                      </div>
                    )}
                  </td>
                  <td>
                    {log.action
                      ? <span className={`badge ${ACTION_BADGE[log.action?.toLowerCase()] || 'badge-neutral'}`}>
                          {log.action}
                        </span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{log.module || '—'}</div>
                    {log.table_name && log.table_name !== log.module && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                        {log.table_name}
                      </div>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {log.record_id ?? '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {log.ip_address || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
