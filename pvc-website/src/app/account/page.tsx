import type { Metadata } from 'next';
import Link from 'next/link';
import { getMe, getMyOrders } from '@/lib/portal';
import {
  User, ShoppingCart, FileText, TrendingDown, Percent, CreditCard,
  Wallet, AlertCircle, Clock, CheckCircle2, Truck, XCircle, ArrowRight,
  ClipboardList, BadgeAlert, LogIn,
} from 'lucide-react';

export const metadata: Metadata = { title: 'My Account' };

const inr = (n: number | string | null | undefined) =>
  `₹${Number(n || 0).toLocaleString('en-IN')}`;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; Icon: React.ElementType }> = {
    pending:    { color: '#92400e', bg: '#fef3c7', Icon: Clock },
    confirmed:  { color: '#1e40af', bg: '#dbeafe', Icon: CheckCircle2 },
    processing: { color: '#5b21b6', bg: '#ede9fe', Icon: ClipboardList },
    shipped:    { color: '#065f46', bg: '#d1fae5', Icon: Truck },
    delivered:  { color: '#15803d', bg: '#f0fdf4', Icon: CheckCircle2 },
    cancelled:  { color: '#991b1b', bg: '#fee2e2', Icon: XCircle },
  };
  const s = status?.toLowerCase() || 'pending';
  const { color, bg, Icon } = map[s] || map.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color, background: bg, padding: '3px 10px', borderRadius: 999 }}>
      <Icon size={12} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: accent ? `${accent}18` : 'var(--brand-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={accent || 'var(--brand-700)'} />
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent || 'var(--ink)', letterSpacing: '-.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default async function AccountPage() {
  const me = await getMe();

  if (!me.ok) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="card" style={{ padding: '40px 36px', textAlign: 'center', maxWidth: 380 }}>
          <User size={44} color="var(--brand-700)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: '0 0 10px' }}>Sign in to your account</h2>
          <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 22px' }}>Please log in to view your dashboard.</p>
          <Link href="/account/login" className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
            <LogIn size={16} />
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const customer = me.data?.customer || me.customer || {};
  const ordersRes = await getMyOrders();
  const orders: any[] = (ordersRes.data?.orders || ordersRes.orders || []).slice(0, 5);

  const isPending = customer.portal_status === 'pending';
  const creditAllowed = !!customer.credit_allowed;
  const typeLabel = customer.customer_type_label || customer.type_label || '';

  const outstandingVal = Number(customer.outstanding || 0);
  const outstandingIsRed = outstandingVal > 0;

  return (
    <>
      {/* Page hero */}
      <section style={{ background: 'linear-gradient(135deg, var(--brand-800), var(--brand-600))', color: '#fff' }}>
        <div className="container-x" style={{ paddingBlock: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <span style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={28} color="#fff" />
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.75)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>My Account</div>
              <h1 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 800, margin: 0, letterSpacing: '-.02em' }}>
                {customer.business_name || 'Welcome back'}
              </h1>
              {customer.contact_person && (
                <p style={{ margin: '4px 0 0', fontSize: 15, color: 'rgba(255,255,255,.8)' }}>{customer.contact_person}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container-x" style={{ paddingBlock: 48 }}>

        {/* Pending approval banner */}
        {isPending && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 14, padding: '18px 22px', marginBottom: 32 }}>
            <BadgeAlert size={22} color="#92400e" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: 15, marginBottom: 3 }}>Account pending approval</div>
              <p style={{ margin: 0, color: '#78350f', fontSize: 14, lineHeight: 1.6 }}>
                You can browse our product catalogue, but trade pricing &amp; credit (Udhaar) unlock after we approve your account. We typically review within 1 business day.
              </p>
            </div>
          </div>
        )}

        {/* Credit (Udhaar) not enabled notice */}
        {!isPending && !creditAllowed && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', marginBottom: 28 }}>
            <AlertCircle size={18} color="var(--muted)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
              Credit (Udhaar) is not yet enabled on your account. Contact us to discuss a credit facility.
            </p>
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 40 }}>
          <StatCard
            icon={Percent}
            label="Your Discount"
            value={`${customer.discount_percent || 0}%`}
            sub={typeLabel || 'Trade account'}
          />
          <StatCard
            icon={CreditCard}
            label="Credit Limit"
            value={inr(customer.credit_limit)}
            sub={creditAllowed ? 'Approved credit' : 'Not enabled'}
          />
          <StatCard
            icon={Wallet}
            label="Credit Available"
            value={inr(customer.credit_available)}
            sub={creditAllowed ? 'Ready to use' : 'Contact us'}
          />
          <StatCard
            icon={TrendingDown}
            label="Outstanding"
            value={inr(customer.outstanding)}
            sub={outstandingIsRed ? 'Payment due' : 'All clear'}
            accent={outstandingIsRed ? '#dc2626' : undefined}
          />
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: 44 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Quick actions</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/account/shop" className="btn btn-primary" style={{ fontSize: 15, padding: '12px 22px' }}>
              <ShoppingCart size={17} />
              Shop / Place Order
            </Link>
            <Link href="/account/orders" className="btn btn-outline" style={{ fontSize: 15, padding: '12px 22px' }}>
              <ClipboardList size={17} />
              My Orders
            </Link>
            <Link href="/account/outstanding" className="btn btn-outline" style={{ fontSize: 15, padding: '12px 22px' }}>
              <FileText size={17} />
              Outstanding / Invoices
            </Link>
          </div>
        </div>

        {/* Recent orders */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Recent activity</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-.02em' }}>Recent Orders</h2>
            </div>
            {orders.length > 0 && (
              <Link href="/account/orders" className="btn btn-outline" style={{ fontSize: 14 }}>
                View all <ArrowRight size={15} />
              </Link>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
              <ShoppingCart size={40} color="var(--brand-600)" strokeWidth={1.4} style={{ margin: '0 auto 14px' }} />
              <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 18px' }}>No orders yet. Ready to place your first order?</p>
              <Link href="/account/shop" className="btn btn-primary">
                <ShoppingCart size={16} />
                Start shopping
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orders.map((order: any) => {
                const orderId = order.id || order.order_id;
                const orderNum = order.order_number || `#${orderId}`;
                const dateStr = order.created_at
                  ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—';
                const total = inr(order.total_amount ?? order.total ?? 0);
                return (
                  <Link
                    key={orderId}
                    href={`/account/orders/${orderId}`}
                    className="card"
                    style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--brand-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ClipboardList size={18} color="var(--brand-700)" />
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{orderNum}</div>
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{dateStr}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <StatusBadge status={order.status || 'pending'} />
                      <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>{total}</span>
                      <ArrowRight size={16} color="var(--muted)" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
