'use client';
// src/app/(admin)/suppliers/receipts/new/page.tsx — Receive Goods against a PO
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { purchaseOrderService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, PackageCheck } from 'lucide-react';

const TODAY = () => new Date().toISOString().split('T')[0];

interface ItemRow {
  id: number;
  product_dimension_id: number;
  name: string;
  sku: string;
  ordered_qty: number;
  already_received: number;
  received_qty: string;
  damaged_qty: string;
}

export default function ReceiveGoodsPage() {
  const router = useRouter();
  const [pos,        setPos]        = useState<any[]>([]);
  const [poId,       setPoId]       = useState('');
  const [items,      setItems]      = useState<ItemRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loadingPO,  setLoadingPO]  = useState(false);
  const [saving,     setSaving]     = useState(false);

  const [form, setForm] = useState({
    received_date: TODAY(),
    batch_lot_id: '',
  });

  // Load PO list on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await purchaseOrderService.list({ limit: 200 });
        const all: any[] = res.data.data?.orders || res.data.data || [];
        const RECEIVABLE = ['sent', 'approved', 'partially_received'];
        const filtered = all.filter(o => RECEIVABLE.includes(o.status));
        setPos(filtered.length > 0 ? filtered : all);
      } catch (e) { toast.error(getApiError(e)); }
      finally { setLoading(false); }
    })();
  }, []);

  // Load PO items when a PO is chosen
  const onPoChange = async (id: string) => {
    setPoId(id);
    setItems([]);
    if (!id) return;
    setLoadingPO(true);
    try {
      const res = await purchaseOrderService.get(Number(id));
      const data = res.data.data;
      const rawItems: any[] = data?.items || [];
      setItems(rawItems.map((it: any) => {
        const ordered  = Number(it.ordered_qty  ?? it.qty ?? 0);
        const received = Number(it.received_qty ?? it.already_received_qty ?? 0);
        const remaining = Math.max(0, ordered - received);
        return {
          id:                    it.id ?? it.purchase_order_item_id,
          product_dimension_id:  it.product_dimension_id,
          name:                  it.name ?? it.product_name ?? it.sku ?? `Item #${it.id}`,
          sku:                   it.sku  ?? '',
          ordered_qty:           ordered,
          already_received:      received,
          received_qty:          String(remaining),
          damaged_qty:           '0',
        };
      }));
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoadingPO(false); }
  };

  const setRow = (idx: number, patch: Partial<ItemRow>) =>
    setItems(arr => arr.map((r, i) => i === idx ? { ...r, ...patch } : r));

  const submit = async () => {
    if (!poId) { toast.error('Select a Purchase Order.'); return; }
    if (!form.received_date) { toast.error('Received date is required.'); return; }
    const validItems = items.filter(r => Number(r.received_qty) > 0);
    if (validItems.length === 0) { toast.error('At least one item must have a received quantity > 0.'); return; }
    setSaving(true);
    try {
      await purchaseOrderService.receive(Number(poId), {
        received_date: form.received_date,
        ...(form.batch_lot_id ? { batch_lot_id: Number(form.batch_lot_id) } : {}),
        items: validItems.map(r => ({
          purchase_order_item_id: r.id,
          received_qty:           Number(r.received_qty),
          damaged_qty:            Number(r.damaged_qty) || 0,
        })),
      });
      toast.success('Goods received successfully.');
      router.push('/suppliers/receipts');
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  const selectedPo = pos.find(p => String(p.id) === poId);

  return (
    <div className="space-y-5 animate-slide-up" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/suppliers/receipts" className="btn-icon"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <PackageCheck size={18} style={{ color: 'var(--accent)' }} /> Receive Goods
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            Select a Purchase Order and enter received quantities.
          </p>
        </div>
      </div>

      {/* Step 1: Pick a PO + receipt meta */}
      <div className="card p-5 space-y-4">
        <h2 className="section-title">Receipt Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Purchase Order *</label>
            <select
              className="input"
              value={poId}
              onChange={e => onPoChange(e.target.value)}
            >
              <option value="">Select a Purchase Order…</option>
              {pos.map(po => (
                <option key={po.id} value={po.id}>
                  {po.po_number || `PO-${po.id}`}
                  {' — '}
                  {po.supplier?.name || po.supplier_name || (po.supplier_id ? `Supplier #${po.supplier_id}` : '')}
                </option>
              ))}
            </select>
            {selectedPo && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Status: <strong>{selectedPo.status?.replace(/_/g, ' ')}</strong>
                {selectedPo.expected_date ? ` · Expected: ${new Date(selectedPo.expected_date).toLocaleDateString('en-IN')}` : ''}
              </p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Received Date *</label>
            <input
              type="date"
              className="input"
              value={form.received_date}
              onChange={e => setForm(f => ({ ...f, received_date: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Batch / Lot ID <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input
              type="number"
              min="1"
              className="input"
              placeholder="Leave blank if not applicable"
              value={form.batch_lot_id}
              onChange={e => setForm(f => ({ ...f, batch_lot_id: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Step 2: Items table */}
      {poId && (
        <div className="card">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="section-title">Items to Receive</h2>
          </div>
          {loadingPO ? (
            <div className="flex justify-center py-10"><div className="spinner" /></div>
          ) : items.length === 0 ? (
            <div className="empty-state py-12">
              <PackageCheck size={32} className="empty-state-icon" />
              <p className="empty-state-title">No items found on this PO</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 200 }}>Product / SKU</th>
                    <th>Ordered Qty</th>
                    <th>Already Received</th>
                    <th>Remaining</th>
                    <th style={{ minWidth: 110 }}>Receiving Now</th>
                    <th style={{ minWidth: 110 }}>Damaged Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => {
                    const remaining = Math.max(0, row.ordered_qty - row.already_received);
                    return (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{row.name}</div>
                          {row.sku && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {row.sku}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: 13 }}>{row.ordered_qty}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.already_received}</td>
                        <td style={{ fontSize: 13, fontWeight: 600 }}>{remaining}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            className="input"
                            style={{ width: 90 }}
                            value={row.received_qty}
                            onChange={e => setRow(idx, { received_qty: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            className="input"
                            style={{ width: 90 }}
                            value={row.damaged_qty}
                            onChange={e => setRow(idx, { damaged_qty: e.target.value })}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/suppliers/receipts" className="btn-secondary">Cancel</Link>
        <button className="btn-primary" onClick={submit} disabled={saving || !poId}>
          {saving
            ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</span>
            : <><PackageCheck size={14} /> Record Receipt</>}
        </button>
      </div>
    </div>
  );
}
