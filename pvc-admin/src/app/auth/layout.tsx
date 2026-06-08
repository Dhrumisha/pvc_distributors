// src/app/auth/layout.tsx
// Wraps all /auth/* pages in a Suspense boundary so client hooks like
// useSearchParams() don't break the production build (static export).
import { Suspense } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
