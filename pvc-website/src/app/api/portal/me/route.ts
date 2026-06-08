import { NextResponse } from 'next/server';
import { getMe } from '@/lib/portal';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getMe();
  if (result.ok && result.data?.customer) {
    return NextResponse.json({ customer: result.data.customer });
  }
  return NextResponse.json({ customer: null }, { status: 200 });
}
