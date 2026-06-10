'use client';
import { useState } from 'react';
import {
  Package, ShoppingCart, ChevronRight, ChevronDown, Plus, Minus,
  Trash2, Loader2, CheckCircle2, AlertCircle, X, Tag, Layers,
} from 'lucide-react';

// ─── types ────────────────────────────────────────────────────────────────────
interface PortalProduct {
  id: string;
  name: string;
  unit: string;
  category: string;
  base_min: number;
  base_max: number;
  net_min: number;
  net_max: number;
  discount_percent: number;
}

interface Variant {
  id: string;
  sku: string;
  dimension_label: string;
  color?: string;
  base_price: number;
  net_price: number;
  stock?: number;
  in_stock?: boolean;
}

interface CartItem {
  product_dimension_id: string;
  productName: string;
  sku: string;
  dimension_label: string;
  net_price: number;
  qty: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number | string) => `₹${Number(n).toLocaleString('en-IN')}`;

// ─── VariantRow ───────────────────────────────────────────────────────────────
function VariantRow({
  v,
  productName,
  onAdd,
}: {
  v: Variant;
  productName: string;
  onAdd: (item: Omit<CartItem, 'qty'>) => void;
}) {
  const [qty, setQty] = useState(1);
  const out = v.in_stock === false || (v.stock != null && v.stock <= 0);
  const maxQty = v.stock != null && v.stock > 0 ? v.stock : Infinity;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10,
      alignItems: 'center', padding: '10px 0',
      borderBottom: '1px solid #f1f5f9', opacity: out ? 0.6 : 1,
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 7 }}>
          {v.color && <span title={v.color} style={{ width: 14, height: 14, borderRadius: '50%', background: v.color, border: '1px solid #d8dee6', display: 'inline-block', flexShrink: 0 }} />}
          {v.dimension_label || v.sku}{v.color ? ` · ${v.color}` : ''}
        </div>
        {v.dimension_label && v.sku && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{v.sku}</div>
        )}
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 15 }}>{fmt(v.net_price)}</span>
          {v.base_price > v.net_price && (
            <span style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'line-through' }}>{fmt(v.base_price)}</span>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, color: out ? '#b91c1c' : '#047857' }}>
            {out ? 'Out of stock' : (v.stock != null && v.stock <= 10 ? `Only ${v.stock} left` : 'In stock')}
          </span>
        </div>
      </div>

      {/* qty stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', opacity: out ? 0.5 : 1 }}>
        <button disabled={out}
          onClick={() => setQty(q => Math.max(1, q - 1))}
          style={{ padding: '6px 10px', background: 'none', border: 'none', cursor: out ? 'not-allowed' : 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}
        >
          <Minus size={14} />
        </button>
        <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>{qty}</span>
        <button disabled={out}
          onClick={() => setQty(q => Math.min(maxQty, q + 1))}
          style={{ padding: '6px 10px', background: 'none', border: 'none', cursor: out ? 'not-allowed' : 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}
        >
          <Plus size={14} />
        </button>
      </div>

      <button disabled={out}
        onClick={() => onAdd({ product_dimension_id: v.id, productName, sku: v.sku, dimension_label: v.dimension_label, net_price: v.net_price })}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: out ? '#e5e7eb' : 'var(--brand)', color: out ? '#9ca3af' : '#fff',
          border: `1px solid ${out ? '#e5e7eb' : 'var(--brand)'}`, borderRadius: 8,
          padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: out ? 'not-allowed' : 'pointer',
        }}
      >
        <Plus size={14} /> {out ? 'N/A' : 'Add'}
      </button>
    </div>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({
  p,
  onAdd,
}: {
  p: PortalProduct;
  onAdd: (item: Omit<CartItem, 'qty'>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [variants, setVariants] = useState<Variant[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function toggle() {
    if (!expanded && variants === null) {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/portal/product/${p.id}`);
        const json = await res.json();
        if (json.product?.variants) {
          setVariants(json.product.variants);
        } else {
          setError('Could not load variants.');
        }
      } catch {
        setError('Network error loading variants.');
      } finally {
        setLoading(false);
      }
    }
    setExpanded(e => !e);
  }

  return (
    <div
      className="card"
      style={{
        overflow: 'hidden',
        transition: 'all .18s',
      }}
    >
      {/* Product header */}
      <button
        onClick={toggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--brand-50), #e7f6ed)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Package size={22} color="var(--brand-600)" strokeWidth={1.4} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {p.category && (
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-700)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>
              {p.category}
            </div>
          )}
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>{p.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
              From {fmt(p.net_min)}
            </span>
            {Number(p.discount_percent) > 0 && (
              <span style={{
                background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                borderRadius: 6, fontSize: 11, fontWeight: 700, padding: '2px 7px',
                display: 'inline-flex', alignItems: 'center', gap: 3,
              }}>
                <Tag size={10} /> {p.discount_percent}% off
              </span>
            )}
            {p.unit && (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>/ {p.unit}</span>
            )}
          </div>
        </div>
        <span style={{ color: 'var(--muted)', flexShrink: 0 }}>
          {loading
            ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            : expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />
          }
        </span>
      </button>

      {/* Expanded variants */}
      {expanded && (
        <div style={{ padding: '0 20px 16px', borderTop: '1px solid #f1f5f9' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: 13, padding: '12px 0' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {!error && variants && variants.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 13, padding: '12px 0' }}>No variants available.</div>
          )}
          {variants && variants.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                <Layers size={12} style={{ verticalAlign: 'middle' }} /> Select size / variant
              </div>
              {variants.map(v => (
                <VariantRow key={v.id} v={v} productName={p.name} onAdd={onAdd} />
              ))}
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── ShopClient (main) ────────────────────────────────────────────────────────
export default function ShopClient({ products }: { products: PortalProduct[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<'credit' | 'pay_now'>('credit');
  const [notes, setNotes] = useState('');
  const [orderStatus, setOrderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [orderMessage, setOrderMessage] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Add item to cart or increment qty
  function addToCart(item: Omit<CartItem, 'qty'>) {
    setCart(prev => {
      const existing = prev.findIndex(c => c.product_dimension_id === item.product_dimension_id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], qty: updated[existing].qty + 1 };
        return updated;
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setCartOpen(true);
  }

  function updateQty(id: string, qty: number) {
    if (qty < 1) return;
    setCart(prev => prev.map(c => c.product_dimension_id === id ? { ...c, qty } : c));
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(c => c.product_dimension_id !== id));
  }

  const grandTotal = cart.reduce((acc, c) => acc + c.net_price * c.qty, 0);
  const cartCount = cart.reduce((acc, c) => acc + c.qty, 0);

  const filteredProducts = search.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase())
      )
    : products;

  async function handlePlaceOrder() {
    if (cart.length === 0) return;
    setOrderStatus('loading');
    setOrderMessage('');
    try {
      const res = await fetch('/api/portal/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(c => ({ product_dimension_id: c.product_dimension_id, qty: c.qty })),
          payment_mode: paymentMode,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setOrderStatus('success');
        setOrderNumber(json.order?.order_number || '');
        setOrderMessage(json.message || 'Order placed successfully!');
        setCart([]);
        setNotes('');
        setCartOpen(false);
      } else {
        setOrderStatus('error');
        setOrderMessage(json.message || 'Order failed. Please try again.');
      }
    } catch {
      setOrderStatus('error');
      setOrderMessage('Network error. Please try again.');
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Success banner */}
      {orderStatus === 'success' && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14,
          padding: '20px 24px', marginBottom: 28,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <CheckCircle2 size={22} color="#15803d" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#15803d', fontSize: 16, marginBottom: 4 }}>
              Order Placed!{orderNumber && ` — ${orderNumber}`}
            </div>
            <div style={{ color: '#166534', fontSize: 14 }}>{orderMessage}</div>
            <button
              onClick={() => setOrderStatus('idle')}
              style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--brand-700)', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0 }}
            >
              Place another order →
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: cartOpen ? 'minmax(0,1fr) 340px' : 'minmax(0,1fr)', gap: 24, alignItems: 'flex-start' }}>
        {/* Product list */}
        <div>
          {/* Search */}
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products or categories…"
              style={{
                width: '100%', padding: '10px 16px', fontSize: 14,
                border: '1px solid #e2e8f0', borderRadius: 10,
                outline: 'none', color: 'var(--ink)',
                background: '#fff',
              }}
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)' }}>
              No products match your search.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {filteredProducts.map(p => (
                <ProductCard key={p.id} p={p} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>

        {/* Cart panel */}
        {cartOpen && (
          <div style={{ position: 'sticky', top: 20 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              {/* Cart header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderBottom: '1px solid #e8ecf1',
                background: 'linear-gradient(135deg, var(--brand-800), var(--brand-600))', color: '#fff',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
                  <ShoppingCart size={18} /> Cart
                  {cartCount > 0 && (
                    <span style={{
                      background: 'rgba(255,255,255,.25)', borderRadius: 999,
                      fontSize: 12, fontWeight: 800, padding: '1px 8px',
                    }}>
                      {cartCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#fff', padding: '4px 6px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Cart items */}
              {cart.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                  Your cart is empty. Select a product above.
                </div>
              ) : (
                <div style={{ padding: '12px 20px', maxHeight: 340, overflowY: 'auto' }}>
                  {cart.map(c => (
                    <div key={c.product_dimension_id} style={{ paddingBlock: 10, borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 8px', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{c.productName}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.dimension_label || c.sku}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{fmt(c.net_price)} / unit</div>
                      </div>
                      <button
                        onClick={() => removeFromCart(c.product_dimension_id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px', display: 'flex', alignItems: 'center' }}
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={() => updateQty(c.product_dimension_id, c.qty - 1)}
                          style={{ width: 26, height: 26, border: '1px solid #e2e8f0', borderRadius: 6, background: '#f7f9fb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>{c.qty}</span>
                        <button
                          onClick={() => updateQty(c.product_dimension_id, c.qty + 1)}
                          style={{ width: 26, height: 26, border: '1px solid #e2e8f0', borderRadius: 6, background: '#f7f9fb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', textAlign: 'right' }}>
                        {fmt(c.net_price * c.qty)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div style={{ padding: '14px 20px', borderTop: '1px solid #e8ecf1' }}>
                  {/* Grand total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, color: 'var(--ink)', marginBottom: 16 }}>
                    <span>Total</span>
                    <span>{fmt(grandTotal)}</span>
                  </div>

                  {/* Payment mode */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                      Payment Mode
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {([
                        { value: 'credit', label: 'Credit / Udhaar' },
                        { value: 'pay_now', label: 'Pay Now' },
                      ] as const).map(opt => (
                        <label
                          key={opt.value}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                            border: paymentMode === opt.value ? '2px solid var(--brand)' : '1px solid #e2e8f0',
                            background: paymentMode === opt.value ? 'var(--brand-50)' : '#fff',
                            fontWeight: paymentMode === opt.value ? 700 : 500,
                            fontSize: 13, color: 'var(--ink)',
                          }}
                        >
                          <input
                            type="radio"
                            name="payment_mode"
                            value={opt.value}
                            checked={paymentMode === opt.value}
                            onChange={() => setPaymentMode(opt.value)}
                            style={{ accentColor: 'var(--brand)' }}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div style={{ marginBottom: 14 }}>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Order notes (optional)…"
                      rows={2}
                      style={{
                        width: '100%', padding: '8px 12px', fontSize: 13,
                        border: '1px solid #e2e8f0', borderRadius: 8,
                        resize: 'vertical', outline: 'none', color: 'var(--ink)',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  {/* Error */}
                  {orderStatus === 'error' && orderMessage && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: '#dc2626', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} /> {orderMessage}
                    </div>
                  )}

                  {/* Place order */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={orderStatus === 'loading' || cart.length === 0}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: 'var(--brand)', color: '#fff',
                      border: '1px solid var(--brand)', borderRadius: 10,
                      padding: '12px 20px', fontSize: 15, fontWeight: 700,
                      cursor: orderStatus === 'loading' ? 'not-allowed' : 'pointer',
                      opacity: orderStatus === 'loading' ? 0.7 : 1,
                    }}
                  >
                    {orderStatus === 'loading'
                      ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Placing order…</>
                      : 'Place Order'
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating cart button when cart has items and panel is closed */}
      {!cartOpen && cart.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 50,
            background: 'var(--brand)', color: '#fff',
            border: 'none', borderRadius: 999, cursor: 'pointer',
            padding: '14px 22px', fontWeight: 700, fontSize: 15,
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 8px 24px rgba(21,128,61,.4)',
          }}
        >
          <ShoppingCart size={20} />
          Cart ({cartCount}) — {fmt(grandTotal)}
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
