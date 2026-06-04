'use client';
// src/app/(admin)/customers/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { customerService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Eye, Edit2, Lock, Unlock, Users,
  ChevronLeft, ChevronRight, X, Phone, Mail
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: number;
  business_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  customer_type: string;
  credit_limit: number;
  is_on_hold: number;
  gst_number?: string;
}

const TYPE_BADGE: Record<string, string> = {
  retail: 'badge-info', wholesale_a: 'badge-accent', wholesale_b: 'badge-warning', custom: 'badge-neutral',
};

const FMT = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function CustomersPage() {
  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [holdFilter, setHoldFilter] = useState('');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState<Customer | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [toggling,   setToggling]   = useState<number | null>(null);
  const [form,       setForm]       = useState({
    business_name:'', contact_person:'', phone:'', email:'',
    gst_number:'', customer_type:'retail', credit_limit:'0', credit_days:'0'
  });
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerService.list({ page, limit: LIMIT, search: search || undefined, customer_type: typeFilter || undefined, is_on_hold: holdFilter || undefined });
      setCustomers(res.data.data?.customers || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, search, typeFilter, holdFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, typeFilter, holdFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm({ business_name:'', contact_person:'', phone:'', email:'', gst_number:'', customer_type:'retail', credit_limit:'0', credit_days:'0' });
    setShowModal(true);
  };
  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ business_name:c.business_name, contact_person:c.contact_person||'', phone:c.phone||'', email:c.email||'', gst_number:c.gst_number||'', customer_type:c.customer_type, credit_limit:String(c.credit_limit), credit_days:'0' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.business_name.trim()) { toast.error('Business name is required'); return; }
    setSaving(true);
    try {
      if (editing) { await customerService.update(editing.id, form); toast.success('Customer updated'); }
      else         { await customerService.create(form); toast.success('Customer added'); }
      setShowModal(false); load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  const toggleHold = async (c: Customer) => {
    setToggling(c.id);
    try {
      await customerService.setHold(c.id, !c.is_on_hold, !c.is_on_hold ? 'Placed on hold by admin' : undefined);
      toast.success(c.is_on_hold ? 'Customer hold released' : 'Customer placed on hold');
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setToggling(null); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Customers</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} customers registered</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Customer</button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 30 }} placeholder="Search by name, GST, phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 'auto', minWidth: 160 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="retail">Retail</option>
          <option value="wholesale_a">Wholesale A</option>
          <option value="wholesale_b">Wholesale B</option>
          <option value="custom">Custom</option>
        </select>
        <select className="input" style={{ width: 'auto', minWidth: 130 }} value={holdFilter} onChange={e => setHoldFilter(e.target.value)}>
          <option value="">Any Status</option>
          <option value="0">Active Only</option>
          <option value="1">On Hold</option>
        </select>
        {(search||typeFilter||holdFilter) && <button className="btn-icon" onClick={() => { setSearch(''); setTypeFilter(''); setHoldFilter(''); }}><X size={13}/></button>}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Type</th>
                <th>GST No.</th>
                <th>Credit Limit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state py-12">
                    <Users size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No customers found</p>
                    <button className="btn-primary mt-3" onClick={openAdd}><Plus size={14} /> Add Customer</button>
                  </div>
                </td></tr>
              ) : customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="td-primary">{c.business_name}</div>
                    {c.contact_person && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{c.contact_person}</div>}
                  </td>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      {c.phone && <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10} style={{ color: 'var(--text-muted)' }} /> {c.phone}</span>}
                      {c.email && <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={10} /> {c.email}</span>}
                    </div>
                  </td>
                  <td><span className={`badge ${TYPE_BADGE[c.customer_type] || 'badge-neutral'}`}>{c.customer_type.replace('_',' ')}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.gst_number || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{FMT(c.credit_limit)}</td>
                  <td>
                    <span className={`badge ${c.is_on_hold ? 'badge-error' : 'badge-success'}`}>
                      {c.is_on_hold ? '🔒 On Hold' : '✓ Active'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/customers/${c.id}`} className="btn-icon" title="View"><Eye size={13} /></Link>
                      <button className="btn-icon" onClick={() => openEdit(c)} title="Edit"><Edit2 size={13} /></button>
                      <button
                        className="btn-icon"
                        style={{ color: c.is_on_hold ? 'var(--success)' : 'var(--error)' }}
                        onClick={() => toggleHold(c)}
                        disabled={toggling === c.id}
                        title={c.is_on_hold ? 'Release hold' : 'Place on hold'}
                      >
                        {toggling === c.id ? <div className="spinner" style={{ width: 12, height: 12 }} /> : (c.is_on_hold ? <Unlock size={13} /> : <Lock size={13} />)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="card w-full max-w-lg p-6 animate-slide-up overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">{editing ? 'Edit Customer' : 'Add Customer'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Business Name *</label>
                <input className="input" placeholder="e.g. Sharma Furniture Works" value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input className="input" placeholder="Name" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone <span style={{ color: 'var(--accent)' }}>(recommended)</span></label>
                  <input className="input" placeholder="+91 98xxxxxxxx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  <span className="form-hint">Used for WhatsApp payment reminders.</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="input" placeholder="business@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input className="input" placeholder="27XXXXX..." value={form.gst_number} onChange={e => setForm(f => ({ ...f, gst_number: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Type</label>
                  <select className="input" value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))}>
                    <option value="retail">Retail</option>
                    <option value="wholesale_a">Wholesale A</option>
                    <option value="wholesale_b">Wholesale B</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Credit Limit (₹)</label>
                  <input type="number" className="input" min="0" value={form.credit_limit} onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Days</label>
                  <input type="number" className="input" min="0" value={form.credit_days} onChange={e => setForm(f => ({ ...f, credit_days: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</span> : (editing ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
