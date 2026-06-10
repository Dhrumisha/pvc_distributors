'use client';
// src/app/(admin)/billing/credit-notes/new/page.tsx — Create a new credit note
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { creditNoteService, invoiceService, productService } from '@/lib/services';
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
}

const emptyItem = (): LineItem => ({ product_id: '', product_dimension_id: '', qty: '1', unit_price: '0', gst_rate: '0' });

export default function NewCreditNotePage() {
  const router = useRouter();
  const [invoices,      setInvoices]    = useState<any[]>([]);
  const [products,      setProducts]    = useState<any[]>([]);
  const [dimsByProduct, setDims]        = useState<Record<string, any[]>>({});
  const [loading,       setLoading]     = useState(true);
  const [saving,        setSaving]      = useState(false);

  const [form, setForm] = useState({ invoice_id: '', reason: '' });
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  useEffect(() => {
    (async () => {
      try {
        const [inv, ps] = await Promise.all([
          invoiceService.list({ limit: 200 }),
          productService.list({ limit: 200 }),
        ]);
        setInvoices(inv.data.data?.invoices || inv.data.data || []);
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
    const q = parseFloat(it.qty) || 0, p = parseFloat(it.unit_price) || 0;
    return q * p;
  };
  const grand = items.reduce((s, it) => s + lineTotal(it), 0);

  const submit = async () => {
    if (!form.invoice_id) { toast.error('Select an invoice.'); return; }
    if (!form.reason.trim()) { toast.error('Enter a reason for the credit note.'); return; }
    const validItems = items.filter(it => it.product_dimension_id && parseFloat(it.qty) > 0);
    if (validItems.length === 0) { toast.error('Add at least one product with a quantity.'); return; }
    setSaving(true);
    try {
      await creditNoteService.create({
        invoice_id: Number(form.invoice_id),
        reason:     form.reason.trim(),
        items: validItems.map(it => ({
          product_dimension_id: Number(it.product_dimension_id),
          qty:        parseFloat(it.qty),
          unit_price: parseFloat(it.unit_price) || 0,
          gst_rate:   parseFloat(it.gst_rate) || 0,
        })),
      });
      toast.success('Credit note created');
      router.push('/billing/credit-notes');
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="space-y-5 animate-slide-up" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/billing/credit-notes" className="btn-icon"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText size={18} style={{ color: 'var(--accent)' }} /> New Credit Note
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            Link to an invoice, state the reason, and add the returned / adjusted products.
          </p>
        </div>
      </div>

      {/* Credit Note Details */}
      <div className="card p-5 space-y-4">
        <h2 className="section-title">Credit Note Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Invoice *</label>
            <select
              className="input"
              value={form.invoice_id}
              onChange={e => setForm(f => ({ ...f, invoice_id: e.target.value }))}
            >
              <option value="">Select an invoice…</option>
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} — {inv.customer?.business_name || ''} (bal {FMT(inv.balance_due ?? 0)})
                </option>
              ))}
            </select>
            <span className="form-hint">The invoice this credit note is issued against.</span>
          </div>
          <div className="form-group">
            <label className="form-label">Reason *</label>
            <input
              className="input"
              placeholder="e.g. Damaged goods, overcharge correction…"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
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

        {/* Total */}
        <div className="flex justify-end p-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ width: 260, fontSize: 13 }} className="space-y-1.5">
            <div className="flex justify-between" style={{ fontWeight: 700, fontSize: 15 }}>
              <span>Total</span><span>{FMT(grand)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/billing/credit-notes" className="btn-secondary">Cancel</Link>
        <button className="btn-primary" onClick={submit} disabled={saving}>
          {saving
            ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Creating…</span>
            : <><FileText size={14} /> Create Credit Note</>}
        </button>
      </div>
    </div>
  );
}
