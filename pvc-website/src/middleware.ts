import { NextRequest, NextResponse } from 'next/server';

// Guard the customer portal: /account/* requires a session cookie.
// (login/register are allowed through.)
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAccount = pathname.startsWith('/account');
  const isAuthPage = pathname === '/account/login' || pathname === '/account/register';
  const token = req.cookies.get('pvc_customer')?.value;

  if (isAccount && !isAuthPage && !token) {
    const url = new URL('/account/login', req.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/account', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/account/:path*'] };
