import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { getMyOrders } from '@/lib/portal';
import { PageHero } from '@/components/ui';
import { ShoppingBag, ArrowLeft, ArrowRight, CalendarDays, CreditCard } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Orders | Customer Portal',
  description: 'View your order history and track the status of your orders.',
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

const isCredit = (notes?: string) =>
  !!notes && (notes.toUpperCase().includes('CREDIT') || notes.includes('Udhaar'));

export default async function OrdersPage() {
  const r = await getMyOrders();
  const orders: any[] = r?.data?.orders ?? [];

  return (
    <>
      <PageHero eyebrow="Customer Portal" title="My Orders" subtitle="Track and review all your placed orders." />

      <div className="container-x" style={{ paddingBlock: 48 }}>
        <Link
          href="/account"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--brand-700)', fontWeight: 600, fontSize: 14,
            textDecoration: 'none', marginBottom: 28,
          }}
        >
          <ArrowLeft size={16} /> Back to Account
        </Link>

        {orders.length === 0 ? (
          <div className="card" style={{ padding: '56px 32px', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
            <ShoppingBag size={48} color="var(--brand-600)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>No orders yet</h2>
            <p className="lead" style={{ marginBottom: 24 }}>
              You haven't placed any orders yet. Browse our catalog and place your first order.
            </p>
            <Link href="/account/shop" className="btn btn-primary">
              Shop Now <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            {/* Scrollable table for wider screens */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f7f9fb', borderBottom: '1px solid #e8ecf1' }}>
                      {['Order #', 'Date', 'Status', 'Amount', ''].map(h => (
                        <th
                          key={h}
                          style={{
                            padding: '12px 16px', textAlign: 'left', fontWeight: 700,
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
                    {orders.map((o: any, i: number) => (
                      <tr
                        key={o.id}
                        style={{ borderBottom: i < orders.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{o.order_number}</span>
                            {isCredit(o.notes) && (
                              <span style={{
                                background: '#fefce8', color: '#854d0e', border: '1px solid #fef08a',
                                borderRadius: 6, fontSize: 11, fontWeight: 700, padding: '2px 7px',
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                              }}>
                                <CreditCard size={11} /> Credit / Udhaar
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <CalendarDays size={14} /> {fmtDate(o.order_date)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            ...statusStyle(o.status),
                            borderRadius: 8, fontSize: 12, fontWeight: 700,
                            padding: '4px 10px', textTransform: 'capitalize',
                          }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                          {fmt(o.total_amount)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <Link
                            href={`/account/orders/${o.id}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              color: 'var(--brand-700)', fontWeight: 700, fontSize: 13,
                              textDecoration: 'none', whiteSpace: 'nowrap',
                            }}
                          >
                            View <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile-friendly card list */}
            <div style={{ display: 'grid', gap: 12 }}>
              {orders.map((o: any) => (
                <Link
                  key={`mob-${o.id}`}
                  href={`/account/orders/${o.id}`}
                  className="card"
                  style={{
                    padding: '16px 18px', display: 'grid',
                    gridTemplateColumns: '1fr auto', gap: '4px 12px',
                    textDecoration: 'none', color: 'inherit',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>
                    {o.order_number}
                    {isCredit(o.notes) && (
                      <span style={{
                        marginLeft: 8, background: '#fefce8', color: '#854d0e',
                        border: '1px solid #fef08a', borderRadius: 6,
                        fontSize: 11, fontWeight: 700, padding: '2px 7px',
                        verticalAlign: 'middle',
                      }}>
                        Credit
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', textAlign: 'right' }}>{fmt(o.total_amount)}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CalendarDays size={13} /> {fmtDate(o.order_date)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      ...statusStyle(o.status),
                      borderRadius: 8, fontSize: 12, fontWeight: 700,
                      padding: '3px 9px', textTransform: 'capitalize',
                    }}>
                      {o.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
