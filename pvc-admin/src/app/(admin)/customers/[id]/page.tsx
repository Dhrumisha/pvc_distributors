'use client';
// src/app/(admin)/customers/[id]/page.tsx — Customer detail / view
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { customerService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Phone, Mail, MapPin } from 'lucide-react';

const FMT = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const DT = (d: any) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const TYPE_BADGE: Record<string, string> = {
  retail: 'badge-info', wholesale_a: 'badge-accent', wholesale_b: 'badge-warning', custom: 'badge-neutral',
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const cId = Number(id);
  const [customer, setCustomer] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [outstanding, setOutstanding] = useState(0);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerService.get(cId);
      const d = res.data.data;
      setCustomer(d.customer ?? d);
      setAddresses(d.addresses || []);
      setOutstanding(d.outstanding || 0);
      setTopProducts(d.top_products || []);
      try {
        const oRes = await customerService.getOrders(cId, { limit: 10 });
        setOrders(oRes.data.data?.orders || oRes.data.data || []);
      } catch { /* orders optional */ }
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [cId]);

  useEffect(() => { if (cId) load(); }, [cId, load]);

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  if (!customer) return (
    <div className="empty-state py-20">
      <p className="empty-state-title">Customer not found</p>
      <Link href="/customers" className="btn-secondary mt-3"><ArrowLeft size={14} /> Back</Link>
    </div>
  );

  return (
    <div className="space-y-5 animate-slide-up" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/customers" className="btn-icon"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="page-title flex items-center gap-2"><Users size={18} style={{ color: 'var(--accent)' }} /> {customer.business_name}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{customer.contact_person || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${TYPE_BADGE[customer.customer_type] || 'badge-neutral'}`}>{String(customer.customer_type || '').replace('_', ' ')}</span>
          <span className={`badge ${customer.is_on_hold ? 'badge-error' : 'badge-success'}`}>{customer.is_on_hold ? 'On Hold' : 'Active'}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Credit Limit', FMT(customer.credit_limit)],
          ['Outstanding', FMT(outstanding)],
          ['Credit Days', String(customer.credit_days ?? '—')],
          ['GST', customer.gst_number || '—'],
        ].map(([label, val]) => (
          <div className="card p-4" key={label as string}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: label === 'GST' ? 'var(--font-mono)' : 'inherit' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Contact + addresses */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="section-title mb-3">Contact</h2>
          <div className="space-y-2" style={{ fontSize: 13 }}>
            <div className="flex items-center gap-2"><Phone size={13} style={{ color: 'var(--text-muted)' }} /> {customer.phone || '—'}</div>
            <div className="flex items-center gap-2"><Mail size={13} style={{ color: 'var(--text-muted)' }} /> {customer.email || '—'}</div>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="section-title mb-3 flex items-center gap-2"><MapPin size={15} /> Addresses</h2>
          {addresses.length === 0 ? <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No addresses on file.</p> :
            addresses.map((a, i) => (
              <div key={a.id || i} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                {[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ') || '—'}
              </div>
            ))}
        </div>
      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <div className="card">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}><h2 className="section-title">Top Products</h2></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Product</th><th>SKU</th><th>Total Qty</th></tr></thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i}><td className="td-primary">{p.name}</td><td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.sku}</td><td>{p.total_qty}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="card">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="section-title">Recent Orders</h2>
          <Link href="/sales/orders" className="btn-icon" title="All orders"><ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} /></Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Total</th></tr></thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No orders yet</td></tr>
              ) : orders.map((o, i) => (
                <tr key={o.id || i}>
                  <td><Link href={`/sales/orders/${o.id}`} style={{ color: 'var(--accent)' }}>{o.order_number || `#${o.id}`}</Link></td>
                  <td>{DT(o.order_date || o.created_at)}</td>
                  <td><span className="badge badge-neutral">{o.status}</span></td>
                  <td style={{ fontWeight: 600 }}>{FMT(o.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
