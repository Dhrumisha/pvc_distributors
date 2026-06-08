'use client';
// src/components/layout/Topbar.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, ChevronRight, RefreshCw, Users, Package, Store, Loader2, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { notificationService, customerService, productService, supplierService } from '@/lib/services';
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

interface SearchResult {
  type: 'customer' | 'product' | 'supplier';
  id: number;
  label: string;
  sub?: string;
  href: string;
}

export default function Topbar({ onMenu }: { onMenu?: () => void }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user }  = useAuth();
  const [unread,  setUnread]  = useState(0);

  // ── Global search ────────────────────────────────────────────────────────────
  const [search,   setSearch]   = useState('');
  const [results,  setResults]  = useState<SearchResult[]>([]);
  const [searching,setSearching]= useState(false);
  const [open,     setOpen]     = useState(false);
  const boxRef   = useRef<HTMLDivElement>(null);
  const debRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Clear search when navigating
  useEffect(() => { setSearch(''); setResults([]); setOpen(false); }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const [cs, ps, ss] = await Promise.allSettled([
        customerService.list({ search: q, limit: 5 }),
        productService.list({ search: q, limit: 5 }),
        supplierService.list({ search: q, limit: 5 }),
      ]);
      const out: SearchResult[] = [];
      if (cs.status === 'fulfilled') {
        (cs.value.data.data?.customers || []).forEach((c: any) =>
          out.push({ type: 'customer', id: c.id, label: c.business_name, sub: c.phone, href: `/customers/${c.id}` }));
      }
      if (ps.status === 'fulfilled') {
        (ps.value.data.data?.products || []).forEach((p: any) =>
          out.push({ type: 'product', id: p.id, label: p.name, sub: p.unit, href: `/inventory/products/${p.id}` }));
      }
      if (ss.status === 'fulfilled') {
        (ss.value.data.data?.suppliers || []).forEach((s: any) =>
          out.push({ type: 'supplier', id: s.id, label: s.name, sub: s.phone, href: `/suppliers` }));
      }
      setResults(out);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  const onSearchChange = (v: string) => {
    setSearch(v);
    setOpen(true);
    if (debRef.current) clearTimeout(debRef.current);
    if (v.trim().length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    debRef.current = setTimeout(() => runSearch(v.trim()), 300);
  };

  const go = (href: string) => { setOpen(false); setSearch(''); setResults([]); router.push(href); };

  const ICON = { customer: Users, product: Package, supplier: Store };

  return (
    <header
      className="flex items-center justify-between px-4 md:px-7 flex-shrink-0"
      style={{
        height: 'var(--topbar-h)',
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-default)',
        gap: 12,
      }}
    >
      {/* Mobile hamburger + Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <button className="btn-icon md:hidden" onClick={onMenu} aria-label="Open menu" style={{ flexShrink: 0 }}>
          <Menu size={18} />
        </button>
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
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Global search */}
        <div className="relative hidden md:block" ref={boxRef}>
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)', zIndex: 1 }} />
          <input
            type="text"
            placeholder="Search customers, products, suppliers..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={e => { setOpen(true); e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-muted)'; }}
            onBlur={e =>  { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
            onKeyDown={e => {
              if (e.key === 'Enter' && results[0]) go(results[0].href);
              if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur(); }
            }}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              padding: '6px 12px 6px 30px',
              width: 260,
              outline: 'none',
            }}
          />
          {searching && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: 'var(--text-muted)' }} />}

          {/* Results dropdown */}
          {open && search.trim().length >= 2 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 340, maxHeight: 420, overflowY: 'auto',
              background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 10,
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)', zIndex: 50, padding: 6,
            }}>
              {searching ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Searching…</div>
              ) : results.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>No matches for “{search}”</div>
              ) : results.map(r => {
                const Icon = ICON[r.type];
                return (
                  <button key={`${r.type}-${r.id}`} onClick={() => go(r.href)}
                    className="w-full flex items-center gap-3"
                    style={{ padding: '8px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                      <Icon size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.type}{r.sub ? ` · ${r.sub}` : ''}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
