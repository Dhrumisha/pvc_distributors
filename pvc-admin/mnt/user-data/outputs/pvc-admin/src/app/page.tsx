// src/app/page.tsx
// Root route — middleware.ts handles the redirect:
//   logged in  → /dashboard
//   logged out → /auth/login
// This page never actually renders, but Next.js requires it.
export default function RootPage() {
  return null;
}
