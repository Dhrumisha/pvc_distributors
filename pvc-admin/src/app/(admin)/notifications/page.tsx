'use client';
// src/app/(admin)/notifications/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { notificationService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Bell, CheckCheck, Trash2, ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';

const TYPE_BADGE: Record<string, string> = {
  info:    'badge-info',
  success: 'badge-success',
  warning: 'badge-warning',
  error:   'badge-error',
  alert:   'badge-warning',
};

const LIMIT = 20;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [total,         setTotal]         = useState(0);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [markingAll,    setMarkingAll]    = useState(false);
  const [markingId,     setMarkingId]     = useState<number | null>(null);
  const [deletingId,    setDeletingId]    = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.list({ page, limit: LIMIT });
      setNotifications(res.data.data?.notifications || res.data.data || []);
      setUnreadCount(res.data.data?.unread_count ?? 0);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id: number) => {
    setMarkingId(id);
    try {
      await notificationService.markRead(id);
      toast.success('Notification marked as read');
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setMarkingId(null); }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      toast.success('All notifications marked as read');
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setMarkingAll(false); }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await notificationService.remove(id);
      toast.success('Notification deleted');
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setDeletingId(null); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {total} total
            {unreadCount > 0 && (
              <span style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 600 }}>
                · {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-icon"
            onClick={load}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          {unreadCount > 0 && (
            <button
              className="btn-primary"
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              {markingAll
                ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 13, height: 13 }} /> Marking…</span>
                : <><CheckCheck size={14} /> Mark all read</>}
            </button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Title / Message</th>
                <th>Type</th>
                <th>Status</th>
                <th>Received</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="spinner mx-auto" />
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state py-12">
                      <Bell size={32} className="empty-state-icon" />
                      <p className="empty-state-title">No notifications</p>
                      <p className="empty-state-desc">You are all caught up.</p>
                    </div>
                  </td>
                </tr>
              ) : notifications.map((n: any) => {
                const isUnread = !n.is_read;
                return (
                  <tr
                    key={n.id}
                    style={isUnread ? {
                      borderLeft: '3px solid var(--accent)',
                      background: 'var(--accent-muted)',
                    } : {}}
                  >
                    {/* unread dot */}
                    <td style={{ textAlign: 'center' }}>
                      {isUnread && (
                        <span style={{
                          display: 'inline-block', width: 8, height: 8,
                          borderRadius: '50%', background: 'var(--accent)',
                        }} />
                      )}
                    </td>
                    <td style={{ maxWidth: 420 }}>
                      <div className="td-primary" style={{ fontWeight: isUnread ? 600 : 400 }}>
                        {n.title || '—'}
                      </div>
                      {n.message && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {n.message}
                        </div>
                      )}
                    </td>
                    <td>
                      {n.type
                        ? <span className={`badge ${TYPE_BADGE[n.type] || 'badge-neutral'}`}>{n.type}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <span className={`badge ${isUnread ? 'badge-accent' : 'badge-neutral'}`}>
                        {isUnread ? 'Unread' : 'Read'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {isUnread && (
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--accent)' }}
                            onClick={() => handleMarkRead(n.id)}
                            disabled={markingId === n.id}
                            title="Mark as read"
                          >
                            {markingId === n.id
                              ? <span className="spinner" style={{ width: 12, height: 12 }} />
                              : <CheckCheck size={13} />}
                          </button>
                        )}
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--error)' }}
                          onClick={() => handleDelete(n.id)}
                          disabled={deletingId === n.id}
                          title="Delete"
                        >
                          {deletingId === n.id
                            ? <span className="spinner" style={{ width: 12, height: 12 }} />
                            : <Trash2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
