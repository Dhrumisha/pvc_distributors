'use client';
// src/app/(admin)/delivery/vehicles/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { vehicleService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Edit2, Truck, ChevronLeft, ChevronRight, X,
} from 'lucide-react';

const VEHICLE_TYPES = ['tempo', 'truck', 'bike', 'auto', 'van', 'other'];

export default function VehiclesPage() {
  const [vehicles,   setVehicles]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState<any | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState({
    vehicle_number: '',
    vehicle_type:   'tempo',
    driver_name:    '',
    driver_phone:   '',
    capacity_kg:    '',
    notes:          '',
  });
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vehicleService.list({ page, limit: LIMIT, search: search || undefined });
      setVehicles(res.data.data?.vehicles || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ vehicle_number: '', vehicle_type: 'tempo', driver_name: '', driver_phone: '', capacity_kg: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (v: any) => {
    setEditing(v);
    setForm({
      vehicle_number: v.vehicle_number || '',
      vehicle_type:   v.vehicle_type   || 'tempo',
      driver_name:    v.driver_name    || '',
      driver_phone:   v.driver_phone   || '',
      capacity_kg:    v.capacity_kg    != null ? String(v.capacity_kg) : '',
      notes:          v.notes          || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.vehicle_number.trim()) { toast.error('Vehicle number is required'); return; }
    setSaving(true);
    try {
      const payload: any = {
        vehicle_number: form.vehicle_number.trim().toUpperCase(),
        vehicle_type:   form.vehicle_type,
        driver_name:    form.driver_name,
        driver_phone:   form.driver_phone || undefined,
        capacity_kg:    form.capacity_kg  ? Number(form.capacity_kg) : undefined,
        notes:          form.notes        || undefined,
      };
      if (editing) {
        await vehicleService.update(editing.id, payload);
        toast.success('Vehicle updated');
      } else {
        await vehicleService.create(payload);
        toast.success('Vehicle added');
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
          <h1 className="page-title">Vehicles</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{total} vehicles registered</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={15} /> Add Vehicle</button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 30 }}
            placeholder="Search by vehicle number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <button className="btn-icon" onClick={() => setSearch('')}><X size={13} /></button>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle Number</th>
                <th>Type</th>
                <th>Driver</th>
                <th>Phone</th>
                <th>Capacity (kg)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : vehicles.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state py-12">
                    <Truck size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No vehicles found</p>
                    <p className="empty-state-desc">Add a vehicle to assign to deliveries.</p>
                    <button className="btn-primary mt-3" onClick={openAdd}><Plus size={14} /> Add Vehicle</button>
                  </div>
                </td></tr>
              ) : vehicles.map((v: any) => (
                <tr key={v.id}>
                  <td>
                    <div className="td-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                      {v.vehicle_number || '—'}
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize', fontSize: 13 }}>{v.vehicle_type || '—'}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{v.driver_name || '—'}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v.driver_phone || '—'}</td>
                  <td style={{ fontSize: 13 }}>
                    {v.capacity_kg != null ? `${Number(v.capacity_kg).toLocaleString('en-IN')} kg` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${v.is_active ? 'badge-success' : 'badge-error'}`}>
                      {v.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button className="btn-icon" onClick={() => openEdit(v)} title="Edit">
                        <Edit2 size={13} />
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
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button className="btn-icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 30, height: 30, borderRadius: 6, fontSize: 12, fontWeight: 600,
                    border: '1px solid', cursor: 'pointer',
                    background: page === p ? 'var(--accent-muted)' : 'transparent',
                    color: page === p ? 'var(--accent)' : 'var(--text-muted)',
                    borderColor: page === p ? 'var(--accent-border)' : 'var(--border-default)',
                  }}
                >{p}</button>
              ))}
              <button className="btn-icon" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="card w-full max-w-lg p-6 animate-slide-up overflow-y-auto"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">{editing ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Vehicle Number *</label>
                  <input
                    className="input"
                    style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                    placeholder="e.g. MH12AB1234"
                    value={form.vehicle_number}
                    onChange={e => setForm(f => ({ ...f, vehicle_number: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select
                    className="input"
                    value={form.vehicle_type}
                    onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))}
                  >
                    {VEHICLE_TYPES.map(t => (
                      <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Driver Name</label>
                  <input
                    className="input"
                    placeholder="Full name"
                    value={form.driver_name}
                    onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Driver Phone</label>
                  <input
                    className="input"
                    placeholder="+91..."
                    value={form.driver_phone}
                    onChange={e => setForm(f => ({ ...f, driver_phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Capacity (kg)</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  placeholder="e.g. 1000"
                  value={form.capacity_kg}
                  onChange={e => setForm(f => ({ ...f, capacity_kg: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Any additional notes..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                {saving
                  ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</span>
                  : (editing ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
