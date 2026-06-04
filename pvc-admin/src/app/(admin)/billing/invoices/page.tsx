'use client';
// src/app/(admin)/billing/invoices/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { invoiceService, customerPaymentService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Search, Eye, Download, CheckCircle, FileText, IndianRupee, MessageCircle,
  ChevronLeft, ChevronRight, X, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: number;
  invoice_number: string;
  customer?: { id: number; business_name: string; phone?: string };
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: string;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-neutral', issued: 'badge-info', partially_paid: 'badge-warning',
  paid: 'badge-success', overdue: 'badge-error', cancelled: 'badge-neutral',
};

const FMT = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const today = () => new Date().toISOString().slice(0, 10);

// Build a WhatsApp click-to-send link (free, opens WhatsApp with prefilled text)
function whatsappReminder(phone: string | undefined, msg: string) {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (!digits) { toast.error('No phone number on file for this customer.'); return; }
  const num = digits.length === 10 ? `91${digits}` : digits; // assume India if 10-digit
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [overdueOnly, setOverdue] = useState(false);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [actioning,setActioning]= useState<number | null>(null);
  const [reminding,setReminding]= useState<number | null>(null);

  // Record-payment modal
  const [payInv, setPayInv] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [pform, setPform]   = useState({ amount: '', mode: 'cash', payment_date: today(), reference_number: '', notes: '' });

  // Bulk "remind all overdue" guided queue
  const [bulkQueue, setBulkQueue] = useState<Invoice[] | null>(null);
  const [bulkIdx,   setBulkIdx]   = useState(0);
  const [bulkLoading, setBulkLoading] = useState(false);

  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoiceService.list({ page, limit: LIMIT, search: search || undefined, status: status || undefined, overdue_only: overdueOnly || undefined });
      setInvoices(res.data.data?.invoices || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, search, status, overdueOnly]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status, overdueOnly]);

  const handleIssue = async (id: number) => {
    setActioning(id);
    try { await invoiceService.issue(id); toast.success('Invoice issued'); load(); }
    catch (e) { toast.error(getApiError(e)); }
    finally { setActioning(null); }
  };

  const handleDownloadPdf = async (id: number, num: string) => {
    try {
      const res = await invoiceService.getPdf(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `${num}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('PDF download failed'); }
  };

  // Send a payment-pending WhatsApp reminder (fetches phone from invoice detail)
  const handleRemind = async (inv: Invoice) => {
    setReminding(inv.id);
    try {
      let phone = inv.customer?.phone;
      if (!phone) {
        const res = await invoiceService.get(inv.id);
        phone = (res.data.data?.invoice ?? res.data.data)?.customer?.phone;
      }
      const msg = `Dear ${inv.customer?.business_name || 'Customer'},\n\n`
        + `This is a payment reminder for invoice ${inv.invoice_number}.\n`
        + `Amount pending: ${FMT(inv.balance_due)}\n`
        + `Due date: ${inv.due_date || '—'}\n\n`
        + `Kindly arrange the payment at the earliest. Thank you!`;
      whatsappReminder(phone, msg);
      try { await invoiceService.share(inv.id, { channel: 'whatsapp', recipient: phone || '' }); } catch { /* logging best-effort */ }
    } catch (e) { toast.error(getApiError(e)); }
    finally { setReminding(null); }
  };

  // ── Remind all overdue (guided queue) ───────────────────────────────────────
  const reminderMessage = (inv: Invoice) =>
    `Dear ${inv.customer?.business_name || 'Customer'},\n\n`
    + `This is a payment reminder for invoice ${inv.invoice_number}.\n`
    + `Amount pending: ${FMT(inv.balance_due)}\n`
    + `Due date: ${inv.due_date || '—'}\n\n`
    + `Kindly arrange the payment at the earliest. Thank you!`;

  const startBulk = async () => {
    setBulkLoading(true);
    try {
      const res = await invoiceService.overdue();
      const list: Invoice[] = res.data.data?.invoices || res.data.data || [];
      if (!list.length) { toast('No overdue invoices 🎉'); return; }
      setBulkQueue(list);
      setBulkIdx(0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setBulkLoading(false); }
  };

  const sendCurrent = () => {
    if (!bulkQueue) return;
    const inv = bulkQueue[bulkIdx];
    whatsappReminder(inv.customer?.phone, reminderMessage(inv));
    invoiceService.share(inv.id, { channel: 'whatsapp', recipient: inv.customer?.phone || '' }).catch(() => {});
    setBulkIdx(i => i + 1);
  };
  const skipCurrent = () => setBulkIdx(i => i + 1);
  const closeBulk   = () => { setBulkQueue(null); setBulkIdx(0); };

  const daysOverdue = (due?: string) => {
    if (!due) return 0;
    const d = Math.floor((Date.now() - new Date(due).getTime()) / 86400000);
    return d > 0 ? d : 0;
  };

  // Record payment
  const openPay = (inv: Invoice) => {
    setPayInv(inv);
    setPform({ amount: String(inv.balance_due || ''), mode: 'cash', payment_date: today(), reference_number: '', notes: '' });
  };
  const submitPayment = async () => {
    if (!payInv) return;
    const amt = parseFloat(pform.amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount.'); return; }
    if (amt > Number(payInv.balance_due)) { toast.error(`Amount exceeds balance due (${FMT(payInv.balance_due)}).`); return; }
    setSaving(true);
    try {
      await customerPaymentService.create({
        invoice_id: payInv.id,
        customer_id: payInv.customer?.id,
        amount: amt,
        mode: pform.mode,
        payment_date: pform.payment_date,
        reference_number: pform.reference_number || undefined,
        notes: pform.notes || undefined,
      });
      toast.success('Payment recorded — status updated');
      setPayInv(null);
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Invoices &amp; Receivables</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} invoices · record payments and send reminders here</p>
        </div>
        <button className="btn-primary" onClick={startBulk} disabled={bulkLoading} style={{ background: '#25D366', borderColor: '#25D366', color: '#06210f' }}>
          {bulkLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <MessageCircle size={15} />} Remind All Overdue
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 30 }} placeholder="Search invoice # or customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 'auto', minWidth: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {['draft','issued','partially_paid','paid','overdue','cancelled'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <button
          onClick={() => setOverdue(v => !v)}
          style={{
            padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid',
            display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
            background: overdueOnly ? 'var(--error-bg)' : 'transparent',
            color: overdueOnly ? 'var(--error)' : 'var(--text-muted)',
            borderColor: overdueOnly ? 'rgba(239,68,68,0.3)' : 'var(--border-default)',
          }}>
          <AlertTriangle size={11} /> Overdue Only
        </button>
        {(search || status || overdueOnly) && (
          <button className="btn-icon" onClick={() => { setSearch(''); setStatus(''); setOverdue(false); }}><X size={13} /></button>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={9}>
                  <div className="empty-state py-12">
                    <FileText size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No invoices found</p>
                  </div>
                </td></tr>
              ) : invoices.map(inv => {
                const payable = Number(inv.balance_due) > 0 && !['draft','cancelled','paid'].includes(inv.status);
                return (
                <tr key={inv.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                      {inv.invoice_number}
                    </span>
                  </td>
                  <td className="td-primary">{inv.customer?.business_name || '—'}</td>
                  <td style={{ fontSize: 12 }}>{inv.invoice_date}</td>
                  <td style={{ fontSize: 12 }}>
                    <span style={{ color: inv.status === 'overdue' ? 'var(--error)' : 'inherit' }}>{inv.due_date}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{FMT(inv.total_amount)}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 500 }}>{FMT(inv.paid_amount)}</td>
                  <td style={{ fontWeight: 600, color: inv.balance_due > 0 ? 'var(--error)' : 'var(--success)' }}>
                    {FMT(inv.balance_due)}
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[inv.status] || 'badge-neutral'}`}>{inv.status.replace(/_/g,' ')}</span></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/billing/invoices/${inv.id}`} className="btn-icon" title="View"><Eye size={13} /></Link>
                      {inv.status === 'draft' && (
                        <button className="btn-icon" style={{ color: 'var(--success)' }}
                          onClick={() => handleIssue(inv.id)} disabled={actioning === inv.id} title="Issue invoice">
                          {actioning === inv.id ? <div className="spinner" style={{ width:12,height:12 }} /> : <CheckCircle size={13} />}
                        </button>
                      )}
                      {payable && (
                        <button className="btn-icon" style={{ color: 'var(--accent)' }}
                          onClick={() => openPay(inv)} title="Record payment">
                          <IndianRupee size={13} />
                        </button>
                      )}
                      {payable && (
                        <button className="btn-icon" style={{ color: '#25D366' }}
                          onClick={() => handleRemind(inv)} disabled={reminding === inv.id} title="Send WhatsApp payment reminder">
                          {reminding === inv.id ? <div className="spinner" style={{ width:12,height:12 }} /> : <MessageCircle size={13} />}
                        </button>
                      )}
                      <button className="btn-icon" title="Download PDF" onClick={() => handleDownloadPdf(inv.id, inv.invoice_number)}>
                        <Download size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</p>
            <div className="flex gap-1">
              <button className="btn-icon" disabled={page===1} onClick={() => setPage(p=>p-1)}><ChevronLeft size={14}/></button>
              {Array.from({ length: Math.min(5,pages) }, (_,i) => i+1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width:30,height:30,borderRadius:6,fontSize:12,fontWeight:600,border:'1px solid',cursor:'pointer',background:page===p?'var(--accent-muted)':'transparent',color:page===p?'var(--accent)':'var(--text-muted)',borderColor:page===p?'var(--accent-border)':'var(--border-default)' }}>{p}</button>
              ))}
              <button className="btn-icon" disabled={page===pages} onClick={() => setPage(p=>p+1)}><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment modal */}
      {payInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setPayInv(null); }}>
          <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="section-title">Record Payment</h2>
              <button className="btn-icon" onClick={() => setPayInv(null)}><X size={14} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {payInv.invoice_number} · {payInv.customer?.business_name} · Balance <strong style={{ color: 'var(--error)' }}>{FMT(payInv.balance_due)}</strong>
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="input" min="0" max={payInv.balance_due} value={pform.amount}
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
                Tip: enter the full balance to mark <strong>Paid</strong>, or a smaller amount for <strong>Partially Paid</strong>.
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setPayInv(null)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={submitPayment} disabled={saving}>
                {saving ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</span> : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remind All Overdue — guided queue */}
      {bulkQueue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeBulk(); }}>
          <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2"><MessageCircle size={16} style={{ color: '#25D366' }} /> Remind Overdue Customers</h2>
              <button className="btn-icon" onClick={closeBulk}><X size={14} /></button>
            </div>

            {bulkIdx >= bulkQueue.length ? (
              // Done screen
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--accent-muted)' }}>
                  <CheckCircle size={24} style={{ color: 'var(--success)' }} />
                </div>
                <p className="empty-state-title">All {bulkQueue.length} reminders done</p>
                <p className="empty-state-desc">You’ve gone through every overdue invoice.</p>
                <button className="btn-primary mt-4" onClick={closeBulk}>Close</button>
              </div>
            ) : (
              <>
                {/* Progress */}
                <div className="flex items-center justify-between mb-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>Customer {bulkIdx + 1} of {bulkQueue.length}</span>
                  <span>{bulkQueue.length - bulkIdx} left</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: 'var(--border-default)', overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ height: '100%', width: `${(bulkIdx / bulkQueue.length) * 100}%`, background: '#25D366', transition: 'width 0.2s' }} />
                </div>

                {/* Current customer card */}
                {(() => {
                  const inv = bulkQueue[bulkIdx];
                  const dov = daysOverdue(inv.due_date);
                  const noPhone = !inv.customer?.phone;
                  return (
                    <div className="card p-4 mb-4" style={{ background: 'var(--bg-input, transparent)' }}>
                      <div className="td-primary" style={{ fontSize: 15 }}>{inv.customer?.business_name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {inv.invoice_number} · due {inv.due_date || '—'}
                        {dov > 0 && <span style={{ color: 'var(--error)' }}> · {dov} days overdue</span>}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--error)', marginTop: 8 }}>{FMT(inv.balance_due)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        📱 {inv.customer?.phone || <span style={{ color: 'var(--warning)' }}>No phone on file</span>}
                      </div>
                      {noPhone && <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 6 }}>Skip this one or add a phone number to the customer.</div>}
                    </div>
                  );
                })()}

                <div className="flex gap-3">
                  <button className="btn-secondary flex-1" onClick={skipCurrent}>Skip</button>
                  <button className="btn-primary flex-1"
                    onClick={sendCurrent}
                    disabled={!bulkQueue[bulkIdx].customer?.phone}
                    style={{ background: '#25D366', borderColor: '#25D366', color: '#06210f' }}>
                    <MessageCircle size={14} /> Send &amp; Next
                  </button>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                  Opens WhatsApp with the message ready — tap send there, then come back and continue.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
