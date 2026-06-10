import Link from 'next/link';
import { site } from '@/config/site';
import type { Product } from '@/lib/api';
import { Package, ArrowRight } from 'lucide-react';

const fmt = (n?: number) => (n || n === 0) ? `₹${Number(n).toLocaleString('en-IN')}` : null;

// Inner-page hero band (green gradient)
export function PageHero({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <section style={{ background: 'linear-gradient(135deg, var(--brand-800), var(--brand-600))', color: '#fff' }}>
      <div className="container-x" style={{ paddingBlock: 64, textAlign: 'center' }}>
        {eyebrow && <div style={{ fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', fontSize: 13, color: 'rgba(255,255,255,.8)', marginBottom: 10 }}>{eyebrow}</div>}
        <h1 style={{ fontSize: 'clamp(28px,5vw,46px)', fontWeight: 800, margin: 0, letterSpacing: '-.02em' }}>{title}</h1>
        {subtitle && <p style={{ maxWidth: 680, margin: '14px auto 0', fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,.9)' }}>{subtitle}</p>}
      </div>
    </section>
  );
}

// Product card for grids
export function ProductCard({ p }: { p: Product }) {
  const price = fmt(p.min_price);
  const out = p.in_stock === false;
  return (
    <Link href={`/products/${p.id}`} className="card" style={{ display: 'block', overflow: 'hidden', textDecoration: 'none', color: 'inherit', position: 'relative' }}>
      {/* badges */}
      {p.badge && <span style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, background: 'var(--brand)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.03em' }}>{p.badge}</span>}
      <span style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: out ? '#fef2f2' : '#ecfdf5', color: out ? '#b91c1c' : '#047857', border: `1px solid ${out ? '#fecaca' : '#a7f3d0'}` }}>{out ? 'Out of stock' : 'In stock'}</span>
      {/* image / placeholder */}
      <div style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, var(--brand-50), #e7f6ed)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {p.image_url
          ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: out ? 0.65 : 1 }} />
          : <Package size={46} color="var(--brand-600)" strokeWidth={1.4} />}
      </div>
      <div style={{ padding: 16 }}>
        {p.category && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-700)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{p.category}</div>}
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 6 }}>{p.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>{price ? <>From <b style={{ color: 'var(--ink)' }}>{price}</b></> : 'Enquire for price'}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: 'var(--brand-700)' }}>View <ArrowRight size={14} /></span>
        </div>
      </div>
    </Link>
  );
}

// Reusable call-to-action band
export function CtaBand({ title = 'Ready to order or need a quote?', subtitle = 'Get competitive wholesale pricing and fast delivery.' }: { title?: string; subtitle?: string }) {
  return (
    <section className="section">
      <div className="container-x">
        <div style={{ background: 'linear-gradient(135deg, var(--brand-800), var(--brand-600))', borderRadius: 24, padding: '48px 40px', textAlign: 'center', color: '#fff' }}>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, margin: '0 0 10px' }}>{title}</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.9)', margin: '0 auto 24px', maxWidth: 560 }}>{subtitle}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/quote" className="btn btn-white">Get a Quote</Link>
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener" className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.6)' }}>WhatsApp Us</a>
          </div>
        </div>
      </div>
    </section>
  );
}
