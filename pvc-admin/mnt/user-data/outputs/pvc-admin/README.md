# PVC Distributor Admin — Next.js Frontend

A production-ready admin panel for PVC raw material distribution.
Built with Next.js 14, TypeScript, Tailwind CSS, and Recharts.

---

## Quick Start

```bash
cd pvc-admin
cp .env.example .env.local        # Add your API URL
npm install
npm run dev                        # http://localhost:3000
```

---

## Theming — Single Variable Changes

### Change the accent colour (currently warm amber)
Open `tailwind.config.js` and change the `brand.500` value:
```js
brand: {
  500: '#f59e0b',  // ← Change this hex to retheme buttons, highlights, badges
}
```
Then update the matching CSS variable in `src/styles/globals.css`:
```css
--accent: #f59e0b;    /* ← Same value here */
--accent-light: #fbbf24;
--accent-dark:  #d97706;
```

### Change the background tone (currently deep slate)
In `globals.css`, adjust the `--bg-*` variables:
```css
--bg-page:    #0f1117;   /* main page background */
--bg-sidebar: #13161e;   /* sidebar */
--bg-card:    #181c27;   /* cards */
```

### Change fonts
In `tailwind.config.js`:
```js
fontFamily: {
  display: ['Sora', ...],    // ← Headings and page titles
  body:    ['DM Sans', ...], // ← Body text, buttons, labels
  mono:    ['JetBrains Mono', ...], // ← Code, SKUs, numbers
}
```
Update the `@import` URL in `globals.css` to load your new fonts from Google Fonts.

---

## Project Structure

```
src/
  app/
    auth/login/page.tsx        Login page
    (admin)/
      layout.tsx               Auth guard + sidebar + topbar shell
      dashboard/page.tsx       KPI dashboard with charts
      inventory/products/      Products CRUD
      sales/orders/            Sales orders management
      customers/               Customer management
      billing/invoices/        Invoice management
      reports/                 All 14 report types
  components/
    layout/
      Sidebar.tsx              Navigation sidebar
      Topbar.tsx               Breadcrumb + search + notifications
  context/
    AuthContext.tsx            Global auth state (JWT + permissions)
  lib/
    api.ts                     Axios instance with auto token refresh
    services.ts                All ~180 API calls organized by module
  styles/
    globals.css                All CSS variables + component classes
```

---

## API Connection

All API calls are in `src/lib/services.ts`. Every service maps 1:1 to the
API Design Document endpoints. Change `NEXT_PUBLIC_API_URL` in `.env.local`
to point to your backend.

The Axios instance in `src/lib/api.ts` automatically:
- Injects the JWT Bearer token on every request
- Retries with a refreshed token on 401 errors
- Redirects to `/auth/login` if refresh also fails

---

## Permissions

The `useAuth()` hook provides `hasPermission(module, action)`:

```tsx
const { hasPermission } = useAuth();
if (hasPermission('invoices', 'create')) { /* show button */ }
```

The sidebar automatically hides links the user does not have permission for.
Admin role bypasses all permission checks.

---

## Pages Included

| Route | Page |
|---|---|
| `/auth/login` | Login with JWT |
| `/dashboard` | KPIs, revenue chart, low stock, overdue payments |
| `/inventory/products` | Product CRUD with SKU management |
| `/sales/orders` | Sales order list with confirm/cancel |
| `/customers` | Customer CRUD with hold toggle |
| `/billing/invoices` | Invoice list with issue/PDF/share |
| `/reports` | All 14 report types with CSV/PDF export |

Additional pages (suppliers, purchase orders, delivery, payments, etc.)
follow the same pattern — copy any existing page and swap the service import.
