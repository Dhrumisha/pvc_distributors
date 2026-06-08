import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { getOutstanding } from '@/lib/portal';
import { PageHero } from '@/components/ui';
import { ArrowLeft, FileText, AlertCircle, CheckCircle2, CalendarDays, BadgeIndianRupee } from 'lucide-react';
import PayButton from './PayButton';

export const metadata: Metadata = {
  title: 'Outstanding Balance | Customer Portal',
  description: 'View your outstanding invoices and pending balances.',
};

const fmt = (n: number | string) => `₹${Number(n).toLocaleString('en-IN')}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function invoiceStatusStyle(status: string): CSSProperties {
  const s = (status || '').toLowerCase();
  if (s === 'paid') return { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' };
  if (s === 'partially_paid') return { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' };
  if (s === 'overdue') return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
  if (s === 'draft') return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
  // sent / open
  return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' };
}

export default async function OutstandingPage() {
  const r = await getOutstanding();
  const invoices: any[] = r?.data?.invoices ?? [];
  const outstanding: number = Number(r?.data?.outstanding ?? 0);

  return (
    <>
      <PageHero
        eyebrow="Customer Portal"
        title="Outstanding Balance"
        subtitle="Review your invoices and pending payments."
      />

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

        {/* Big outstanding card */}
        <div
          className="card"
          style={{
            padding: '32px 36px', marginBottom: 32,
            background: outstanding > 0
              ? 'linear-gradient(135deg, #fef2f2, #fff5f5)'
              : 'linear-gradient(135deg, #f0fdf4, #f7fffe)',
            border: outstanding > 0 ? '1px solid #fecaca' : '1px solid #bbf7d0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{
                width: 56, height: 56, borderRadius: 14,
                background: outstanding > 0 ? '#fee2e2' : '#dcfce7',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <BadgeIndianRupee size={28} color={outstanding > 0 ? '#dc2626' : '#15803d'} />
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)', marginBottom: 4 }}>
                  Total Outstanding
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.02em', color: outstanding > 0 ? '#dc2626' : '#15803d' }}>
                  {fmt(outstanding)}
                </div>
              </div>
            </div>
            {outstanding === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803d', fontWeight: 700, fontSize: 14 }}>
                <CheckCircle2 size={18} /> All cleared!
              </div>
            )}
            {outstanding > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 600, fontSize: 14 }}>
                <AlertCircle size={18} /> Payment due
              </div>
            )}
          </div>
        </div>

        {/* Invoices */}
        {invoices.length === 0 ? (
          <div className="card" style={{ padding: '48px 32px', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
            <FileText size={48} color="var(--brand-600)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>No invoices</h2>
            <p className="lead" style={{ marginBottom: 24 }}>You have no invoices on record yet.</p>
            <Link href="/account" className="btn btn-outline">Back to Account</Link>
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} color="var(--brand-700)" /> Invoices
            </div>
            {/* Table */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f7f9fb', borderBottom: '1px solid #e8ecf1' }}>
                      {['Invoice #', 'Date', 'Due Date', 'Total', 'Paid', 'Balance', 'Status', ''].map(h => (
                        <th
                          key={h}
                          style={{
                            padding: '11px 14px', textAlign: 'left', fontWeight: 700,
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
                    {invoices.map((inv: any, i: number) => (
                      <tr key={inv.id} style={{ borderBottom: i < invoices.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ padding: '13px 14px', fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                          {inv.invoice_number}
                        </td>
                        <td style={{ padding: '13px 14px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <CalendarDays size={13} /> {fmtDate(inv.invoice_date)}
                          </span>
                        </td>
                        <td style={{ padding: '13px 14px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {inv.due_date ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <CalendarDays size={13} /> {fmtDate(inv.due_date)}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '13px 14px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                          {fmt(inv.total_amount)}
                        </td>
                        <td style={{ padding: '13px 14px', color: '#15803d', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {fmt(inv.paid_amount ?? 0)}
                        </td>
                        <td style={{ padding: '13px 14px', fontWeight: 700, whiteSpace: 'nowrap', color: Number(inv.balance_due) > 0 ? '#dc2626' : '#15803d' }}>
                          {fmt(inv.balance_due ?? 0)}
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          <span style={{
                            ...invoiceStatusStyle(inv.status),
                            borderRadius: 8, fontSize: 12, fontWeight: 700,
                            padding: '4px 10px', textTransform: 'capitalize', whiteSpace: 'nowrap',
                          }}>
                            {(inv.status || '').replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '13px 14px' }}>
                          {Number(inv.balance_due) > 0 && (
                            <PayButton invoiceId={inv.id} amount={Number(inv.balance_due)} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div style={{ display: 'grid', gap: 12 }}>
              {invoices.map((inv: any) => (
                <div key={`mob-${inv.id}`} className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{inv.invoice_number}</div>
                    <span style={{
                      ...invoiceStatusStyle(inv.status),
                      borderRadius: 8, fontSize: 12, fontWeight: 700,
                      padding: '3px 9px', textTransform: 'capitalize',
                    }}>
                      {(inv.status || '').replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                    <div>
                      <div style={{ color: 'var(--muted)', marginBottom: 2 }}>Invoice Date</div>
                      <div style={{ fontWeight: 600 }}>{fmtDate(inv.invoice_date)}</div>
                    </div>
                    {inv.due_date && (
                      <div>
                        <div style={{ color: 'var(--muted)', marginBottom: 2 }}>Due Date</div>
                        <div style={{ fontWeight: 600 }}>{fmtDate(inv.due_date)}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ color: 'var(--muted)', marginBottom: 2 }}>Total</div>
                      <div style={{ fontWeight: 700 }}>{fmt(inv.total_amount)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--muted)', marginBottom: 2 }}>Balance Due</div>
                      <div style={{ fontWeight: 800, color: Number(inv.balance_due) > 0 ? '#dc2626' : '#15803d' }}>
                        {fmt(inv.balance_due ?? 0)}
                      </div>
                    </div>
                  </div>
                  {Number(inv.balance_due) > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <PayButton invoiceId={inv.id} amount={Number(inv.balance_due)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
