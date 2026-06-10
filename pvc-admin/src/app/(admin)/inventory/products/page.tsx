'use client';
// src/app/(admin)/inventory/products/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { productService, categoryService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, Edit2, Trash2, Eye, AlertTriangle,
  Package, ChevronLeft, ChevronRight, X
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category?: { name: string };
  unit: string;
  gst_rate: number;
  low_stock_threshold: number;
  is_active: number;
  image_url?: string;
  badge?: string;
  dimensions?: { sku: string; selling_price: number; current_qty?: number }[];
}

const UNITS = ['piece','sheet','meter','kg','bundle'];

export default function ProductsPage() {
  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState('');
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [showModal,   setShowModal]   = useState(false);
  const [editing,     setEditing]     = useState<Product | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState<number | null>(null);
  const [form,        setForm]        = useState({ name:'', category_id:'', unit:'piece', hsn_code:'', gst_rate:'0', low_stock_threshold:'10', image_url:'', badge:'' });
  const [toggling,    setToggling]    = useState<number | null>(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.list({ page, limit: LIMIT, search: search || undefined, category_id: catFilter || undefined });
      setProducts(res.data.data?.products || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [page, search, catFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    categoryService.list().then(r => setCategories(r.data.data?.categories || r.data.data || [])).catch(() => {});
  }, []);
  useEffect(() => { setPage(1); }, [search, catFilter]);

  const openAdd = () => { setEditing(null); setForm({ name:'',category_id:'',unit:'piece',hsn_code:'',gst_rate:'0',low_stock_threshold:'10',image_url:'',badge:'' }); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name:p.name, category_id:'', unit:p.unit, hsn_code:'', gst_rate:String(p.gst_rate), low_stock_threshold:String(p.low_stock_threshold), image_url:p.image_url||'', badge:p.badge||'' });
    setShowModal(true);
  };

  const toggleActive = async (p: Product) => {
    setToggling(p.id);
    try {
      await productService.update(p.id, { is_active: p.is_active ? 0 : 1 });
      toast.success(p.is_active ? 'Product hidden from website' : 'Product published to website');
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setToggling(null); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Product name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await productService.update(editing.id, form);
        toast.success('Product updated');
      } else {
        await productService.create(form);
        toast.success('Product created');
      }
      setShowModal(false); load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await productService.remove(id);
      toast.success('Product deleted');
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setDeleting(null); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Products</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {total} products · PVC sheets, pipes, accessories
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 30 }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="input" style={{ width: 'auto', minWidth: 160 }}
          value={catFilter} onChange={e => setCatFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(search || catFilter) && (
          <button className="btn-icon" onClick={() => { setSearch(''); setCatFilter(''); }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Unit</th>
                <th>GST %</th>
                <th>Low Stock Alert</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="spinner mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state py-12">
                      <Package size={32} className="empty-state-icon" />
                      <p className="empty-state-title">No products found</p>
                      <p className="empty-state-desc">Try adjusting filters or add your first product.</p>
                      <button className="btn-primary mt-3" onClick={openAdd}><Plus size={14} /> Add Product</button>
                    </div>
                  </td>
                </tr>
              ) : products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="td-primary">{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {p.dimensions?.length || 0} SKUs
                    </div>
                  </td>
                  <td>{p.category?.name || '—'}</td>
                  <td><span className="badge badge-neutral">{p.unit}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.gst_rate}%</td>
                  <td>
                    <span className="badge badge-warning">
                      <AlertTriangle size={10} /> {p.low_stock_threshold}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => toggleActive(p)} disabled={toggling === p.id}
                      title={p.is_active ? 'Published on website — click to hide' : 'Hidden — click to publish'}
                      className={`badge ${p.is_active ? 'badge-success' : 'badge-neutral'}`}
                      style={{ cursor: 'pointer', border: 'none' }}>
                      {toggling === p.id ? '…' : (p.is_active ? '● Published' : '○ Hidden')}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <a href={`/inventory/products/${p.id}`} className="btn-icon" title="View SKUs">
                        <Eye size={13} />
                      </a>
                      <button className="btn-icon" onClick={() => openEdit(p)} title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--error)' }}
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        title="Delete"
                      >
                        {deleting === p.id ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button className="btn-icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{
                    width: 30, height: 30, borderRadius: 6, fontSize: 12, fontWeight: 600,
                    border: '1px solid', cursor: 'pointer',
                    background: page === p ? 'var(--accent-muted)' : 'transparent',
                    color: page === p ? 'var(--accent)' : 'var(--text-muted)',
                    borderColor: page === p ? 'var(--accent-border)' : 'var(--border-default)',
                  }}>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="input" placeholder="e.g. PVC Sheet" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">HSN Code</label>
                  <input className="input" placeholder="e.g. 3921" value={form.hsn_code} onChange={e => setForm(f => ({ ...f, hsn_code: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Rate (%)</label>
                  <input type="number" className="input" min="0" max="100" value={form.gst_rate} onChange={e => setForm(f => ({ ...f, gst_rate: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Low Stock Alert Threshold</label>
                <input type="number" className="input" min="0" value={form.low_stock_threshold} onChange={e => setForm(f => ({ ...f, low_stock_threshold: e.target.value }))} />
                <span className="form-hint">Alert when stock falls below this number</span>
              </div>
              <div className="form-group">
                <label className="form-label">Image URL <span style={{ color: 'var(--text-muted)' }}>(for website)</span></label>
                <input className="input" placeholder="https://...jpg" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
                <span className="form-hint">Paste a hosted image link — shown on the public website &amp; shop.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Badge / Tag <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
                <input className="input" placeholder="e.g. New, Sale, Bestseller" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} />
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
