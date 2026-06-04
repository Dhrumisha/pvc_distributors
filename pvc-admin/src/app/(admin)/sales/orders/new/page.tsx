'use client';
// src/app/(admin)/sales/orders/new/page.tsx — Create a new sales order
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { salesOrderService, customerService, productService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, ShoppingCart, Phone, AlertTriangle } from 'lucide-react';

const FMT = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface LineItem {
  product_id: string;
  product_dimension_id: string;
  qty: string;
  unit_price: string;
  gst_rate: string;
  discount_pct: string;
}

const emptyItem = (): LineItem => ({ product_id: '', product_dimension_id: '', qty: '1', unit_price: '0', gst_rate: '0', discount_pct: '0' });

export default function NewOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products,  setProducts]  = useState<any[]>([]);
  const [dimsByProduct, setDims]  = useState<Record<string, any[]>>({});
  const [loading, setLoading]     = useState(true);
  const [saving,  setSaving]      = useState(false);

  const [form, setForm] = useState({ customer_id: '', delivery_type: 'our_vehicle', required_date: '', notes: '' });
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  useEffect(() => {
    (async () => {
      try {
        const [cs, ps] = await Promise.all([
          customerService.list({ limit: 200 }),
          productService.list({ limit: 200 }),
        ]);
        setCustomers(cs.data.data?.customers || cs.data.data || []);
        setProducts(ps.data.data?.products || ps.data.data || []);
      } catch (e) { toast.error(getApiError(e)); }
      finally { setLoading(false); }
    })();
  }, []);

  const selectedCustomer = customers.find(c => String(c.id) === form.customer_id);

  const loadDims = useCallback(async (productId: string) => {
    if (!productId || dimsByProduct[productId]) return;
    try {
      const res = await productService.getDimensions(Number(productId));
      setDims(prev => ({ ...prev, [productId]: res.data.data?.dimensions || res.data.data || [] }));
    } catch { setDims(prev => ({ ...prev, [productId]: [] })); }
  }, [dimsByProduct]);

  const setItem = (idx: number, patch: Partial<LineItem>) =>
    setItems(arr => arr.map((it, i) => i === idx ? { ...it, ...patch } : it));

  const onProductChange = async (idx: number, productId: string) => {
    setItem(idx, { product_id: productId, product_dimension_id: '', unit_price: '0' });
    await loadDims(productId);
    const prod = products.find(p => String(p.id) === productId);
    if (prod?.gst_rate != null) setItem(idx, { gst_rate: String(prod.gst_rate) });
  };

  const onDimChange = (idx: number, dimId: string) => {
    const it = items[idx];
    const dim = (dimsByProduct[it.product_id] || []).find(d => String(d.id) === dimId);
    const price = dim?.selling_price ?? dim?.price ?? dim?.mrp ?? '';
    setItem(idx, { product_dimension_id: dimId, ...(price !== '' ? { unit_price: String(price) } : {}) });
  };

  const lineTotal = (it: LineItem) => {
    const q = parseFloat(it.qty) || 0, p = parseFloat(it.unit_price) || 0, d = parseFloat(it.discount_pct) || 0;
    return q * p * (1 - d / 100);
  };
  const lineTax = (it: LineItem) => {
    const q = parseFloat(it.qty) || 0, p = parseFloat(it.unit_price) || 0, g = parseFloat(it.gst_rate) || 0;
    return q * p * g / 100;
  };
  const subtotal = items.reduce((s, it) => s + lineTotal(it), 0);
  const taxTotal = items.reduce((s, it) => s + lineTax(it), 0);
  const grand    = subtotal + taxTotal;

  const submit = async () => {
    if (!form.customer_id) { toast.error('Select a customer.'); return; }
    const validItems = items.filter(it => it.product_dimension_id && parseFloat(it.qty) > 0);
    if (validItems.length === 0) { toast.error('Add at least one product with a quantity.'); return; }
    setSaving(true);
    try {
      const payload = {
        customer_id: Number(form.customer_id),
        delivery_type: form.delivery_type,
        required_date: form.required_date || null,
        notes: form.notes || undefined,
        items: validItems.map(it => ({
          product_dimension_id: Number(it.product_dimension_id),
          qty: parseFloat(it.qty),
          unit_price: parseFloat(it.unit_price) || 0,
          gst_rate: parseFloat(it.gst_rate) || 0,
          discount_pct: parseFloat(it.discount_pct) || 0,
        })),
      };
      const res = await salesOrderService.create(payload);
      const id = res.data.data?.order?.id;
      toast.success('Order created');
      router.push(id ? `/sales/orders/${id}` : '/sales/orders');
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="space-y-5 animate-slide-up" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/sales/orders" className="btn-icon"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="page-title flex items-center gap-2"><ShoppingCart size={18} style={{ color: 'var(--accent)' }} /> New Sales Order</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Pick a customer, add products, and create the order.</p>
        </div>
      </div>

      {/* Customer + meta */}
      <div className="card p-5 space-y-4">
        <h2 className="section-title">Order Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select className="input" value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
              <option value="">Select a customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
            {selectedCustomer && (
              <span className="form-hint flex items-center gap-1" style={{ marginTop: 6 }}>
                <Phone size={11} />
                {selectedCustomer.phone
                  ? <>WhatsApp/contact: <strong style={{ color: 'var(--text-secondary)' }}>{selectedCustomer.phone}</strong></>
                  : <span style={{ color: 'var(--warning)' }}>No phone on file — add one on the customer so reminders can reach them.</span>}
              </span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Delivery Type *</label>
            <select className="input" value={form.delivery_type} onChange={e => setForm(f => ({ ...f, delivery_type: e.target.value }))}>
              <option value="our_vehicle">Our Vehicle</option>
              <option value="customer_vehicle">Customer Vehicle</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Required Date</label>
            <input type="date" className="input" value={form.required_date} onChange={e => setForm(f => ({ ...f, required_date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="input" placeholder="Optional" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        {selectedCustomer?.is_on_hold === 1 && (
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: 'var(--error)' }}>
            <AlertTriangle size={14} /> This customer is on hold — release the hold before the order can be created.
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="card">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="section-title">Products</h2>
          <button className="btn-secondary" onClick={() => setItems(a => [...a, emptyItem()])}><Plus size={14} /> Add Item</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th style={{ minWidth: 160 }}>Product</th><th style={{ minWidth: 150 }}>SKU / Dimension</th><th>Qty</th><th>Unit Price</th><th>GST %</th><th>Disc %</th><th>Line Total</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td>
                    <select className="input" value={it.product_id} onChange={e => onProductChange(idx, e.target.value)}>
                      <option value="">Select…</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="input" value={it.product_dimension_id} disabled={!it.product_id}
                      onChange={e => onDimChange(idx, e.target.value)}>
                      <option value="">{it.product_id ? 'Select SKU…' : '—'}</option>
                      {(dimsByProduct[it.product_id] || []).map(d => (
                        <option key={d.id} value={d.id}>{d.sku}{d.dimension_label ? ` · ${d.dimension_label}` : ''}</option>
                      ))}
                    </select>
                  </td>
                  <td><input type="number" min="0" step="any" className="input" style={{ width: 80 }} value={it.qty} onChange={e => setItem(idx, { qty: e.target.value })} /></td>
                  <td><input type="number" min="0" step="any" className="input" style={{ width: 100 }} value={it.unit_price} onChange={e => setItem(idx, { unit_price: e.target.value })} /></td>
                  <td><input type="number" min="0" max="100" step="any" className="input" style={{ width: 70 }} value={it.gst_rate} onChange={e => setItem(idx, { gst_rate: e.target.value })} /></td>
                  <td><input type="number" min="0" max="100" step="any" className="input" style={{ width: 70 }} value={it.discount_pct} onChange={e => setItem(idx, { discount_pct: e.target.value })} /></td>
                  <td style={{ fontWeight: 600 }}>{FMT(lineTotal(it))}</td>
                  <td>
                    {items.length > 1 && (
                      <button className="btn-icon" style={{ color: 'var(--error)' }} onClick={() => setItems(a => a.filter((_, i) => i !== idx))}><Trash2 size={13} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Totals */}
        <div className="flex justify-end p-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ width: 260, fontSize: 13 }} className="space-y-1.5">
            <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Subtotal</span><span>{FMT(subtotal)}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Tax (GST)</span><span>{FMT(taxTotal)}</span></div>
            <div className="flex justify-between" style={{ fontWeight: 700, fontSize: 15, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}><span>Total</span><span>{FMT(grand)}</span></div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/sales/orders" className="btn-secondary">Cancel</Link>
        <button className="btn-primary" onClick={submit} disabled={saving}>
          {saving ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Creating…</span> : <><ShoppingCart size={14} /> Create Order</>}
        </button>
      </div>
    </div>
  );
}
