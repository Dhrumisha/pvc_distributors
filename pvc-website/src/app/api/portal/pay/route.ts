import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000/api/v1';
const PORTAL_COOKIE = 'pvc_customer';

export async function POST(req: Request) {
  const token = cookies().get(PORTAL_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${API_BASE}/portal/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
