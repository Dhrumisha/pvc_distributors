// src/lib/api.ts
// Server-side data access to the backend's PUBLIC endpoints.
// Runs on the server (in Server Components / route handlers) → no CORS, SEO-friendly.
const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000/api/v1';

async function getJSON(path: string, revalidate = 300) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface Category { id: number; name: string; product_count?: number; }
export interface Product {
  id: number; name: string; unit?: string; hsn_code?: string;
  category?: string; min_price?: number; max_price?: number; variant_count?: number;
  image_url?: string; badge?: string; in_stock?: boolean; stock?: number;
}
export interface ProductDetail extends Product {
  gst_rate?: number; description?: string;
  variants?: { id: number; sku: string; dimension_label?: string; color?: string; selling_price?: number; stock?: number; in_stock?: boolean }[];
}

export async function getCategories(): Promise<Category[]> {
  const j = await getJSON('/public/categories');
  return j?.data?.categories || [];
}

export async function getProducts(params: { category_id?: number | string; search?: string; limit?: number; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.category_id) qs.set('category_id', String(params.category_id));
  if (params.search)      qs.set('search', params.search);
  qs.set('limit', String(params.limit ?? 24));
  qs.set('page', String(params.page ?? 1));
  const j = await getJSON(`/public/products?${qs.toString()}`);
  return { products: (j?.data?.products || []) as Product[], total: j?.meta?.total || 0 };
}

export async function getProduct(id: number | string): Promise<ProductDetail | null> {
  const j = await getJSON(`/public/products/${id}`, 120);
  return j?.data?.product || null;
}

// Used by the enquiry route handler (server-side POST → backend).
export async function submitEnquiry(payload: Record<string, any>) {
  const res = await fetch(`${API_BASE}/public/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, ...json };
}
