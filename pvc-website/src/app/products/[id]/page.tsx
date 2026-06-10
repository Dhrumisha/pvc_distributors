// src/app/products/[id]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/api';
import { CtaBand } from '@/components/ui';
import EnquiryForm from '@/components/EnquiryForm';
import { site } from '@/config/site';
import {
  ChevronRight,
  Package,
  ShieldCheck,
  Truck,
  Tags,
  Clock,
  Headphones,
  Hash,
  Ruler,
} from 'lucide-react';

export const revalidate = 120;

// ── SEO ──────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const product = await getProduct(params.id);

  if (!product) {
    return {
      title: `Product not found — ${site.name}`,
      description: `Browse our full catalog of PVC sheets, ACP panels, pipes and building materials at ${site.name}.`,
    };
  }

  const description =
    `${product.name}${product.category ? ` — ${product.category}` : ''}. ` +
    `Available at ${site.name}: wholesale pricing, bulk supply and fast delivery for builders, ` +
    `contractors and fabricators. Request a quote today.`;

  return {
    title: `${product.name} — ${site.name}`,
    description,
    openGraph: {
      title: `${product.name} — ${site.name}`,
      description,
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n?: number | null) =>
  n != null ? `₹${Number(n).toLocaleString('en-IN')}` : null;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);

  // ── Not found ──
  if (!product) {
    return (
      <section className="section">
        <div className="container-x" style={{ textAlign: 'center', maxWidth: 480, marginInline: 'auto' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--brand-50)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Package size={36} color="var(--brand-600)" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', margin: '0 0 10px' }}>
            Product not found
          </h1>
          <p className="lead" style={{ fontSize: 16, marginBottom: 24 }}>
            This product may have been removed or the link is incorrect.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/products" className="btn btn-primary">
              Browse all products
            </Link>
            <Link href="/quote" className="btn btn-outline">
              Request a quote
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const variants = product.variants ?? [];
  const prices = variants
    .map(v => v.selling_price)
    .filter((p): p is number => p != null && p > 0);
  const minPrice = prices.length ? Math.min(...prices) : product.min_price;
  const maxPrice = prices.length ? Math.max(...prices) : product.max_price;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    category: product.category ?? 'Building Materials',
    brand: { '@type': 'Brand', name: site.name },
    ...(product.hsn_code ? { gtin: product.hsn_code } : {}),
    ...(minPrice != null
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: minPrice,
            ...(maxPrice != null && maxPrice !== minPrice ? { highPrice: maxPrice } : {}),
            offerCount: variants.length || 1,
            availability: 'https://schema.org/InStock',
            seller: { '@type': 'Organization', name: site.name },
          },
        }
      : {}),
  };

  const trustPoints = [
    { icon: ShieldCheck, text: 'Genuine branded & graded material' },
    { icon: Tags, text: 'Transparent wholesale pricing' },
    { icon: Truck, text: 'On-time delivery across the region' },
    { icon: Clock, text: 'Quote turnaround within one business day' },
    { icon: Headphones, text: 'Dedicated support team' },
  ];

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Breadcrumb ── */}
      <div style={{ borderBottom: '1px solid #e8ecf1', background: '#f7f9fb' }}>
        <div className="container-x" style={{ paddingBlock: 12 }}>
          <nav
            aria-label="Breadcrumb"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--muted)', flexWrap: 'wrap' }}
          >
            <Link href="/" style={{ color: 'var(--brand-700)', textDecoration: 'none', fontWeight: 600 }}>
              Home
            </Link>
            <ChevronRight size={14} />
            <Link href="/products" style={{ color: 'var(--brand-700)', textDecoration: 'none', fontWeight: 600 }}>
              Products
            </Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ── Main content ── */}
      <section className="section">
        <div className="container-x">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 40,
              alignItems: 'start',
            }}
          >
            {/* ── Left column: product info ── */}
            <div>
              {/* Product image */}
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '16/9',
                  background: 'linear-gradient(135deg, var(--brand-50), #e7f6ed)',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                  border: '1px solid var(--brand-100)',
                  overflow: 'hidden',
                }}
              >
                {product.badge && <span style={{ position: 'absolute', top: 14, left: 14, background: 'var(--brand)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '4px 11px', borderRadius: 999, textTransform: 'uppercase' }}>{product.badge}</span>}
                <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: product.in_stock === false ? '#fef2f2' : '#ecfdf5', color: product.in_stock === false ? '#b91c1c' : '#047857', border: `1px solid ${product.in_stock === false ? '#fecaca' : '#a7f3d0'}` }}>{product.in_stock === false ? 'Out of stock' : 'In stock'}</span>
                {product.image_url
                  ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Package size={72} color="var(--brand-600)" strokeWidth={1.2} />}
              </div>

              {/* Header */}
              <div style={{ marginBottom: 28 }}>
                {product.category && (
                  <div className="eyebrow" style={{ marginBottom: 8 }}>{product.category}</div>
                )}
                <h1
                  style={{
                    fontSize: 'clamp(24px, 4vw, 36px)',
                    fontWeight: 800,
                    color: 'var(--ink)',
                    margin: '0 0 12px',
                    lineHeight: 1.15,
                    letterSpacing: '-.02em',
                  }}
                >
                  {product.name}
                </h1>

                {/* Meta chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                  {product.unit && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'var(--brand-50)',
                        color: 'var(--brand-700)',
                        fontWeight: 600,
                        fontSize: 13,
                        padding: '5px 12px',
                        borderRadius: 999,
                        border: '1px solid var(--brand-100)',
                      }}
                    >
                      <Ruler size={13} /> Unit: {product.unit}
                    </span>
                  )}
                  {product.hsn_code && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: '#f3f4f6',
                        color: 'var(--muted)',
                        fontWeight: 600,
                        fontSize: 13,
                        padding: '5px 12px',
                        borderRadius: 999,
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <Hash size={13} /> HSN: {product.hsn_code}
                    </span>
                  )}
                  {product.gst_rate != null && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: '#f3f4f6',
                        color: 'var(--muted)',
                        fontWeight: 600,
                        fontSize: 13,
                        padding: '5px 12px',
                        borderRadius: 999,
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      GST: {product.gst_rate}%
                    </span>
                  )}
                </div>

                {/* Price range */}
                {minPrice != null && (
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: 'var(--brand-700)',
                    }}
                  >
                    From {fmt(minPrice)}
                    {maxPrice != null && maxPrice !== minPrice && (
                      <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--muted)', marginLeft: 8 }}>
                        — {fmt(maxPrice)}
                      </span>
                    )}
                    {product.unit && (
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', marginLeft: 6 }}>
                        / {product.unit}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ── Variants table ── */}
              {variants.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 14px' }}>
                    Available Variants
                  </h2>
                  <div
                    style={{
                      border: '1px solid #e8ecf1',
                      borderRadius: 14,
                      overflow: 'hidden',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: 'var(--brand-50)', borderBottom: '1px solid #e8ecf1' }}>
                          <th
                            style={{
                              textAlign: 'left',
                              padding: '11px 16px',
                              fontWeight: 700,
                              color: 'var(--brand-800)',
                              fontSize: 12,
                              letterSpacing: '.06em',
                              textTransform: 'uppercase',
                            }}
                          >
                            SKU
                          </th>
                          <th
                            style={{
                              textAlign: 'left',
                              padding: '11px 16px',
                              fontWeight: 700,
                              color: 'var(--brand-800)',
                              fontSize: 12,
                              letterSpacing: '.06em',
                              textTransform: 'uppercase',
                            }}
                          >
                            Dimension / Spec
                          </th>
                          <th
                            style={{
                              textAlign: 'right',
                              padding: '11px 16px',
                              fontWeight: 700,
                              color: 'var(--brand-800)',
                              fontSize: 12,
                              letterSpacing: '.06em',
                              textTransform: 'uppercase',
                            }}
                          >
                            Price (₹)
                          </th>
                          <th style={{ textAlign: 'right', padding: '11px 16px', fontWeight: 700, color: 'var(--brand-800)', fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                            Availability
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v, idx) => (
                          <tr
                            key={v.id}
                            style={{
                              borderBottom: idx < variants.length - 1 ? '1px solid #f1f4f8' : 'none',
                              background: idx % 2 === 1 ? '#fafbfc' : '#fff',
                            }}
                          >
                            <td style={{ padding: '11px 16px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'monospace' }}>
                              {v.sku}
                            </td>
                            <td style={{ padding: '11px 16px', color: 'var(--muted)' }}>
                              <span>{v.dimension_label ?? '—'}</span>
                              {v.color && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
                                  <span style={{ width: 13, height: 13, borderRadius: '50%', background: v.color, border: '1px solid #d8dee6', display: 'inline-block' }} />
                                  <span style={{ fontSize: 12, color: 'var(--ink)' }}>{v.color}</span>
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, color: v.selling_price ? 'var(--brand-700)' : 'var(--muted)' }}>
                              {v.selling_price ? fmt(v.selling_price) : 'On request'}
                            </td>
                            <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: v.in_stock === false ? '#b91c1c' : '#047857' }}>
                                {v.in_stock === false ? 'Out of stock' : 'In stock'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 0 4px' }}>
                    * Prices shown are indicative. Final pricing depends on quantity and delivery location.
                  </p>
                </div>
              )}

              {/* ── Why buy from us ── */}
              <div
                className="card"
                style={{ padding: 24 }}
              >
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--ink)',
                    margin: '0 0 16px',
                  }}
                >
                  Why buy from {site.name}?
                </h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
                  {trustPoints.map(({ icon: Icon, text }) => (
                    <li key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: 'var(--brand-50)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={16} color="var(--brand-700)" />
                      </span>
                      <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Right column: enquiry form ── */}
            <div style={{ position: 'sticky', top: 24 }}>
              <div
                className="card"
                style={{ padding: 28 }}
              >
                {/* Request pricing header */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, var(--brand-800), var(--brand-600))',
                    borderRadius: 12,
                    padding: '18px 20px',
                    marginBottom: 22,
                    color: '#fff',
                  }}
                >
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>
                    Request Pricing
                  </h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,.85)', margin: 0, lineHeight: 1.5 }}>
                    Share your requirements — quantity, size, delivery location — and we&apos;ll send you a competitive quote within one business day.
                  </p>
                </div>

                <EnquiryForm type="quote" />

                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 18,
                    borderTop: '1px solid #e8ecf1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <a
                    href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hi, I'm interested in ${product.name}. Please share pricing.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      justifyContent: 'center',
                      background: '#25D366',
                      color: '#fff',
                      border: '1px solid #25D366',
                      fontSize: 14,
                      padding: '11px 18px',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp for quick enquiry
                  </a>
                  <a
                    href={`tel:${site.phoneHref}`}
                    className="btn btn-outline"
                    style={{ justifyContent: 'center', fontSize: 14, padding: '11px 18px' }}
                  >
                    Call: {site.phone}
                  </a>
                </div>
              </div>

              {/* Back to catalog */}
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Link
                  href="/products"
                  style={{ fontSize: 14, color: 'var(--brand-700)', fontWeight: 600, textDecoration: 'none' }}
                >
                  ← Back to all products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
