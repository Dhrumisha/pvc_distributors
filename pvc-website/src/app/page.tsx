import Link from 'next/link';
import { site } from '@/config/site';
import { getCategories, getProducts } from '@/lib/api';
import { ProductCard, CtaBand } from '@/components/ui';
import {
  ArrowRight, Truck, ShieldCheck, Tags, Headphones, PackageCheck, Clock,
  Layers, Boxes, CheckCircle2, Phone,
} from 'lucide-react';

export const revalidate = 300;

export default async function HomePage() {
  const [categories, { products }] = await Promise.all([
    getCategories(),
    getProducts({ limit: 8 }),
  ]);

  const features = [
    { icon: Tags, title: 'Wholesale Pricing', desc: 'Competitive bulk rates with transparent, tiered pricing for trade buyers.' },
    { icon: PackageCheck, title: 'Always In Stock', desc: 'Deep inventory across PVC sheets, ACP, pipes and profiles — ready to ship.' },
    { icon: Truck, title: 'On-Time Delivery', desc: 'Reliable logistics with our own fleet and route planning across the region.' },
    { icon: ShieldCheck, title: 'Quality Assured', desc: 'Branded, graded material with consistent specs you can trust on every order.' },
    { icon: Headphones, title: 'Dedicated Support', desc: 'A real person to help you spec, quote and reorder — fast.' },
    { icon: Clock, title: 'Fast Quotes', desc: 'Send your requirement and get pricing back within one business day.' },
  ];

  return (
    <>
      {/* HERO */}
      <section style={{ position: 'relative', background: 'linear-gradient(135deg, var(--brand-800) 0%, var(--brand-600) 55%, var(--brand-accent) 120%)', color: '#fff', overflow: 'hidden' }}>
        <div className="container-x" style={{ paddingBlock: 'clamp(64px,10vw,110px)' }}>
          <div style={{ maxWidth: 720 }}>
            <div className="animate-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
              <CheckCircle2 size={15} /> Trusted PVC &amp; building-materials distributor
            </div>
            <h1 className="animate-fade-up" style={{ fontSize: 'clamp(32px,6vw,56px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-.03em', margin: '0 0 18px' }}>
              {site.tagline}
            </h1>
            <p className="animate-fade-up" style={{ fontSize: 'clamp(16px,2.2vw,20px)', lineHeight: 1.6, color: 'rgba(255,255,255,.92)', maxWidth: 600, marginBottom: 30 }}>
              {site.description}
            </p>
            <div className="animate-fade-up" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/quote" className="btn btn-white" style={{ fontSize: 16, padding: '14px 26px' }}>Get a Quote <ArrowRight size={18} /></Link>
              <Link href="/products" className="btn btn-outline" style={{ fontSize: 16, padding: '14px 26px', color: '#fff', borderColor: 'rgba(255,255,255,.6)' }}>Browse Products</Link>
            </div>
          </div>
        </div>
        {/* stats strip */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.15)', background: 'rgba(0,0,0,.08)' }}>
          <div className="container-x" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 20, paddingBlock: 26 }}>
            {site.stats.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="section">
          <div className="container-x">
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div className="eyebrow">What we supply</div>
              <h2 className="h-section" style={{ marginTop: 8 }}>Product Categories</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
              {categories.slice(0, 8).map(c => (
                <Link key={c.id} href={`/products?category=${c.id}`} className="card" style={{ padding: 22, textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--brand-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Layers size={22} color="var(--brand-700)" />
                  </span>
                  <span>
                    <span style={{ display: 'block', fontWeight: 700, color: 'var(--ink)' }}>{c.name}</span>
                    {typeof c.product_count === 'number' && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{c.product_count} product{c.product_count === 1 ? '' : 's'}</span>}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      <section className="section" style={{ background: '#f7f9fb' }}>
        <div className="container-x">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 36 }}>
            <div>
              <div className="eyebrow">In stock now</div>
              <h2 className="h-section" style={{ marginTop: 8 }}>Featured Products</h2>
            </div>
            <Link href="/products" className="btn btn-outline">View all <ArrowRight size={16} /></Link>
          </div>
          {products.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
              {products.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          ) : (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <Boxes size={40} color="var(--brand-600)" style={{ margin: '0 auto 12px' }} />
              <p className="lead">Our catalog is being updated. <Link href="/quote" style={{ color: 'var(--brand-700)', fontWeight: 700 }}>Request a quote</Link> and we'll share availability.</p>
            </div>
          )}
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="section">
        <div className="container-x">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className="eyebrow">Why choose us</div>
            <h2 className="h-section" style={{ marginTop: 8 }}>Built for trade buyers</h2>
            <p className="lead" style={{ maxWidth: 620, margin: '12px auto 0' }}>Builders, contractors, fabricators and retailers rely on us for consistent quality, honest pricing and dependable delivery.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {features.map(f => (
              <div key={f.title} className="card" style={{ padding: 26 }}>
                <span style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--brand-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <f.icon size={24} color="var(--brand-700)" />
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>{f.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" style={{ background: '#f7f9fb' }}>
        <div className="container-x">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="eyebrow">Trusted by trade</div>
            <h2 className="h-section" style={{ marginTop: 8 }}>What our customers say</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {[
              { q: 'Consistent quality and the pricing is the best we get for bulk ACP. Delivery is always on time.', a: 'Construction contractor' },
              { q: 'Their team helps us spec the right material quickly. Reordering is effortless.', a: 'Interior fabricator' },
              { q: 'Reliable supply even during peak season. A genuine long-term distribution partner.', a: 'Hardware retailer' },
            ].map((t, i) => (
              <div key={i} className="card" style={{ padding: 26 }}>
                <div style={{ color: 'var(--brand-600)', fontSize: 22, marginBottom: 8 }}>★★★★★</div>
                <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--ink)', margin: '0 0 14px' }}>“{t.q}”</p>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)' }}>— {t.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
