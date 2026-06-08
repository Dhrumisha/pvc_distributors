import { NextResponse } from 'next/server';
import { portalRegister, PORTAL_COOKIE } from '@/lib/portal';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = await portalRegister(body);
  if (result.ok && result.data?.token) {
    const res = NextResponse.json({ success: true, customer: result.data.customer, message: result.message });
    res.cookies.set(PORTAL_COOKIE, result.data.token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
      path: '/', maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  }
  return NextResponse.json({ success: false, message: result.message || 'Could not create account.' }, { status: result.status || 400 });
}
