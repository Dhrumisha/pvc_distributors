'use client';
// src/app/(admin)/sales/orders/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { salesOrderService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Eye, CheckCircle, XCircle, ShoppingCart,
  ChevronLeft, ChevronRight, X, Filter, Clock, Truck
} from 'lucide-react';
import Link from 'next/link';

interface SalesOrder {
  id: number;
  order_number: string;
  customer?: { business_name: string };
  status: string;
  order_date: string;
  total_amount: number;
  delivery_type: string;
  items_count?: number;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-neutral', confirmed: 'badge-info', processing: 'badge-warning',
  partially_dispatched: 'badge-warning', dispatched: 'badge-accent',
  delivered: 'badge-success', cancelled: 'badge-error',
};

const FMT = (n: number) => `₹${n?.toLocaleString('en-IN') || 0}`;

export default function SalesOrdersPage() {
  const [orders,    setOrders]    = useState<SalesOrder[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [actioning, setActioning] = useState<number | null>(null);
  const [showCancel, setShowCancel] = useState<{ id: number; num: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesOrderService.list({ page, limit: LIMIT, search: search || undefined, status: status || undefined });
      setOrders(res.data.data?.orders || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  const handleConfirm = async (id: number) => {
    setActioning(id);
    try {
      await salesOrderService.confirm(id);
      toast.success('Order confirmed — stock reserved');
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setActioning(null); }
  };

  const handleCancel = async () => {
    if (!showCancel || !cancelReason.trim()) { toast.error('Please enter a cancellation reason'); return; }
    setActioning(showCancel.id);
    try {
      await salesOrderService.cancel(showCancel.id, cancelReason);
      toast.success('Order cancelled');
      setShowCancel(null); setCancelReason(''); load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setActioning(null); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Sales Orders</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} orders total</p>
        </div>
        <Link href="/sales/orders/new" className="btn-primary" style={{ textDecoration: 'none' }}>
          <Plus size={15} /> New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 30 }} placeholder="Search by order # or customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 'auto', minWidth: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {['draft','confirmed','processing','partially_dispatched','dispatched','delivered','cancelled'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        {(search || status) && <button className="btn-icon" onClick={() => { setSearch(''); setStatus(''); }}><X size={13} /></button>}
      </div>

      {/* Quick status filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'Pending Confirmation', s: 'draft', icon: <Clock size={11} /> },
          { label: 'In Progress', s: 'processing', icon: <Filter size={11} /> },
          { label: 'Ready to Dispatch', s: 'confirmed', icon: <Truck size={11} /> },
        ].map(f => (
          <button key={f.s} onClick={() => setStatus(s => s === f.s ? '' : f.s)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: '1px solid',
              display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
              background: status === f.s ? 'var(--accent-muted)' : 'transparent',
              color:      status === f.s ? 'var(--accent)' : 'var(--text-muted)',
              borderColor:status === f.s ? 'var(--accent-border)' : 'var(--border-default)',
            }}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Delivery</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state py-12">
                    <ShoppingCart size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No orders found</p>
                    <Link href="/sales/orders/new" className="btn-primary mt-3" style={{ textDecoration: 'none' }}><Plus size={14} /> Create Order</Link>
                  </div>
                </td></tr>
              ) : orders.map(o => (
                <tr key={o.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                      {o.order_number}
                    </span>
                  </td>
                  <td className="td-primary">{o.customer?.business_name || '—'}</td>
                  <td style={{ fontSize: 12 }}>{o.order_date}</td>
                  <td>
                    <span className={`badge ${o.delivery_type === 'our_vehicle' ? 'badge-info' : 'badge-neutral'}`}>
                      {o.delivery_type === 'our_vehicle' ? '🚚 Ours' : '📦 Customer'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{FMT(o.total_amount)}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[o.status] || 'badge-neutral'}`}>
                      {o.status.replace(/_/g,' ')}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/sales/orders/${o.id}`} className="btn-icon" title="View"><Eye size={13} /></Link>
                      {o.status === 'draft' && (
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--success)', borderColor: 'rgba(34,197,94,0.25)' }}
                          onClick={() => handleConfirm(o.id)}
                          disabled={actioning === o.id}
                          title="Confirm order"
                        >
                          {actioning === o.id ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <CheckCircle size={13} />}
                        </button>
                      )}
                      {['draft','confirmed','processing'].includes(o.status) && (
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.25)' }}
                          onClick={() => setShowCancel({ id: o.id, num: o.order_number })}
                          title="Cancel order"
                        >
                          <XCircle size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}
            </p>
            <div className="flex gap-1">
              <button className="btn-icon" disabled={page===1} onClick={() => setPage(p=>p-1)}><ChevronLeft size={14}/></button>
              {Array.from({ length: Math.min(5,pages) }, (_,i) => i+1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width:30,height:30,borderRadius:6,fontSize:12,fontWeight:600,border:'1px solid',cursor:'pointer',
                    background:page===p?'var(--accent-muted)':'transparent',
                    color:page===p?'var(--accent)':'var(--text-muted)',
                    borderColor:page===p?'var(--accent-border)':'var(--border-default)' }}>
                  {p}
                </button>
              ))}
              <button className="btn-icon" disabled={page===pages} onClick={() => setPage(p=>p+1)}><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="card w-full max-w-sm p-6 animate-slide-up">
            <h2 className="section-title mb-1">Cancel Order</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Order <strong style={{ color: 'var(--accent)' }}>{showCancel.num}</strong> — reserved stock will be released.
            </p>
            <div className="form-group">
              <label className="form-label">Cancellation Reason *</label>
              <textarea
                className="input" rows={3} placeholder="Enter reason..."
                value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-secondary flex-1" onClick={() => { setShowCancel(null); setCancelReason(''); }}>Back</button>
              <button className="btn-danger flex-1" onClick={handleCancel} disabled={actioning !== null}>
                {actioning ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Cancelling...</span> : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
