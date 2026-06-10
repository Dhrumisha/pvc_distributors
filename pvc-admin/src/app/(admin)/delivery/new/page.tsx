'use client';
// src/app/(admin)/delivery/new/page.tsx — Dispatch a delivery for a Sales Order
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { salesOrderService, deliveryService, vehicleService, routeGroupService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Truck } from 'lucide-react';

interface ItemRow {
  id: number;
  product_dimension_id: number;
  name: string;
  sku: string;
  dimension_label: string;
  ordered_qty: number;
  dispatched_qty: string;
}

export default function NewDeliveryPage() {
  const router = useRouter();
  const [orders,      setOrders]      = useState<any[]>([]);
  const [vehicles,    setVehicles]    = useState<any[]>([]);
  const [routeGroups, setRouteGroups] = useState<any[]>([]);
  const [soId,        setSoId]        = useState('');
  const [items,       setItems]       = useState<ItemRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingSO,   setLoadingSO]   = useState(false);
  const [saving,      setSaving]      = useState(false);

  const [form, setForm] = useState({
    delivery_type:   'our_vehicle',
    scheduled_date:  '',
    vehicle_id:      '',
    route_group_id:  '',
    transport_cost:  '0',
    cost_to_customer:'0',
    delivery_notes:  '',
  });

  // Load reference data on mount
  useEffect(() => {
    (async () => {
      try {
        const [ordRes, vehRes, rgRes] = await Promise.all([
          salesOrderService.list({ limit: 200 }),
          vehicleService.list({ limit: 200 }),
          routeGroupService.list({ limit: 200 }),
        ]);
        const allOrders: any[] = ordRes.data.data?.orders || ordRes.data.data || [];
        const DISPATCHABLE = ['confirmed', 'processing'];
        const filtered = allOrders.filter(o => DISPATCHABLE.includes(o.status));
        setOrders(filtered.length > 0 ? filtered : allOrders);
        setVehicles(vehRes.data.data?.vehicles || vehRes.data.data || []);
        setRouteGroups(rgRes.data.data?.groups || rgRes.data.data || []);
      } catch (e) { toast.error(getApiError(e)); }
      finally { setLoading(false); }
    })();
  }, []);

  // Load SO items when an order is selected
  const onSoChange = async (id: string) => {
    setSoId(id);
    setItems([]);
    if (!id) return;
    setLoadingSO(true);
    try {
      const res = await salesOrderService.get(Number(id));
      const data = res.data.data;
      const rawItems: any[] = data?.items || [];
      setItems(rawItems.map((it: any) => ({
        id:                   it.id ?? it.sales_order_item_id,
        product_dimension_id: it.product_dimension_id,
        name:                 it.name ?? it.product_name ?? `Item #${it.id}`,
        sku:                  it.sku ?? '',
        dimension_label:      it.dimension_label ?? '',
        ordered_qty:          Number(it.ordered_qty ?? it.qty ?? 0),
        dispatched_qty:       String(Number(it.ordered_qty ?? it.qty ?? 0)),
      })));
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoadingSO(false); }
  };

  const setRow = (idx: number, patch: Partial<ItemRow>) =>
    setItems(arr => arr.map((r, i) => i === idx ? { ...r, ...patch } : r));

  const submit = async () => {
    if (!soId) { toast.error('Select a Sales Order.'); return; }
    if (!form.delivery_type) { toast.error('Delivery type is required.'); return; }
    const validItems = items.filter(r => Number(r.dispatched_qty) > 0);
    if (validItems.length === 0) { toast.error('At least one item must have a dispatched quantity > 0.'); return; }
    setSaving(true);
    try {
      await deliveryService.create({
        sales_order_id:  Number(soId),
        delivery_type:   form.delivery_type,
        vehicle_id:      form.vehicle_id ? Number(form.vehicle_id) : null,
        scheduled_date:  form.scheduled_date || null,
        route_group_id:  form.route_group_id ? Number(form.route_group_id) : null,
        transport_cost:  Number(form.transport_cost) || 0,
        cost_to_customer:Number(form.cost_to_customer) || 0,
        ...(form.delivery_notes ? { delivery_notes: form.delivery_notes } : {}),
        items: validItems.map(r => ({
          sales_order_item_id:  r.id,
          product_dimension_id: r.product_dimension_id,
          dispatched_qty:       Number(r.dispatched_qty),
        })),
      });
      toast.success('Delivery created successfully.');
      router.push('/delivery');
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  const selectedOrder = orders.find(o => String(o.id) === soId);

  return (
    <div className="space-y-5 animate-slide-up" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/delivery" className="btn-icon"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Truck size={18} style={{ color: 'var(--accent)' }} /> New Delivery
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            Select a Sales Order and configure delivery details.
          </p>
        </div>
      </div>

      {/* Step 1: Sales Order + delivery config */}
      <div className="card p-5 space-y-4">
        <h2 className="section-title">Delivery Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Sales Order picker — full width */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Sales Order *</label>
            <select className="input" value={soId} onChange={e => onSoChange(e.target.value)}>
              <option value="">Select a Sales Order…</option>
              {orders.map(so => (
                <option key={so.id} value={so.id}>
                  {so.order_number || `SO-${so.id}`}
                  {' — '}
                  {so.customer?.business_name || so.customer_name || ''}
                </option>
              ))}
            </select>
            {selectedOrder && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Status: <strong>{selectedOrder.status?.replace(/_/g, ' ')}</strong>
              </p>
            )}
          </div>

          {/* Delivery Type */}
          <div className="form-group">
            <label className="form-label">Delivery Type *</label>
            <select className="input" value={form.delivery_type} onChange={e => setForm(f => ({ ...f, delivery_type: e.target.value }))}>
              <option value="our_vehicle">Our Vehicle</option>
              <option value="customer_vehicle">Customer Vehicle</option>
            </select>
          </div>

          {/* Scheduled Date */}
          <div className="form-group">
            <label className="form-label">Scheduled Date <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input
              type="date"
              className="input"
              value={form.scheduled_date}
              onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
            />
          </div>

          {/* Vehicle */}
          <div className="form-group">
            <label className="form-label">Vehicle <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <select className="input" value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
              <option value="">No vehicle assigned</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number || v.number || `Vehicle #${v.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Route Group */}
          <div className="form-group">
            <label className="form-label">Route Group <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <select className="input" value={form.route_group_id} onChange={e => setForm(f => ({ ...f, route_group_id: e.target.value }))}>
              <option value="">None</option>
              {routeGroups.map(rg => (
                <option key={rg.id} value={rg.id}>
                  {rg.name || rg.group_name || `Route #${rg.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Transport Cost */}
          <div className="form-group">
            <label className="form-label">Transport Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="any"
              className="input"
              value={form.transport_cost}
              onChange={e => setForm(f => ({ ...f, transport_cost: e.target.value }))}
            />
          </div>

          {/* Cost to Customer */}
          <div className="form-group">
            <label className="form-label">Cost to Customer (₹)</label>
            <input
              type="number"
              min="0"
              step="any"
              className="input"
              value={form.cost_to_customer}
              onChange={e => setForm(f => ({ ...f, cost_to_customer: e.target.value }))}
            />
          </div>

          {/* Delivery Notes */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Delivery Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input
              className="input"
              placeholder="Any special instructions…"
              value={form.delivery_notes}
              onChange={e => setForm(f => ({ ...f, delivery_notes: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Step 2: Items table */}
      {soId && (
        <div className="card">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 className="section-title">Items to Dispatch</h2>
          </div>
          {loadingSO ? (
            <div className="flex justify-center py-10"><div className="spinner" /></div>
          ) : items.length === 0 ? (
            <div className="empty-state py-12">
              <Truck size={32} className="empty-state-icon" />
              <p className="empty-state-title">No items found on this order</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 200 }}>Product / SKU</th>
                    <th>Ordered Qty</th>
                    <th style={{ minWidth: 130 }}>Dispatching Now</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{row.name}</div>
                        {(row.sku || row.dimension_label) && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {[row.sku, row.dimension_label].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 13 }}>{row.ordered_qty}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className="input"
                          style={{ width: 100 }}
                          value={row.dispatched_qty}
                          onChange={e => setRow(idx, { dispatched_qty: e.target.value })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cost summary (if costs entered) */}
      {(Number(form.transport_cost) > 0 || Number(form.cost_to_customer) > 0) && (
        <div className="flex justify-end">
          <div className="card p-4" style={{ width: 260, fontSize: 13 }}>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Transport Cost</span>
                <span>₹{Number(form.transport_cost || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Cost to Customer</span>
                <span>₹{Number(form.cost_to_customer || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/delivery" className="btn-secondary">Cancel</Link>
        <button className="btn-primary" onClick={submit} disabled={saving || !soId}>
          {saving
            ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Creating…</span>
            : <><Truck size={14} /> Create Delivery</>}
        </button>
      </div>
    </div>
  );
}
