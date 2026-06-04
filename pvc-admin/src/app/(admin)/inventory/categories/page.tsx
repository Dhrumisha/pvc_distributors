'use client';
// src/app/(admin)/inventory/categories/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { categoryService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Tag, Edit2, Trash2, X, ChevronLeft, ChevronRight,
} from 'lucide-react';

const LIMIT = 20;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState<any | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form,       setForm]       = useState({
    name: '',
    parent_id: '',
    description: '',
    hsn_code: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryService.list({ page, limit: LIMIT, search: search || undefined });
      setCategories(res.data.data?.categories || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', parent_id: '', description: '', hsn_code: '' });
    setShowModal(true);
  };

  const openEdit = (cat: any) => {
    setEditing(cat);
    setForm({
      name: cat.name || '',
      parent_id: cat.parent_id != null ? String(cat.parent_id) : '',
      description: cat.description || '',
      hsn_code: cat.hsn_code || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        description: form.description || null,
        hsn_code: form.hsn_code || null,
      };
      if (editing) {
        await categoryService.update(editing.id, payload);
        toast.success('Category updated');
      } else {
        await categoryService.create(payload);
        toast.success('Category created');
      }
      setShowModal(false);
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cat: any) => {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    setDeletingId(cat.id);
    try {
      await categoryService.remove(cat.id);
      toast.success('Category deleted');
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setDeletingId(null); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Categories</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {total} categories defined
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={15} /> New Category
        </button>
      </div>

      {/* Search */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 30 }}
            placeholder="Search categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <button className="btn-icon" onClick={() => setSearch('')}><X size={13} /></button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Parent ID</th>
                <th>HSN Code</th>
                <th>Description</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="spinner mx-auto" />
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state py-12">
                      <Tag size={32} className="empty-state-icon" />
                      <p className="empty-state-title">No categories found</p>
                      <p className="empty-state-desc">Create a category to organise your products.</p>
                      <button className="btn-primary mt-3" onClick={openAdd}>
                        <Plus size={14} /> New Category
                      </button>
                    </div>
                  </td>
                </tr>
              ) : categories.map((cat: any) => (
                <tr key={cat.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}
                      >
                        <Tag size={12} style={{ color: 'var(--accent)' }} />
                      </div>
                      <div className="td-primary">{cat.name}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {cat.parent_id != null ? `#${cat.parent_id}` : '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {cat.hsn_code || '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 280 }}>
                    {cat.description || '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {cat.created_at ? new Date(cat.created_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button className="btn-icon" onClick={() => openEdit(cat)} title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--error)' }}
                        onClick={() => handleDelete(cat)}
                        disabled={deletingId === cat.id}
                        title="Delete"
                      >
                        {deletingId === cat.id
                          ? <span className="spinner" style={{ width: 12, height: 12 }} />
                          : <Trash2 size={13} />}
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
                >
                  {p}
                </button>
              ))}
              <button className="btn-icon" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="card w-full max-w-md p-6 animate-slide-up overflow-y-auto"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  className="input"
                  placeholder="e.g. PVC Pipes"
                  autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Parent Category ID</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Leave blank for top-level"
                    value={form.parent_id}
                    onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                  />
                  <span className="form-hint">Numeric ID of the parent category.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">HSN Code</label>
                  <input
                    className="input"
                    placeholder="e.g. 3917"
                    value={form.hsn_code}
                    onChange={e => setForm(f => ({ ...f, hsn_code: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Optional description..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                {saving
                  ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</span>
                  : (editing ? 'Save Changes' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
