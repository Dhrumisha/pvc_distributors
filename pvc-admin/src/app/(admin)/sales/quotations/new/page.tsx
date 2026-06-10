'use client';
// src/app/(admin)/sales/quotations/new/page.tsx — Create a new quotation
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quotationService, customerService, productService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, FileText } from 'lucide-react';

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

export default function NewQuotationPage() {
  const router = useRouter();
  const [customers,      setCustomers]     = useState<any[]>([]);
  const [products,       setProducts]      = useState<any[]>([]);
  const [dimsByProduct,  setDims]          = useState<Record<string, any[]>>({});
  const [loading,        setLoading]       = useState(true);
  const [saving,         setSaving]        = useState(false);

  const [form, setForm] = useState({ customer_id: '', valid_until: '', notes: '' });
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
      await quotationService.create({
        customer_id:  Number(form.customer_id),
        valid_until:  form.valid_until || null,
        notes:        form.notes || undefined,
        items: validItems.map(it => ({
          product_dimension_id: Number(it.product_dimension_id),
          qty:          parseFloat(it.qty),
          unit_price:   parseFloat(it.unit_price) || 0,
          gst_rate:     parseFloat(it.gst_rate) || 0,
          discount_pct: parseFloat(it.discount_pct) || 0,
        })),
      });
      toast.success('Quotation created');
      router.push('/sales/quotations');
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="space-y-5 animate-slide-up" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/sales/quotations" className="btn-icon"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText size={18} style={{ color: 'var(--accent)' }} /> New Quotation
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            Pick a customer, add products, and create the quotation.
          </p>
        </div>
      </div>

      {/* Quotation Details */}
      <div className="card p-5 space-y-4">
        <h2 className="section-title">Quotation Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select
              className="input"
              value={form.customer_id}
              onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
            >
              <option value="">Select a customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Valid Until</label>
            <input
              type="date"
              className="input"
              value={form.valid_until}
              onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
            />
            <span className="form-hint">Leave blank if there is no expiry date.</span>
          </div>
          <div className="form-group md:col-span-2">
            <label className="form-label">Notes</label>
            <input
              className="input"
              placeholder="Optional — any remarks for this quotation"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="card">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="section-title">Products</h2>
          <button className="btn-secondary" onClick={() => setItems(a => [...a, emptyItem()])}>
            <Plus size={14} /> Add Item
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ minWidth: 160 }}>Product</th>
                <th style={{ minWidth: 150 }}>SKU / Dimension</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>GST %</th>
                <th>Disc %</th>
                <th>Line Total</th>
                <th></th>
              </tr>
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
                    <select
                      className="input"
                      value={it.product_dimension_id}
                      disabled={!it.product_id}
                      onChange={e => onDimChange(idx, e.target.value)}
                    >
                      <option value="">{it.product_id ? 'Select SKU…' : '—'}</option>
                      {(dimsByProduct[it.product_id] || []).map(d => (
                        <option key={d.id} value={d.id}>
                          {d.sku}{d.dimension_label ? ` · ${d.dimension_label}` : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input type="number" min="0" step="any" className="input" style={{ width: 80 }}
                      value={it.qty} onChange={e => setItem(idx, { qty: e.target.value })} />
                  </td>
                  <td>
                    <input type="number" min="0" step="any" className="input" style={{ width: 100 }}
                      value={it.unit_price} onChange={e => setItem(idx, { unit_price: e.target.value })} />
                  </td>
                  <td>
                    <input type="number" min="0" max="100" step="any" className="input" style={{ width: 70 }}
                      value={it.gst_rate} onChange={e => setItem(idx, { gst_rate: e.target.value })} />
                  </td>
                  <td>
                    <input type="number" min="0" max="100" step="any" className="input" style={{ width: 70 }}
                      value={it.discount_pct} onChange={e => setItem(idx, { discount_pct: e.target.value })} />
                  </td>
                  <td style={{ fontWeight: 600 }}>{FMT(lineTotal(it))}</td>
                  <td>
                    {items.length > 1 && (
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--error)' }}
                        onClick={() => setItems(a => a.filter((_, i) => i !== idx))}
                      >
                        <Trash2 size={13} />
                      </button>
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
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span><span>{FMT(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Tax (GST)</span><span>{FMT(taxTotal)}</span>
            </div>
            <div className="flex justify-between" style={{ fontWeight: 700, fontSize: 15, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
              <span>Total</span><span>{FMT(grand)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/sales/quotations" className="btn-secondary">Cancel</Link>
        <button className="btn-primary" onClick={submit} disabled={saving}>
          {saving
            ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Creating…</span>
            : <><FileText size={14} /> Create Quotation</>}
        </button>
      </div>
    </div>
  );
}
