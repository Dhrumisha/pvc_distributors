'use client';
// src/app/(admin)/suppliers/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { supplierService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Edit2, Truck, ChevronLeft, ChevronRight, X, Phone, Mail,
} from 'lucide-react';

const FMT = (n: any) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function SuppliersPage() {
  const [suppliers,  setSuppliers]  = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState<any>(null);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState({
    name: '', contact_person: '', phone: '', email: '',
    gst_number: '', address: '', city: '', state: '', pincode: '',
    payment_terms: '', credit_days: '0',
  });
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supplierService.list({ page, limit: LIMIT, search: search || undefined });
      setSuppliers(res.data.data?.suppliers || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const blankForm = () => ({
    name: '', contact_person: '', phone: '', email: '',
    gst_number: '', address: '', city: '', state: '', pincode: '',
    payment_terms: '', credit_days: '0',
  });

  const openAdd = () => {
    setEditing(null);
    setForm(blankForm());
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name || '',
      contact_person: s.contact_person || '',
      phone: s.phone || '',
      email: s.email || '',
      gst_number: s.gst_number || '',
      address: s.address || '',
      city: s.city || '',
      state: s.state || '',
      pincode: s.pincode || '',
      payment_terms: s.payment_terms || '',
      credit_days: String(s.credit_days ?? 0),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Supplier name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await supplierService.update(editing.id, form);
        toast.success('Supplier updated');
      } else {
        await supplierService.create(form);
        toast.success('Supplier added');
      }
      setShowModal(false);
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} suppliers registered</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Supplier</button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 30 }} placeholder="Search by name, GST, phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {search && <button className="btn-icon" onClick={() => setSearch('')}><X size={13} /></button>}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>GST No.</th>
                <th>Location</th>
                <th>Payment Terms</th>
                <th>Credit Days</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : suppliers.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state py-12">
                    <Truck size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No suppliers found</p>
                    <p className="empty-state-desc">Add your first supplier to get started.</p>
                    <button className="btn-primary mt-3" onClick={openAdd}><Plus size={14} /> Add Supplier</button>
                  </div>
                </td></tr>
              ) : suppliers.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="td-primary">{s.name}</div>
                    {s.contact_person && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.contact_person}</div>}
                  </td>
                  <td>
                    <div className="flex flex-col gap-0.5">
                      {s.phone && <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10} style={{ color: 'var(--text-muted)' }} /> {s.phone}</span>}
                      {s.email && <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={10} /> {s.email}</span>}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.gst_number || '—'}</td>
                  <td style={{ fontSize: 12 }}>
                    {[s.city, s.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td style={{ fontSize: 12 }}>{s.payment_terms || '—'}</td>
                  <td style={{ fontSize: 12 }}>{s.credit_days ?? '—'} days</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button className="btn-icon" onClick={() => openEdit(s)} title="Edit"><Edit2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
            <div className="flex gap-1">
              <button className="btn-icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width: 30, height: 30, borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid', cursor: 'pointer', background: page === p ? 'var(--accent-muted)' : 'transparent', color: page === p ? 'var(--accent)' : 'var(--text-muted)', borderColor: page === p ? 'var(--accent-border)' : 'var(--border-default)' }}>{p}</button>
              ))}
              <button className="btn-icon" disabled={page === pages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="card w-full max-w-xl p-6 animate-slide-up overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">{editing ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Supplier Name *</label>
                <input className="input" placeholder="e.g. ABC Plastics Pvt. Ltd." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input className="input" placeholder="Name" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="input" placeholder="+91..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="input" placeholder="supplier@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input className="input" placeholder="27XXXXX..." value={form.gst_number} onChange={e => setForm(f => ({ ...f, gst_number: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="input" rows={2} placeholder="Street address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="input" placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input className="input" placeholder="State" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input className="input" placeholder="400001" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Payment Terms</label>
                  <input className="input" placeholder="e.g. Net 30" value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))} />
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
