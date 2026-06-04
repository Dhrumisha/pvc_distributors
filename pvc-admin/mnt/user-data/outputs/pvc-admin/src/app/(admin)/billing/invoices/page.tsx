'use client';
// src/app/(admin)/billing/invoices/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { invoiceService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Search, Eye, Download, Share2, CheckCircle, FileText,
  ChevronLeft, ChevronRight, X, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: number;
  invoice_number: string;
  customer?: { business_name: string };
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [overdueOnly, setOverdue] = useState(false);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [actioning,setActioning]= useState<number | null>(null);
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
    } catch (e) { toast.error('PDF download failed'); }
  };

  const handleShare = async (id: number) => {
    try {
      await invoiceService.share(id, { channel: 'whatsapp', recipient: '' });
      toast.success('Share link sent via WhatsApp');
    } catch (e) { toast.error(getApiError(e)); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} invoices total</p>
        </div>
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
              ) : invoices.map(inv => (
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
                      <button className="btn-icon" title="Download PDF" onClick={() => handleDownloadPdf(inv.id, inv.invoice_number)}>
                        <Download size={13} />
                      </button>
                      {inv.status !== 'cancelled' && (
                        <button className="btn-icon" title="Share" onClick={() => handleShare(inv.id)}>
                          <Share2 size={13} />
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
    </div>
  );
}
