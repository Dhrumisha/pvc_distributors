'use client';
// src/app/(admin)/sales/orders/[id]/page.tsx — Sales Order detail / view
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { salesOrderService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, ShoppingCart, CheckCircle, XCircle, Truck, FileText } from 'lucide-react';

const FMT = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const DT = (d: any) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-neutral', confirmed: 'badge-info', approved: 'badge-success',
  processing: 'badge-warning', completed: 'badge-success', cancelled: 'badge-error',
};

export default function SalesOrderDetailPage() {
  const { id } = useParams();
  const oId = Number(id);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesOrderService.get(oId);
      const d = res.data.data;
      setOrder(d.order ?? d);
      setItems(d.items || []);
      setDeliveries(d.deliveries || []);
      setInvoices(d.invoices || []);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [oId]);

  useEffect(() => { if (oId) load(); }, [oId, load]);

  const doAction = async (fn: () => Promise<any>, key: string, msg: string) => {
    setBusy(key);
    try { await fn(); toast.success(msg); load(); }
    catch (e) { toast.error(getApiError(e)); }
    finally { setBusy(''); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  if (!order) return (
    <div className="empty-state py-20">
      <p className="empty-state-title">Order not found</p>
      <Link href="/sales/orders" className="btn-secondary mt-3"><ArrowLeft size={14} /> Back</Link>
    </div>
  );

  return (
    <div className="space-y-5 animate-slide-up" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/sales/orders" className="btn-icon"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="page-title flex items-center gap-2"><ShoppingCart size={18} style={{ color: 'var(--accent)' }} /> {order.order_number || `Order #${order.id}`}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{order.customer?.business_name || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${STATUS_BADGE[order.status] || 'badge-neutral'}`}>{order.status}</span>
          {order.status === 'draft' && (
            <button className="btn-secondary" onClick={() => doAction(() => salesOrderService.confirm(oId), 'confirm', 'Order confirmed')} disabled={busy === 'confirm'}>
              {busy === 'confirm' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><CheckCircle size={14} /> Confirm</>}
            </button>
          )}
          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <button className="btn-secondary" style={{ color: 'var(--error)' }}
              onClick={() => { const r = prompt('Reason for cancellation?'); if (r) doAction(() => salesOrderService.cancel(oId, r), 'cancel', 'Order cancelled'); }}
              disabled={busy === 'cancel'}>
              <XCircle size={14} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Order Date', DT(order.order_date || order.created_at)],
          ['Expected', DT(order.expected_delivery || order.delivery_date)],
          ['Items', String(items.length)],
          ['Total', FMT(order.total_amount)],
        ].map(([label, val]) => (
          <div className="card p-4" key={label as string}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Line items */}
      <div className="card">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}><h2 className="section-title">Line Items</h2></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No line items</td></tr>
              ) : items.map((it, i) => (
                <tr key={it.id || i}>
                  <td className="td-primary">{it.name || '—'}{it.dimension_label && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{it.dimension_label}</div>}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{it.sku || '—'}</td>
                  <td>{it.ordered_qty ?? it.quantity ?? '—'} {it.unit || ''}</td>
                  <td>{FMT(it.rate ?? it.unit_price)}</td>
                  <td style={{ fontWeight: 600 }}>{FMT(it.amount ?? it.line_total ?? it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end p-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ width: 260, fontSize: 13 }} className="space-y-1.5">
            <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Subtotal</span><span>{FMT(order.subtotal)}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Tax</span><span>{FMT(order.tax_amount)}</span></div>
            <div className="flex justify-between" style={{ fontWeight: 700, fontSize: 15, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}><span>Total</span><span>{FMT(order.total_amount)}</span></div>
          </div>
        </div>
      </div>

      {/* Related deliveries & invoices */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="section-title mb-3 flex items-center gap-2"><Truck size={15} /> Deliveries</h2>
          {deliveries.length === 0 ? <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No deliveries yet.</p> :
            deliveries.map((d, i) => (
              <div key={d.id || i} className="flex justify-between" style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>{d.delivery_number || `#${d.id}`}</span>
                <span className="badge badge-neutral">{d.status}</span>
              </div>
            ))}
        </div>
        <div className="card p-4">
          <h2 className="section-title mb-3 flex items-center gap-2"><FileText size={15} /> Invoices</h2>
          {invoices.length === 0 ? <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No invoices yet.</p> :
            invoices.map((inv, i) => (
              <Link key={inv.id || i} href={`/billing/invoices/${inv.id}`} className="flex justify-between" style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--accent)' }}>{inv.invoice_number || `#${inv.id}`}</span>
                <span>{FMT(inv.total_amount)}</span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
