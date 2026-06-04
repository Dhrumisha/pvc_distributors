'use client';
// src/components/layout/Topbar.tsx
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, ChevronRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/lib/services';
import Link from 'next/link';

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  inventory: 'Inventory', products: 'Products', stock: 'Stock Ledger',
  batches: 'Batch & Lots', restock: 'Restock Cart', categories: 'Categories',
  suppliers: 'Suppliers', 'purchase-orders': 'Purchase Orders', receipts: 'Receipts', invoices: 'Invoices',
  customers: 'Customers', 'price-lists': 'Price Lists', ledger: 'Ledger',
  sales: 'Sales', quotations: 'Quotations', orders: 'Orders', templates: 'Templates',
  delivery: 'Delivery', vehicles: 'Vehicles', routes: 'Routes', returns: 'Returns',
  billing: 'Billing', 'credit-notes': 'Credit Notes',
  payments: 'Payments', customer: 'Customer', supplier: 'Supplier', aging: 'Aging', cheques: 'Cheques Due',
  reports: 'Reports', notifications: 'Notifications',
  admin: 'Admin', users: 'Users', roles: 'Roles', audit: 'Audit Logs',
};

export default function Topbar() {
  const pathname  = usePathname();
  const { user }  = useAuth();
  const [unread,  setUnread]  = useState(0);
  const [search,  setSearch]  = useState('');

  // Breadcrumb
  const crumbs = pathname.split('/').filter(Boolean).map((seg, i, arr) => ({
    label: BREADCRUMB_MAP[seg] || seg,
    href:  '/' + arr.slice(0, i + 1).join('/'),
    isLast: i === arr.length - 1,
  }));

  useEffect(() => {
    notificationService.unreadCount()
      .then(r => setUnread(r.data?.data?.count || 0))
      .catch(() => {});
  }, [pathname]);

  return (
    <header
      className="flex items-center justify-between px-7 flex-shrink-0"
      style={{
        height: 'var(--topbar-h)',
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-default)',
        gap: 16,
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
            {crumb.isLast ? (
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                letterSpacing: '-0.01em', whiteSpace: 'nowrap',
              }}>
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} style={{
                fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
              className="hover:text-white transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="search"
            placeholder="Quick search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              padding: '6px 12px 6px 30px',
              width: 200,
              outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-muted)'; }}
            onBlur={e =>  { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Refresh */}
        <button className="btn-icon" onClick={() => window.location.reload()} title="Refresh page">
          <RefreshCw size={14} />
        </button>

        {/* Notifications */}
        <Link href="/notifications" className="btn-icon relative" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={15} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: 'var(--accent)', fontSize: 9, fontWeight: 700, color: '#0a0c10' }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)', cursor: 'default' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
            {user?.name?.[0]?.toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
