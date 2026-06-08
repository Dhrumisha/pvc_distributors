'use client';
// src/app/(admin)/admin/portal/page.tsx — Customer Portal settings: per-type discounts + approvals
import { useEffect, useState, useCallback } from 'react';
import { portalAdminService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Percent, Save, UserCheck, Inbox, RefreshCw, ShieldCheck } from 'lucide-react';

interface TypeDiscount { customer_type: string; label: string; discount_percent: number; credit_allowed: boolean; }
interface Pending { id: number; business_name: string; contact_person?: string; email?: string; phone?: string; customer_type?: string; created_at?: string; }

const TYPES = ['retail', 'wholesale_a', 'wholesale_b', 'custom'];

export default function PortalSettingsPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const isAdmin = hasRole('Admin');

  const [rows, setRows] = useState<TypeDiscount[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTd, setSavingTd] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  // per-pending approval form
  const [appr, setAppr] = useState<Record<number, { customer_type: string; credit_limit: string; credit_days: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [td, pd] = await Promise.all([portalAdminService.typeDiscounts(), portalAdminService.pending()]);
      setRows(td.data.data?.type_discounts || []);
      setPending(pd.data.data?.customers || []);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!isAdmin) router.replace('/dashboard'); }, [isAdmin, router]);

  const setRow = (i: number, patch: Partial<TypeDiscount>) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const saveTd = async () => {
    setSavingTd(true);
    try { await portalAdminService.saveTypeDiscounts(rows); toast.success('Discounts saved'); load(); }
    catch (e) { toast.error(getApiError(e)); }
    finally { setSavingTd(false); }
  };

  const approve = async (c: Pending) => {
    const f = appr[c.id] || { customer_type: c.customer_type || 'wholesale_a', credit_limit: '0', credit_days: '0' };
    setBusy(c.id);
    try {
      await portalAdminService.approve(c.id, {
        customer_type: f.customer_type,
        credit_limit: Number(f.credit_limit) || 0,
        credit_days: Number(f.credit_days) || 0,
      });
      toast.success(`${c.business_name} approved`);
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setBusy(null); }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h1 className="page-title flex items-center gap-2"><ShieldCheck size={20} style={{ color: 'var(--accent)' }} /> Customer Portal</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Set discounts per customer type and approve website registrations for trade pricing &amp; credit (Udhaar).</p>
      </div>

      {/* Type discounts */}
      <div className="card">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="section-title flex items-center gap-2"><Percent size={15} /> Discount &amp; Credit by Customer Type</h2>
          <div className="flex gap-2">
            <button className="btn-icon" onClick={load} title="Refresh"><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /></button>
            <button className="btn-primary" onClick={saveTd} disabled={savingTd}>
              {savingTd ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><Save size={14} /> Save</>}
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Customer Type</th><th>Label</th><th>Discount %</th><th>Credit (Udhaar) allowed</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8"><div className="spinner mx-auto" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No types configured</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.customer_type}>
                  <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{r.customer_type.replace('_', ' ')}</td>
                  <td><input className="input" style={{ maxWidth: 160 }} value={r.label} onChange={e => setRow(i, { label: e.target.value })} /></td>
                  <td>
                    <div className="flex items-center gap-1" style={{ maxWidth: 110 }}>
                      <input type="number" min="0" max="100" step="0.5" className="input" value={r.discount_percent}
                        onChange={e => setRow(i, { discount_percent: Number(e.target.value) })} />
                      <span style={{ color: 'var(--text-muted)' }}>%</span>
                    </div>
                  </td>
                  <td>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!r.credit_allowed} onChange={e => setRow(i, { credit_allowed: e.target.checked })} />
                      <span className={`badge ${r.credit_allowed ? 'badge-success' : 'badge-neutral'}`}>{r.credit_allowed ? 'Allowed' : 'No credit'}</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-muted)' }}>
          A customer's discount comes from their type here, unless you set a per-customer override on the customer's profile. Credit (Udhaar) only works once a customer is <b>approved</b>.
        </div>
      </div>

      {/* Pending approvals */}
      <div className="card">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="section-title flex items-center gap-2"><Inbox size={15} /> Pending Registrations ({pending.length})</h2>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Business</th><th>Contact</th><th>Assign Type</th><th>Credit Limit ₹</th><th>Credit Days</th><th>Action</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8"><div className="spinner mx-auto" /></td></tr>
              ) : pending.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state py-10"><UserCheck size={30} className="empty-state-icon" /><p className="empty-state-title">No pending registrations</p><p className="empty-state-desc">New website sign-ups will appear here for approval.</p></div></td></tr>
              ) : pending.map(c => {
                const f = appr[c.id] || { customer_type: 'wholesale_a', credit_limit: '0', credit_days: '30' };
                const upd = (patch: any) => setAppr(a => ({ ...a, [c.id]: { ...f, ...patch } }));
                return (
                  <tr key={c.id}>
                    <td><div className="td-primary">{c.business_name}</div>{c.contact_person && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.contact_person}</div>}</td>
                    <td style={{ fontSize: 12 }}>{c.email}<br />{c.phone}</td>
                    <td>
                      <select className="input" style={{ maxWidth: 150 }} value={f.customer_type} onChange={e => upd({ customer_type: e.target.value })}>
                        {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td><input type="number" className="input" style={{ maxWidth: 120 }} value={f.credit_limit} onChange={e => upd({ credit_limit: e.target.value })} /></td>
                    <td><input type="number" className="input" style={{ maxWidth: 90 }} value={f.credit_days} onChange={e => upd({ credit_days: e.target.value })} /></td>
                    <td>
                      <button className="btn-primary" onClick={() => approve(c)} disabled={busy === c.id}>
                        {busy === c.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><UserCheck size={14} /> Approve</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
