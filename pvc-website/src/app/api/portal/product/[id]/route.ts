import { NextResponse } from 'next/server';
import { getPortalProduct } from '@/lib/portal';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const result = await getPortalProduct(params.id);
  return NextResponse.json({ product: result.data?.product || null }, { status: result.ok ? 200 : (result.status || 400) });
}
