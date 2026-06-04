'use client';
// src/app/(admin)/inventory/restock/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { restockCartService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Trash2, Wand2, ArrowRightCircle,
} from 'lucide-react';

export default function RestockCartPage() {
  const [cart,        setCart]        = useState<any>(null);
  const [items,       setItems]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [suggesting,  setSuggesting]  = useState(false);
  const [converting,  setConverting]  = useState(false);
  const [removingId,  setRemovingId]  = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await restockCartService.get();
      setCart(res.data.data?.cart || null);
      setItems(res.data.data?.items || []);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAutoSuggest = async () => {
    setSuggesting(true);
    try {
      await restockCartService.autoSuggest();
      toast.success('Auto-suggest applied — cart updated');
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSuggesting(false); }
  };

  const handleRemove = async (id: number) => {
    setRemovingId(id);
    try {
      await restockCartService.removeItem(id);
      toast.success('Item removed');
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setRemovingId(null); }
  };

  const handleConvert = async () => {
    if (!items.length) { toast.error('Cart is empty'); return; }
    if (!confirm('Convert this restock cart into a Purchase Order draft?')) return;
    setConverting(true);
    try {
      const res = await restockCartService.convert();
      const poNumber = res.data.data?.purchase_order?.po_number || 'PO';
      toast.success(`Purchase Order ${poNumber} created`);
      load();
    } catch (e) { toast.error(getApiError(e)); }
    finally { setConverting(false); }
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Restock Cart</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {items.length} item{items.length !== 1 ? 's' : ''} in cart
            {cart?.name ? ` · ${cart.name}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={handleAutoSuggest}
            disabled={suggesting || loading}
          >
            {suggesting
              ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 13, height: 13 }} /> Suggesting...</span>
              : <><Wand2 size={14} /> Auto-suggest</>}
          </button>
          <button
            className="btn-primary"
            onClick={handleConvert}
            disabled={converting || loading || items.length === 0}
          >
            {converting
              ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 13, height: 13 }} /> Converting...</span>
              : <><ArrowRightCircle size={14} /> Convert to PO</>}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Dimension</th>
                <th>Current Stock</th>
                <th>Suggested Qty</th>
                <th>Override Qty</th>
                <th>Purchase Price</th>
                <th>Reason</th>
                <th style={{ width: 60 }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10">
                    <div className="spinner mx-auto" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state py-14">
                      <ShoppingCart size={36} className="empty-state-icon" />
                      <p className="empty-state-title">Restock cart is empty</p>
                      <p className="empty-state-desc">
                        Use Auto-suggest to populate items below the low-stock threshold.
                      </p>
                      <button className="btn-primary mt-3" onClick={handleAutoSuggest} disabled={suggesting}>
                        <Wand2 size={14} /> Auto-suggest
                      </button>
                    </div>
                  </td>
                </tr>
              ) : items.map((item: any) => (
                <tr key={item.id}>
                  <td>
                    <div className="td-primary">{item.name || '—'}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{item.sku || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.dimension_label || '—'}</td>
                  <td style={{ fontWeight: 600 }}>
                    {item.current_stock != null
                      ? Number(item.current_stock).toLocaleString('en-IN')
                      : '—'}
                  </td>
                  <td>{item.suggested_qty != null ? Number(item.suggested_qty).toLocaleString('en-IN') : '—'}</td>
                  <td>
                    {item.override_qty != null
                      ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{Number(item.override_qty).toLocaleString('en-IN')}</span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {item.purchase_price != null
                      ? `₹${Number(item.purchase_price).toLocaleString('en-IN')}`
                      : '—'}
                  </td>
                  <td>
                    {item.added_reason
                      ? <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{item.added_reason}</span>
                      : '—'}
                  </td>
                  <td>
                    <button
                      className="btn-icon"
                      style={{ color: 'var(--error)' }}
                      onClick={() => handleRemove(item.id)}
                      disabled={removingId === item.id}
                      title="Remove item"
                    >
                      {removingId === item.id
                        ? <span className="spinner" style={{ width: 12, height: 12 }} />
                        : <Trash2 size={13} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cart status footer */}
        {cart && cart.status === 'converted' && (
          <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span className="badge badge-success" style={{ marginRight: 8 }}>Converted</span>
            This cart was already converted to a Purchase Order.
          </div>
        )}
      </div>
    </div>
  );
}
