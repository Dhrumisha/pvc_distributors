// src/app/api/enquiry/route.ts
// Server-side handler: receives the website form and forwards it to the backend
// public enquiry endpoint (avoids any CORS; keeps the API URL server-only).
import { NextResponse } from 'next/server';
import { submitEnquiry } from '@/lib/api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name || (!body?.email && !body?.phone)) {
      return NextResponse.json({ success: false, message: 'Please provide your name and a phone or email.' }, { status: 400 });
    }
    const result = await submitEnquiry({
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      subject: body.subject,
      message: body.message,
      type: body.type === 'quote' ? 'quote' : 'contact',
      product_interest: body.product_interest,
    });
    return NextResponse.json(
      { success: !!result.success, message: result.message || (result.success ? 'Received' : 'Could not submit') },
      { status: result.ok ? 200 : 502 }
    );
  } catch {
    return NextResponse.json({ success: false, message: 'Something went wrong. Please try again or call us.' }, { status: 500 });
  }
}
