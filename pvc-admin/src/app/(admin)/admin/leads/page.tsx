'use client';
// src/app/(admin)/admin/leads/page.tsx — website enquiries / leads
import { useEffect, useState, useCallback } from 'react';
import { enquiryService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Search, X, Trash2, RefreshCw, Inbox, Phone, Mail, MessageSquare,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

interface Enquiry {
  id: number; name: string; email?: string; phone?: string; company?: string;
  subject?: string; message?: string; type: string; product_interest?: string;
  status: string; created_at?: string;
}

const STATUS_BADGE: Record<string, string> = {
  new: 'badge-warning', contacted: 'badge-info', converted: 'badge-success', closed: 'badge-neutral',
};
const STATUSES = ['new', 'contacted', 'converted', 'closed'];
const DT = (d?: string) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function LeadsPage() {
  const [rows, setRows]       = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [type, setType]       = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [busy, setBusy]       = useState<number | null>(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await enquiryService.list({ page, limit: LIMIT, search: search || undefined, status: status || undefined, type: type || undefined });
      setRows(res.data.data?.enquiries || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, search, status, type]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status, type]);

  const changeStatus = async (e: Enquiry, s: string) => {
    setBusy(e.id);
    try { await enquiryService.setStatus(e.id, s); toast.success('Status updated'); load(); }
    catch (err) { toast.error(getApiError(err)); }
    finally { setBusy(null); }
  };
  const remove = async (e: Enquiry) => {
    if (!confirm(`Delete enquiry from ${e.name}?`)) return;
    setBusy(e.id);
    try { await enquiryService.remove(e.id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(getApiError(err)); }
    finally { setBusy(null); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Leads / Website Enquiries</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} enquiries from your marketing website</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 30 }} placeholder="Search name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 'auto', minWidth: 140 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', minWidth: 130 }} value={type} onChange={e => setType(e.target.value)}>
          <option value="">All types</option>
          <option value="quote">Quote</option>
          <option value="contact">Contact</option>
        </select>
        {(search || status || type) && <button className="btn-icon" onClick={() => { setSearch(''); setStatus(''); setType(''); }}><X size={13} /></button>}
        <button className="btn-icon" onClick={load} title="Refresh"><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Contact</th><th>Type</th><th>Interest / Message</th><th>Received</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state py-12">
                    <Inbox size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No enquiries yet</p>
                    <p className="empty-state-desc">Leads submitted on your website's Contact / Quote forms will appear here.</p>
                  </div>
                </td></tr>
              ) : rows.map(e => (
                <tr key={e.id}>
                  <td>
                    <div className="td-primary">{e.name}{e.company ? ` · ${e.company}` : ''}</div>
                    <div className="flex flex-col gap-0.5" style={{ marginTop: 2 }}>
                      {e.phone && <a href={`tel:${e.phone}`} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}><Phone size={10} /> {e.phone}</a>}
                      {e.email && <a href={`mailto:${e.email}`} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}><Mail size={10} /> {e.email}</a>}
                    </div>
                  </td>
                  <td><span className={`badge ${e.type === 'quote' ? 'badge-accent' : 'badge-neutral'}`}>{e.type}</span></td>
                  <td style={{ maxWidth: 340 }}>
                    {e.product_interest && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{e.product_interest}</div>}
                    {(e.subject || e.message) && <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 4, marginTop: 2 }}><MessageSquare size={11} style={{ flexShrink: 0, marginTop: 2 }} /> <span>{e.subject || e.message}</span></div>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{DT(e.created_at)}</td>
                  <td><span className={`badge ${STATUS_BADGE[e.status] || 'badge-neutral'}`}>{e.status}</span></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <select className="input" style={{ width: 'auto', fontSize: 12, padding: '4px 8px' }} value={e.status}
                        disabled={busy === e.id} onChange={ev => changeStatus(e, ev.target.value)} title="Change status">
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className="btn-icon" style={{ color: 'var(--error)' }} onClick={() => remove(e)} disabled={busy === e.id} title="Delete">
                        <Trash2 size={13} />
                      </button>
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
