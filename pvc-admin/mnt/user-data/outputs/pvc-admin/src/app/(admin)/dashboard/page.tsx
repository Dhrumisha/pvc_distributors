'use client';
// src/app/(admin)/dashboard/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { dashboardService } from '@/lib/services';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  ShoppingCart, Truck, AlertTriangle, IndianRupee,
  TrendingUp, TrendingDown, Package, Clock, ArrowRight, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface Summary {
  orders_today: number;
  pending_deliveries: number;
  low_stock_count: number;
  pending_receivable: number;
  overdue_invoices: number;
}

const FMT = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n / 1000).toFixed(1)}K`
  : `₹${n}`;

export default function DashboardPage() {
  const [summary,   setSummary]   = useState<Summary | null>(null);
  const [chart,     setChart]     = useState<{labels:string[];values:number[]}|null>(null);
  const [lowStock,  setLowStock]  = useState<any[]>([]);
  const [activity,  setActivity]  = useState<any[]>([]);
  const [overdue,   setOverdue]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [chartRange, setRange]    = useState('30d');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, chartRes, lsRes, actRes, ovRes] = await Promise.allSettled([
        dashboardService.summary(),
        dashboardService.revenueChart({ range: chartRange }),
        dashboardService.lowStock(),
        dashboardService.activity(),
        dashboardService.overduePayments({ limit: 5 }),
      ]);
      if (sumRes.status === 'fulfilled')   setSummary(sumRes.value.data.data);
      if (chartRes.status === 'fulfilled') setChart(chartRes.value.data.data);
      if (lsRes.status === 'fulfilled')    setLowStock(lsRes.value.data.data?.items || []);
      if (actRes.status === 'fulfilled')   setActivity(actRes.value.data.data?.activities || []);
      if (ovRes.status === 'fulfilled')    setOverdue(ovRes.value.data.data?.invoices || []);
    } finally { setLoading(false); }
  }, [chartRange]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const chartData = chart?.labels.map((l, i) => ({ label: l, value: chart.values[i] || 0 })) || [];

  const STATS = [
    {
      label: 'Orders Today',
      value: summary?.orders_today ?? '—',
      icon: <ShoppingCart size={18} />,
      color: 'var(--info)',
      bg: 'var(--info-bg)',
      href: '/sales/orders',
    },
    {
      label: 'Pending Deliveries',
      value: summary?.pending_deliveries ?? '—',
      icon: <Truck size={18} />,
      color: 'var(--warning)',
      bg: 'var(--warning-bg)',
      href: '/delivery',
    },
    {
      label: 'Low Stock Items',
      value: summary?.low_stock_count ?? '—',
      icon: <AlertTriangle size={18} />,
      color: 'var(--error)',
      bg: 'var(--error-bg)',
      href: '/inventory/products?filter=low_stock',
    },
    {
      label: 'Receivable',
      value: summary?.pending_receivable != null ? FMT(summary.pending_receivable) : '—',
      icon: <IndianRupee size={18} />,
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      href: '/payments/customer',
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn-secondary flex items-center gap-2" onClick={loadAll} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── KPI stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <Link key={s.label} href={s.href} className="stat-card card-hover" style={{ textDecoration: 'none' }}>
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)', marginTop: 2 }} />
            </div>
            <div>
              <div className="stat-value" style={{ color: loading ? 'var(--text-muted)' : s.color }}>
                {loading ? '...' : s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Revenue chart + low stock ──────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Revenue Chart */}
        <div className="card lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Revenue Trend</h2>
            <div className="flex gap-1">
              {['7d','30d','12m'].map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid',
                    background: chartRange === r ? 'var(--accent-muted)' : 'transparent',
                    color:      chartRange === r ? 'var(--accent)' : 'var(--text-muted)',
                    borderColor:chartRange === r ? 'var(--accent-border)' : 'var(--border-default)',
                    cursor: 'pointer',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {loading || chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center">
              {loading
                ? <div className="spinner" />
                : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No chart data available</p>
              }
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => FMT(v)} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 13 }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                  formatter={(v: number) => [FMT(v), 'Revenue']}
                />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="url(#grad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <AlertTriangle size={15} style={{ color: 'var(--error)' }} />
              Low Stock
            </h2>
            <Link href="/inventory/products?filter=low_stock"
              style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              View all
            </Link>
          </div>
          {loading ? <div className="spinner mx-auto mt-6" /> :
           lowStock.length === 0 ? (
            <div className="empty-state py-8">
              <Package size={28} className="empty-state-icon" />
              <p className="empty-state-title">All stock healthy</p>
            </div>
           ) : (
            <div className="space-y-2.5">
              {lowStock.slice(0, 8).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
                      {item.name || item.sku}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sku}</div>
                  </div>
                  <span className="badge badge-error flex-shrink-0">
                    {item.current_qty} left
                  </span>
                </div>
              ))}
            </div>
           )
          }
        </div>
      </div>

      {/* ── Activity + Overdue ─────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Activity Feed */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Recent Activity</h2>
          {loading ? <div className="spinner mx-auto mt-6" /> :
           activity.length === 0 ? (
            <div className="empty-state py-6">
              <Clock size={24} className="empty-state-icon" />
              <p className="empty-state-title">No recent activity</p>
            </div>
           ) : (
            <div className="space-y-1">
              {activity.slice(0, 8).map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-3 py-2.5"
                  style={{ borderBottom: i < 7 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: 'var(--accent)' }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 13, color: 'var(--text-primary)' }} className="truncate">
                      {a.description || a.message}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {a.time || a.created_at}
                    </p>
                  </div>
                </div>
              ))}
            </div>
           )
          }
        </div>

        {/* Overdue Invoices */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <IndianRupee size={14} style={{ color: 'var(--error)' }} />
              Overdue Payments
            </h2>
            <Link href="/payments/customer?overdue=true"
              style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              View all
            </Link>
          </div>
          {loading ? <div className="spinner mx-auto mt-6" /> :
           overdue.length === 0 ? (
            <div className="empty-state py-6">
              <TrendingUp size={24} className="empty-state-icon" />
              <p className="empty-state-title">No overdue invoices</p>
            </div>
           ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Invoice</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: 'right' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.map((inv: any) => (
                    <tr key={inv.id}>
                      <td className="td-primary">{inv.customer_name || inv.customer?.business_name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{inv.invoice_number}</td>
                      <td>
                        <span className="badge badge-error">{inv.due_date}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--error)' }}>
                        {FMT(inv.balance_due)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           )
          }
        </div>
      </div>
    </div>
  );
}
