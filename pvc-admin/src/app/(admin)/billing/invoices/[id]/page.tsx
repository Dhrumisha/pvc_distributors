'use client';
// src/app/(admin)/billing/invoices/[id]/page.tsx — Invoice detail / view
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { invoiceService, customerPaymentService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Send, FileText, IndianRupee, MessageCircle, X } from 'lucide-react';

const FMT = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const DT = (d: any) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const TODAY = () => new Date().toISOString().slice(0, 10);

function whatsappReminder(phone: string | undefined, msg: string) {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (!digits) { toast.error('No phone number on file for this customer.'); return; }
  const num = digits.length === 10 ? `91${digits}` : digits;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-neutral', issued: 'badge-info', paid: 'badge-success',
  partially_paid: 'badge-warning', overdue: 'badge-error', cancelled: 'badge-error',
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const invId = Number(id);
  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems]     = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState('');
  const [showPay, setShowPay] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [pform, setPform]     = useState({ amount: '', mode: 'cash', payment_date: TODAY(), reference_number: '', notes: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoiceService.get(invId);
      const d = res.data.data;
      setInvoice(d.invoice ?? d);
      setItems(d.items || []);
      setPayments(d.payments || []);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [invId]);

  useEffect(() => { if (invId) load(); }, [invId, load]);

  const downloadPdf = async () => {
    setBusy('pdf');
    try {
      const res = await invoiceService.getPdf(invId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `${invoice?.invoice_number || 'invoice'}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setBusy(''); }
  };

  const issue = async () => {
    setBusy('issue');
    try { await invoiceService.issue(invId); toast.success('Invoice issued'); load(); }
    catch (e) { toast.error(getApiError(e)); }
    finally { setBusy(''); }
  };

  const remind = () => {
    const msg = `Dear ${invoice.customer?.business_name || 'Customer'},\n\n`
      + `This is a payment reminder for invoice ${invoice.invoice_number}.\n`
      + `Amount pending: ${FMT(invoice.balance_due)}\n`
      + `Due date: ${DT(invoice.due_date)}\n\n`
      + `Kindly arrange the payment at the earliest. Thank you!`;
    whatsappReminder(invoice.customer?.phone, msg);
    invoiceService.share(invId, { channel: 'whatsapp', recipient: invoice.customer?.phone || '' }).catch(() => {});
  };

  const openPay = () => {
    setPform({ amount: String(invoice.balance_due || ''), mode: 'cash', payment_date: TODAY(), reference_number: '', notes: '' });
    setShowPay(true);
  };
  const submitPayment = async () => {
    const amt = parseFloat(pform.amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount.'); return; }
    if (amt > Number(invoice.balance_due)) { toast.error(`Amount exceeds balance due (${FMT(invoice.balance_due)}).`); return; }
    setSaving(true);
    try {
      await customerPaymentService.create({
        invoice_id: invId, customer_id: invoice.customer?.id, amount: amt,
        mode: pform.mode, payment_date: pform.payment_date,
        reference_number: pform.reference_number || undefined, notes: pform.notes || undefined,
      });
      toast.success('Payment recorded — status updated');
      setShowPay(false); load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  const payable = invoice && Number(invoice.balance_due) > 0 && !['draft', 'cancelled', 'paid'].includes(invoice.status);

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  if (!invoice) return (
    <div className="empty-state py-20">
      <p className="empty-state-title">Invoice not found</p>
      <Link href="/billing/invoices" className="btn-secondary mt-3"><ArrowLeft size={14} /> Back</Link>
    </div>
  );

  return (
    <div className="space-y-5 animate-slide-up" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/billing/invoices" className="btn-icon"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="page-title flex items-center gap-2"><FileText size={18} style={{ color: 'var(--accent)' }} /> {invoice.invoice_number || `Invoice #${invoice.id}`}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{invoice.customer?.business_name || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${STATUS_BADGE[invoice.status] || 'badge-neutral'}`}>{invoice.status}</span>
          {invoice.status === 'draft' && (
            <button className="btn-secondary" onClick={issue} disabled={busy === 'issue'}>
              {busy === 'issue' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><Send size={14} /> Issue</>}
            </button>
          )}
          {payable && (
            <button className="btn-secondary" onClick={openPay}><IndianRupee size={14} /> Record Payment</button>
          )}
          {payable && (
            <button className="btn-secondary" style={{ color: '#25D366' }} onClick={remind}><MessageCircle size={14} /> Remind</button>
          )}
          <button className="btn-primary" onClick={downloadPdf} disabled={busy === 'pdf'}>
            {busy === 'pdf' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><Download size={14} /> PDF</>}
          </button>
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Invoice Date', DT(invoice.invoice_date)],
          ['Due Date', DT(invoice.due_date)],
          ['Total', FMT(invoice.total_amount)],
          ['Balance Due', FMT(invoice.balance_due)],
        ].map(([label, val]) => (
          <div className="card p-4" key={label as string}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Customer info */}
      <div className="card p-5">
        <h2 className="section-title mb-3">Bill To</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3" style={{ fontSize: 13 }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Business: </span>{invoice.customer?.business_name || '—'}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Phone: </span>{invoice.customer?.phone || '—'}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>GST: </span><span style={{ fontFamily: 'var(--font-mono)' }}>{invoice.customer?.gst_number || '—'}</span></div>
        </div>
      </div>

      {/* Line items */}
      <div className="card">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}><h2 className="section-title">Line Items</h2></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Product</th><th>SKU</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Tax</th><th>Amount</th></tr></thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No line items</td></tr>
              ) : items.map((it, i) => (
                <tr key={it.id || i}>
                  <td className="td-primary">{it.name || '—'}{it.dimension_label && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{it.dimension_label}</div>}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{it.sku || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{it.hsn_code || '—'}</td>
                  <td>{it.quantity ?? it.qty ?? '—'} {it.unit || ''}</td>
                  <td>{FMT(it.rate ?? it.unit_price)}</td>
                  <td>{FMT(it.tax_amount)}</td>
                  <td style={{ fontWeight: 600 }}>{FMT(it.amount ?? it.line_total ?? it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Totals */}
        <div className="flex justify-end p-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ width: 260, fontSize: 13 }} className="space-y-1.5">
            <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Subtotal</span><span>{FMT(invoice.subtotal)}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Tax</span><span>{FMT(invoice.tax_amount)}</span></div>
            <div className="flex justify-between" style={{ fontWeight: 700, fontSize: 15, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}><span>Total</span><span>{FMT(invoice.total_amount)}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Paid</span><span style={{ color: 'var(--success)' }}>{FMT(invoice.paid_amount)}</span></div>
            <div className="flex justify-between" style={{ fontWeight: 600 }}><span>Balance Due</span><span style={{ color: Number(invoice.balance_due) > 0 ? 'var(--error)' : 'var(--success)' }}>{FMT(invoice.balance_due)}</span></div>
          </div>
        </div>
      </div>

      {/* Payments */}
      {payments.length > 0 && (
        <div className="card">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}><h2 className="section-title">Payments</h2></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Reference</th><th>Mode</th><th>Amount</th></tr></thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id || i}>
                    <td>{DT(p.payment_date)}</td>
                    <td>{p.reference_number || `#${p.id}`}</td>
                    <td>{p.mode || p.payment_mode || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{FMT(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment modal */}
      {showPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowPay(false); }}>
          <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="section-title">Record Payment</h2>
              <button className="btn-icon" onClick={() => setShowPay(false)}><X size={14} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {invoice.invoice_number} · Balance <strong style={{ color: 'var(--error)' }}>{FMT(invoice.balance_due)}</strong>
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="input" min="0" max={invoice.balance_due} value={pform.amount}
                    onChange={e => setPform(f => ({ ...f, amount: e.target.value }))} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Mode</label>
                  <select className="input" value={pform.mode} onChange={e => setPform(f => ({ ...f, mode: e.target.value }))}>
                    {['cash','upi','bank_transfer','cheque','card'].map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input type="date" className="input" value={pform.payment_date} onChange={e => setPform(f => ({ ...f, payment_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference No.</label>
                  <input className="input" placeholder="UTR / cheque #" value={pform.reference_number} onChange={e => setPform(f => ({ ...f, reference_number: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="input" placeholder="Optional" value={pform.notes} onChange={e => setPform(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Enter the full balance to mark <strong>Paid</strong>, or less for <strong>Partially Paid</strong>.
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowPay(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={submitPayment} disabled={saving}>
                {saving ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</span> : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
