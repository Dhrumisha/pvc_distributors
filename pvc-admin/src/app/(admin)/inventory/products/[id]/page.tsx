'use client';
// src/app/(admin)/inventory/products/[id]/page.tsx — Product detail / SKUs
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { productService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Package, Boxes } from 'lucide-react';

const FMT = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function ProductDetailPage() {
  const { id } = useParams();
  const pId = Number(id);
  const [product, setProduct] = useState<any>(null);
  const [dimensions, setDimensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            <h1 className="page-title flex items-center gap-2"><Package size={18} style={{ color: 'var(--accent)' }} /> {product.name}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{product.category?.name || 'Uncategorized'}</p>
          </div>
        </div>
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
        <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="section-title flex items-center gap-2"><Boxes size={15} /> SKUs &amp; Dimensions</h2>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>SKU</th><th>Dimension</th><th>Selling Price</th><th>Current Stock</th></tr></thead>
            <tbody>
              {dimensions.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No SKUs defined for this product</td></tr>
              ) : dimensions.map((d, i) => {
                const low = product.low_stock_threshold != null && Number(d.current_qty) <= Number(product.low_stock_threshold);
                return (
                  <tr key={d.id || i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{d.sku || '—'}</td>
                    <td>{d.dimension_label || '—'}</td>
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
      </div>
    </div>
  );
}
