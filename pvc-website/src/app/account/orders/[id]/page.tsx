import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { getMyOrder } from '@/lib/portal';
import { PageHero } from '@/components/ui';
import { ArrowLeft, CalendarDays, Package, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Order Detail | Customer Portal',
  description: 'View the details and line items for your order.',
};

const fmt = (n: number | string) => `₹${Number(n).toLocaleString('en-IN')}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function statusStyle(status: string): CSSProperties {
  const s = (status || '').toLowerCase();
  if (s === 'delivered' || s === 'completed')
    return { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' };
  if (s === 'cancelled')
    return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
  if (s === 'draft' || s === 'confirmed' || s === 'processing' || s === 'pending')
    return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' };
  return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const r = await getMyOrder(params.id);
  const order = r?.data?.order;
  const items: any[] = r?.data?.items ?? [];

  if (!r?.ok || !order) {
    return (
      <>
        <PageHero eyebrow="Customer Portal" title="Order Not Found" />
        <div className="container-x" style={{ paddingBlock: 64, textAlign: 'center' }}>
          <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
          <p className="lead" style={{ marginBottom: 24 }}>
            We couldn't find this order. It may have been removed or the link is invalid.
          </p>
          <Link href="/account/orders" className="btn btn-outline">
            <ArrowLeft size={16} /> Back to Orders
          </Link>
        </div>
      </>
    );
  }

  const subtotal = items.reduce((acc: number, it: any) => acc + Number(it.line_total ?? 0), 0);

  return (
    <>
      <PageHero eyebrow="Customer Portal" title={`Order ${order.order_number}`} />

      <div className="container-x" style={{ paddingBlock: 48 }}>
        <Link
          href="/account/orders"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--brand-700)', fontWeight: 600, fontSize: 14,
            textDecoration: 'none', marginBottom: 28,
          }}
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        {/* Order header card */}
        <div className="card" style={{ padding: '24px 28px', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Order</div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-.02em' }}>
                {order.order_number}
              </h1>
            </div>
            <span style={{
              ...statusStyle(order.status),
              borderRadius: 10, fontSize: 13, fontWeight: 700,
              padding: '6px 14px', textTransform: 'capitalize', alignSelf: 'flex-start',
            }}>
              {order.status}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                Date
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--ink)' }}>
                <CalendarDays size={15} color="var(--muted)" />
                {fmtDate(order.order_date)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                Total
              </div>
              <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--ink)' }}>
                {fmt(order.total_amount)}
              </div>
            </div>
            {order.notes && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                  Notes
                </div>
                <div style={{ fontSize: 14, color: 'var(--ink)', maxWidth: 400 }}>{order.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8ecf1', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={18} color="var(--brand-700)" />
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Line Items</span>
          </div>

          {items.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
              No line items found for this order.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f7f9fb', borderBottom: '1px solid #e8ecf1' }}>
                    {['Product', 'SKU / Size', 'Qty', 'Unit Price', 'Discount', 'Line Total'].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 16px', textAlign: 'left', fontWeight: 700,
                          color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase',
                          letterSpacing: '.06em', whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it: any, i: number) => (
                    <tr key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{it.name}</div>
                      </td>
                      <td style={{ padding: '13px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {it.sku && <div style={{ fontSize: 12 }}>{it.sku}</div>}
                        {it.dimension_label && <div style={{ fontSize: 12 }}>{it.dimension_label}</div>}
                      </td>
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--ink)' }}>
                        {it.ordered_qty}
                      </td>
                      <td style={{ padding: '13px 16px', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                        {fmt(it.unit_price)}
                      </td>
                      <td style={{ padding: '13px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {Number(it.discount_pct) > 0 ? (
                          <span style={{
                            background: '#fefce8', color: '#854d0e',
                            border: '1px solid #fef08a', borderRadius: 6,
                            fontSize: 12, fontWeight: 700, padding: '2px 8px',
                          }}>
                            -{it.discount_pct}%
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                        {fmt(it.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totals summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div className="card" style={{ padding: '20px 28px', minWidth: 280 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 14 }}>
              Order Summary
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--muted)' }}>
                <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div style={{ borderTop: '1px solid #e8ecf1', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, color: 'var(--ink)' }}>
                <span>Total</span>
                <span>{fmt(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
