// src/lib/portal.ts
// Customer-portal data access. The customer JWT lives in an httpOnly cookie
// ('pvc_customer'); server components/route handlers read it and call the backend.
import { cookies } from 'next/headers';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000/api/v1';
export const PORTAL_COOKIE = 'pvc_customer';

export function getToken(): string | null {
  return cookies().get(PORTAL_COOKIE)?.value || null;
}

async function authed(path: string, init: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/portal${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, ...json };
}

export async function getMe()          { return authed('/me'); }
export async function getMyOrders()    { return authed('/orders'); }
export async function getMyOrder(id: string) { return authed(`/orders/${id}`); }
export async function getOutstanding() { return authed('/outstanding'); }
export async function getPortalProducts(params: { search?: string; category_id?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.category_id) qs.set('category_id', params.category_id);
  return authed(`/products?${qs.toString()}`);
}
export async function getPortalProduct(id: string) { return authed(`/products/${id}`); }

// Direct (token passed in) — used by route handlers.
export async function portalLogin(body: any) {
  const res = await fetch(`${API_BASE}/portal/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
  return { ok: res.ok, ...(await res.json().catch(() => ({}))) };
}
export async function portalRegister(body: any) {
  const res = await fetch(`${API_BASE}/portal/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
  return { ok: res.ok, ...(await res.json().catch(() => ({}))) };
}
export async function placeOrder(body: any) { return authed('/orders', { method: 'POST', body: JSON.stringify(body) }); }
