// src/middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
// Next.js Edge Middleware — runs on EVERY request before any page renders.
//
// Rules:
//   1. Public auth routes (/auth/*) — always accessible
//   2. Root (/) — redirect to /dashboard if logged in, else /auth/login
//   3. All other routes — require valid access_token cookie
//      └─ if missing → redirect to /auth/login?from=<original-path>
//
// NOTE: This is the ONLY place routing logic lives — no useEffect redirects
//       in page components needed for auth guarding.
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';

// Routes that never require authentication
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/set-password',
  '/auth/invite-sent',
];

// Static assets and Next.js internals — never touch these
const SKIP_PREFIXES = ['/_next', '/favicon', '/api', '/uploads'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static files
  if (SKIP_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!token) {
    if (isPublic) return NextResponse.next(); // let auth pages render
    // Redirect to login, remembering where they wanted to go
    const loginUrl = new URL('/auth/login', request.url);
    if (pathname !== '/') loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Already logged in ──────────────────────────────────────────────────────
  if (token) {
    // Visiting root → go to dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Visiting auth pages while logged in → redirect to dashboard
    if (isPublic) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
