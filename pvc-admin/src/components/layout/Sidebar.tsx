'use client';
// src/components/layout/Sidebar.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Package, Boxes, TruckIcon, Users, ShoppingCart,
  FileText, CreditCard, BarChart2, Settings, ChevronDown,
  LogOut, Package2, ClipboardList, Bell, ShieldCheck,
  Warehouse, Receipt, ArrowLeftRight, UserCog, Store
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
  module?: string;
}

const NAV: NavItem[] = [
  { label: 'Dashboard',     href: '/dashboard',         icon: <LayoutDashboard size={16} /> },
  {
    label: 'Inventory',     icon: <Boxes size={16} />,   module: 'inventory',
    children: [
      { label: 'Products',      href: '/inventory/products' },
      { label: 'Stock Ledger',  href: '/inventory/stock' },
      { label: 'Batch & Lots',  href: '/inventory/batches' },
      { label: 'Restock Cart',  href: '/inventory/restock' },
      { label: 'Categories',    href: '/inventory/categories' },
    ],
  },
  {
    label: 'Suppliers',     icon: <Store size={16} />,   module: 'suppliers',
    children: [
      { label: 'Supplier List',     href: '/suppliers' },
      { label: 'Purchase Orders',   href: '/suppliers/purchase-orders' },
      { label: 'Goods Receipts',    href: '/suppliers/receipts' },
      { label: 'Supplier Invoices', href: '/suppliers/invoices' },
    ],
  },
  {
    label: 'Customers',     icon: <Users size={16} />,   module: 'customers',
    children: [
      { label: 'Customer List',  href: '/customers' },
      { label: 'Price Lists',    href: '/customers/price-lists' },
      { label: 'Ledger',         href: '/customers/ledger' },
    ],
  },
  {
    label: 'Sales',         icon: <ShoppingCart size={16} />, module: 'sales_orders',
    children: [
      { label: 'Quotations',    href: '/sales/quotations' },
      { label: 'Sales Orders',  href: '/sales/orders' },
      { label: 'Templates',     href: '/sales/templates' },
    ],
  },
  {
    label: 'Delivery',      icon: <TruckIcon size={16} />,  module: 'delivery',
    children: [
      { label: 'Deliveries',    href: '/delivery' },
      { label: 'Vehicles',      href: '/delivery/vehicles' },
      { label: 'Route Groups',  href: '/delivery/routes' },
      { label: 'Returns',       href: '/delivery/returns' },
    ],
  },
  {
    label: 'Billing',       icon: <FileText size={16} />,   module: 'invoices',
    children: [
      { label: 'Invoices',      href: '/billing/invoices' },
      { label: 'Credit Notes',  href: '/billing/credit-notes' },
    ],
  },
  {
    label: 'Payments',      icon: <CreditCard size={16} />, module: 'payments',
    children: [
      { label: 'Customer Payments',  href: '/payments/customer' },
      { label: 'Supplier Payments',  href: '/payments/supplier' },
      { label: 'Aging Report',       href: '/payments/aging' },
      { label: 'Cheques Due',        href: '/payments/cheques' },
    ],
  },
  { label: 'Reports',       href: '/reports',               icon: <BarChart2 size={16} />,   module: 'reports' },
  { label: 'Notifications', href: '/notifications',         icon: <Bell size={16} /> },
  {
    label: 'Admin',         icon: <ShieldCheck size={16} />, module: 'users',
    children: [
      { label: 'Users',          href: '/admin/users' },
      { label: 'Roles',          href: '/admin/roles' },
      { label: 'Customer Portal', href: '/admin/portal' },
      { label: 'Leads',          href: '/admin/leads' },
      { label: 'Audit Logs',     href: '/admin/audit' },
    ],
  },
];

function NavGroup({ item }: { item: NavItem }) {
  const pathname  = usePathname();
  const { hasPermission } = useAuth();
  const isActive  = item.children?.some(c => pathname.startsWith(c.href)) ?? false;
  const [open, setOpen] = useState(isActive);

  if (item.module && !hasPermission(item.module, 'view') &&
      !['dashboard', 'notifications'].includes(item.href || '')) return null;

  if (!item.children) {
    return (
      <Link href={item.href!} className={clsx('nav-link', pathname === item.href && 'active')}>
        {item.icon}
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className={clsx('nav-link w-full', isActive && 'active')}
        style={{ justifyContent: 'space-between' }}
      >
        <span className="flex items-center gap-2.5">{item.icon} {item.label}</span>
        <ChevronDown
          size={13}
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'none',
            color: 'var(--text-muted)',
          }}
        />
      </button>

      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 animate-fade-in"
          style={{ paddingLeft: 10, borderLeft: '1px solid var(--border-subtle)' }}>
          {item.children.map(child => (
            <Link
              key={child.href}
              href={child.href}
              className={clsx('nav-link', pathname === child.href && 'active')}
              style={{ paddingLeft: 10, fontSize: 13 }}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="md:hidden" onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40 }} />
      )}
    <aside
      className={
        'flex flex-col flex-shrink-0 h-full overflow-y-auto fixed inset-y-0 left-0 z-50 ' +
        'transform transition-transform duration-200 md:static md:z-auto md:translate-x-0 ' +
        (open ? 'translate-x-0' : '-translate-x-full')
      }
      style={{
        width: 'var(--sidebar-w)',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-default)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent)', boxShadow: '0 0 16px rgba(245,158,11,0.25)' }}>
          <Package size={16} color="#0a0c10" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            PVC Admin
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
            Distributor System
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
        onClick={(e) => { if ((e.target as HTMLElement).closest('a')) onClose?.(); }}>
        {NAV.map(item => <NavGroup key={item.label} item={item} />)}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3 p-2.5 rounded-lg"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-muted)', border: '1px solid var(--accent-border)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}
              className="truncate">{user?.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }} className="truncate">{user?.email}</div>
          </div>
          <button onClick={logout} className="btn-icon" style={{ width: 28, height: 28, flexShrink: 0 }}
            title="Sign out">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
