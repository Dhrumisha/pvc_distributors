'use client';
// src/app/(admin)/inventory/products/[id]/page.tsx — Product detail / SKUs (with add-variant)
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { productService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Package, Boxes, Plus, X } from 'lucide-react';

const FMT = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const emptyVariant = { sku: '', dimension_label: '', color: '', purchase_price: '', selling_price: '' };

export default function ProductDetailPage() {
  const { id } = useParams();
  const pId = Number(id);
  const [product, setProduct] = useState<any>(null);
  const [dimensions, setDimensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [vform, setVform] = useState(emptyVariant);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.get(pId);
      const d = res.data.data;
      setProduct(d.product ?? d);
      setDimensions(d.dimensions || []);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [pId]);

  useEffect(() => { if (pId) load(); }, [pId, load]);

  const addVariant = async () => {
    if (!vform.sku.trim() || !vform.dimension_label.trim()) { toast.error('SKU and dimension/spec are required.'); return; }
    if (!vform.selling_price) { toast.error('Selling price is required.'); return; }
    setSaving(true);
    try {
      await productService.addDimension(pId, {
        sku: vform.sku.trim(),
        dimension_label: vform.dimension_label.trim(),
        color: vform.color || undefined,
        purchase_price: Number(vform.purchase_price) || 0,
        selling_price: Number(vform.selling_price) || 0,
      });
      toast.success('Variant added');
      setVform(emptyVariant); setShowAdd(false); load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  if (!product) return (
    <div className="empty-state py-20">
      <p className="empty-state-title">Product not found</p>
      <Link href="/inventory/products" className="btn-secondary mt-3"><ArrowLeft size={14} /> Back</Link>
    </div>
  );

  return (
    <div className="space-y-5 animate-slide-up" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/inventory/products" className="btn-icon"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="page-title flex items-center gap-2"><Package size={18} style={{ color: 'var(--accent)' }} /> {product.name}
              {product.badge && <span className="badge badge-accent" style={{ fontSize: 11 }}>{product.badge}</span>}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{product.category?.name || 'Uncategorized'}</p>
          </div>
        </div>
        {product.image_url && <img src={product.image_url} alt={product.name} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border-default)' }} />}
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Unit', product.unit || '—'],
          ['HSN Code', product.hsn_code || '—'],
          ['GST Rate', product.gst_rate != null ? `${product.gst_rate}%` : '—'],
          ['Low Stock At', String(product.low_stock_threshold ?? '—')],
        ].map(([label, val]) => (
          <div className="card p-4" key={label as string}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* SKUs / dimensions */}
      <div className="card">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="section-title flex items-center gap-2"><Boxes size={15} /> SKUs / Variants ({dimensions.length})</h2>
          <button className="btn-primary" onClick={() => { setVform(emptyVariant); setShowAdd(true); }}><Plus size={14} /> Add Variant</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>SKU</th><th>Dimension / Spec</th><th>Color</th><th>Selling Price</th><th>Current Stock</th></tr></thead>
            <tbody>
              {dimensions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No variants yet — add one so it can be sold &amp; shown on the website.</td></tr>
              ) : dimensions.map((d, i) => {
                const low = product.low_stock_threshold != null && Number(d.current_qty) <= Number(product.low_stock_threshold);
                return (
                  <tr key={d.id || i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{d.sku || '—'}</td>
                    <td>{d.dimension_label || '—'}</td>
                    <td>
                      {d.color ? (
                        <span className="flex items-center gap-1.5">
                          <span style={{ width: 14, height: 14, borderRadius: '50%', background: d.color, border: '1px solid var(--border-default)', display: 'inline-block' }} />
                          <span style={{ fontSize: 12 }}>{d.color}</span>
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>{FMT(d.selling_price ?? d.price ?? d.mrp)}</td>
                    <td>
                      <span className={`badge ${low ? 'badge-warning' : 'badge-success'}`}>
                        {Number(d.current_qty || 0)} {low ? '· Low' : ''}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-muted)' }}>
          Stock is managed in <Link href="/inventory/stock" style={{ color: 'var(--accent)' }}>Stock Ledger</Link> (opening balance / receipts). The website hides out-of-stock variants from ordering.
        </div>
      </div>

      {/* Add Variant modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">Add Variant / SKU</h2>
              <button className="btn-icon" onClick={() => setShowAdd(false)}><X size={14} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input className="input" placeholder="ACP-4-RED" value={vform.sku} onChange={e => setVform(f => ({ ...f, sku: e.target.value }))} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input className="input" placeholder="e.g. Red, #c0392b" value={vform.color} onChange={e => setVform(f => ({ ...f, color: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Dimension / Spec *</label>
                <input className="input" placeholder='e.g. 4mm · 8x4 ft' value={vform.dimension_label} onChange={e => setVform(f => ({ ...f, dimension_label: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Purchase Price (₹)</label>
                  <input type="number" min="0" className="input" value={vform.purchase_price} onChange={e => setVform(f => ({ ...f, purchase_price: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price (₹) *</label>
                  <input type="number" min="0" className="input" value={vform.selling_price} onChange={e => setVform(f => ({ ...f, selling_price: e.target.value }))} />
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Tip: for a colour swatch on the website, use a CSS colour name or hex (e.g. <code>Red</code> or <code>#c0392b</code>).
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={addVariant} disabled={saving}>
                {saving ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Adding…</span> : 'Add Variant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
