import { NextResponse } from 'next/server';
import { placeOrder } from '@/lib/portal';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = await placeOrder(body);
  return NextResponse.json(
    { success: !!result.success, message: result.message, order: result.data?.order },
    { status: result.ok ? 200 : (result.status || 400) }
  );
}
