// src/app/products/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategories, getProducts } from '@/lib/api';
import { PageHero, ProductCard, CtaBand } from '@/components/ui';
import { Search, Boxes, ChevronLeft, ChevronRight } from 'lucide-react';
import { site } from '@/config/site';

export const revalidate = 300;

export const metadata: Metadata = {
  title: `Products — ${site.name}`,
  description:
    'Browse our full catalog of PVC sheets, ACP panels, pipes, profiles and building materials. ' +
    'Competitive wholesale pricing, bulk supply and fast delivery for builders, contractors, fabricators and retailers.',
  openGraph: {
    title: `Products — ${site.name}`,
    description:
      'Shop PVC sheets, ACP panels, pipes, profiles and more at wholesale prices. ' +
      'Bulk orders welcome. Request a quote today.',
  },
};

const LIMIT = 24;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; page?: string };
}) {
  const activeCategoryId = searchParams.category ?? '';
  const search = searchParams.search ?? '';
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [categories, { products, total }] = await Promise.all([
    getCategories(),
    getProducts({
      category_id: activeCategoryId || undefined,
      search: search || undefined,
      limit: LIMIT,
      page,
    }),
  ]);

  const totalPages = Math.ceil(total / LIMIT);

  // Build a link that preserves query params, swapping one value
  function buildHref(overrides: { category?: string; search?: string; page?: number }) {
    const params = new URLSearchParams();
    const cat = 'category' in overrides ? overrides.category : activeCategoryId;
    const q = 'search' in overrides ? overrides.search : search;
    const p = 'page' in overrides ? overrides.page : page;
    if (cat) params.set('category', cat);
    if (q) params.set('search', q);
    if (p && p > 1) params.set('page', String(p));
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ''}`;
  }

  const activeCategory = categories.find(c => String(c.id) === activeCategoryId);

  return (
    <>
      <PageHero
        eyebrow="Our catalog"
        title="Products"
        subtitle={
          activeCategory
            ? `Showing ${activeCategory.name} — quality materials at wholesale pricing.`
            : 'PVC sheets, ACP panels, pipes, profiles and building materials — competitive wholesale pricing for trade buyers.'
        }
      />

      {/* ── Filter + Search bar ── */}
      <section style={{ borderBottom: '1px solid #e8ecf1', background: '#f7f9fb' }}>
        <div className="container-x" style={{ paddingBlock: 20 }}>

          {/* Category pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: categories.length > 0 ? 16 : 0,
            }}
          >
            <Link
              href="/products"
              className="btn"
              style={{
                padding: '7px 16px',
                fontSize: 14,
                borderRadius: 999,
                background: !activeCategoryId ? 'var(--brand)' : '#fff',
                color: !activeCategoryId ? '#fff' : 'var(--brand-700)',
                border: !activeCategoryId ? '1px solid var(--brand)' : '1px solid #d1d5db',
              }}
            >
              All
            </Link>
            {categories.map(c => {
              const active = String(c.id) === activeCategoryId;
              return (
                <Link
                  key={c.id}
                  href={buildHref({ category: String(c.id), page: 1 })}
                  className="btn"
                  style={{
                    padding: '7px 16px',
                    fontSize: 14,
                    borderRadius: 999,
                    background: active ? 'var(--brand)' : '#fff',
                    color: active ? '#fff' : 'var(--brand-700)',
                    border: active ? '1px solid var(--brand)' : '1px solid #d1d5db',
                  }}
                >
                  {c.name}
                  {typeof c.product_count === 'number' && (
                    <span style={{ fontSize: 12, opacity: 0.75, marginLeft: 4 }}>
                      ({c.product_count})
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Search box */}
          <form action="/products" method="get" style={{ display: 'flex', gap: 8, maxWidth: 480 }}>
            {activeCategoryId && (
              <input type="hidden" name="category" value={activeCategoryId} />
            )}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={16}
                color="var(--muted)"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                name="search"
                type="text"
                defaultValue={search}
                placeholder="Search products…"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid #d1d5db',
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: '#fff',
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px', fontSize: 14 }}>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ── Grid ── */}
      <section className="section">
        <div className="container-x">

          {/* Result count */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 28,
            }}
          >
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 15 }}>
              {total > 0 ? (
                <>
                  Showing{' '}
                  <strong style={{ color: 'var(--ink)' }}>
                    {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}
                  </strong>{' '}
                  of <strong style={{ color: 'var(--ink)' }}>{total}</strong> product
                  {total !== 1 ? 's' : ''}
                  {search && (
                    <>
                      {' '}for{' '}
                      <em style={{ color: 'var(--ink)' }}>&ldquo;{search}&rdquo;</em>
                    </>
                  )}
                </>
              ) : null}
            </p>
            {search && (
              <Link href={buildHref({ search: '', page: 1 })} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 13 }}>
                Clear search
              </Link>
            )}
          </div>

          {/* Products grid or empty state */}
          {products.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 20,
              }}
            >
              {products.map(p => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div
              className="card"
              style={{ padding: '56px 32px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}
            >
              <Boxes size={44} color="var(--brand-600)" style={{ margin: '0 auto 14px' }} />
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: '0 0 8px' }}>
                No products found
              </h2>
              <p className="lead" style={{ fontSize: 15, marginBottom: 20 }}>
                {search
                  ? `No results for "${search}". Try a different keyword or browse all categories.`
                  : 'No products are listed in this category yet.'}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/products" className="btn btn-outline">Browse all</Link>
                <Link href="/quote" className="btn btn-primary">Request a quote</Link>
              </div>
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 48,
                flexWrap: 'wrap',
              }}
            >
              {/* Prev */}
              {page > 1 ? (
                <Link
                  href={buildHref({ page: page - 1 })}
                  className="btn btn-outline"
                  style={{ padding: '9px 14px', fontSize: 14 }}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} /> Prev
                </Link>
              ) : (
                <span
                  className="btn"
                  style={{ padding: '9px 14px', fontSize: 14, opacity: 0.35, cursor: 'default', border: '1px solid #d1d5db' }}
                  aria-disabled="true"
                >
                  <ChevronLeft size={16} /> Prev
                </span>
              )}

              {/* Page numbers — show up to 7 around current */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === '…' ? (
                    <span key={`ellipsis-${i}`} style={{ padding: '9px 6px', color: 'var(--muted)', fontSize: 14 }}>…</span>
                  ) : (
                    <Link
                      key={n}
                      href={buildHref({ page: n as number })}
                      className="btn"
                      aria-current={n === page ? 'page' : undefined}
                      style={{
                        padding: '9px 14px',
                        fontSize: 14,
                        minWidth: 40,
                        justifyContent: 'center',
                        background: n === page ? 'var(--brand)' : '#fff',
                        color: n === page ? '#fff' : 'var(--brand-700)',
                        border: n === page ? '1px solid var(--brand)' : '1px solid #d1d5db',
                        fontWeight: n === page ? 700 : 600,
                      }}
                    >
                      {n}
                    </Link>
                  )
                )}

              {/* Next */}
              {page < totalPages ? (
                <Link
                  href={buildHref({ page: page + 1 })}
                  className="btn btn-outline"
                  style={{ padding: '9px 14px', fontSize: 14 }}
                  aria-label="Next page"
                >
                  Next <ChevronRight size={16} />
                </Link>
              ) : (
                <span
                  className="btn"
                  style={{ padding: '9px 14px', fontSize: 14, opacity: 0.35, cursor: 'default', border: '1px solid #d1d5db' }}
                  aria-disabled="true"
                >
                  Next <ChevronRight size={16} />
                </span>
              )}
            </nav>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
