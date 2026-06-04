'use client';
// src/app/(admin)/reports/page.tsx
import { useState } from 'react';
import { reportService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  BarChart2, Download, TrendingUp, Package, CreditCard,
  Truck, FileText, IndianRupee, Users, ShoppingCart, AlertTriangle
} from 'lucide-react';

const REPORTS = [
  { id: 'sales',                label: 'Sales Report',              color: '#3b82f6', desc: 'Revenue by date, customer, product' },
  { id: 'purchases',            label: 'Purchase Report',           color: '#f59e0b', desc: 'Purchases by supplier and date' },
  { id: 'profit-loss',          label: 'Profit & Loss',             color: '#22c55e', desc: 'Gross margin per order' },
  { id: 'stock',                label: 'Stock Report',              color: '#f59e0b', desc: 'Current inventory valuation' },
  { id: 'stock-movement',       label: 'Stock Movement',            color: '#3b82f6', desc: 'All stock in/out transactions' },
  { id: 'dead-stock',           label: 'Dead Stock',                color: '#ef4444', desc: 'Non-moving inventory items' },
  { id: 'payments',             label: 'Payment Report',            color: '#22c55e', desc: 'Collected, outstanding, overdue' },
  { id: 'outstanding',          label: 'Outstanding Receivables',   color: '#ef4444', desc: 'Total dues per customer' },
  { id: 'aging',                label: 'Aging Report',              color: '#ef4444', desc: '30/60/90+ day overdue buckets' },
  { id: 'gst',                  label: 'GST Report (GSTR-1)',       color: '#3b82f6', desc: 'Monthly HSN-wise tax summary' },
  { id: 'customer-profitability',label:'Customer Profitability',    color: '#22c55e', desc: 'Revenue, cost, margin per customer' },
  { id: 'deliveries',           label: 'Delivery Report',           color: '#f59e0b', desc: 'Delivery status and timeline' },
  { id: 'supplier-price-trend', label: 'Supplier Price Trends',     color: '#f59e0b', desc: 'Historical price changes per supplier' },
  { id: 'sales-staff',          label: 'Staff Performance',         color: '#3b82f6', desc: 'Orders and revenue per salesperson' },
];

type Format = 'json' | 'csv' | 'pdf';

export default function ReportsPage() {
  const [selected,  setSelected]  = useState<string | null>(null);
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [format,    setFormat]    = useState<Format>('csv');
  const [month,     setMonth]     = useState(new Date().getMonth() + 1);
  const [year,      setYear]      = useState(new Date().getFullYear());
  const [days,      setDays]      = useState(60);
  const [loading,   setLoading]   = useState(false);
  const [results,   setResults]   = useState<any[] | null>(null);

  const activeReport = REPORTS.find(r => r.id === selected);

  const run = async () => {
    if (!selected) return;
    setLoading(true); setResults(null);
    const params: Record<string, any> = { format };
    if (!['gst','dead-stock','stock'].includes(selected)) {
      if (fromDate) params.from_date = fromDate;
      if (toDate)   params.to_date   = toDate;
    }
    if (selected === 'gst')        { params.month = month; params.year = year; }
    if (selected === 'dead-stock') { params.days = days; }
    try {
      const serviceMap: Record<string, any> = {
        'sales': reportService.sales, 'purchases': reportService.purchases,
        'profit-loss': reportService.profitLoss, 'stock': reportService.stock,
        'stock-movement': reportService.stockMovement, 'dead-stock': reportService.deadStock,
        'payments': reportService.payments, 'outstanding': reportService.outstanding,
        'aging': reportService.aging, 'gst': reportService.gst,
        'customer-profitability': reportService.customerProfitability,
        'deliveries': reportService.deliveries,
        'supplier-price-trend': reportService.supplierPriceTrend,
        'sales-staff': reportService.salesStaff,
      };
      const fn = serviceMap[selected];
      if (!fn) { toast.error('Report not available'); return; }
      const res = await fn(params);
      if (format === 'csv') {
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${selected}-report.csv`; a.click();
        URL.revokeObjectURL(url); toast.success('CSV downloaded');
      } else if (format === 'pdf') {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${selected}-report.pdf`; a.click();
        URL.revokeObjectURL(url); toast.success('PDF downloaded');
      } else {
        const data = res.data?.data;
        setResults(Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : []);
        toast.success('Report loaded');
      }
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title">Reports</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Generate and export reports for all business areas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {REPORTS.map(r => (
          <button key={r.id} onClick={() => { setSelected(r.id); setResults(null); }}
            style={{
              padding: '14px 16px', borderRadius: 10, border: '1px solid', cursor: 'pointer', textAlign: 'left',
              background: selected === r.id ? 'rgba(245,158,11,0.08)' : 'var(--bg-card)',
              borderColor: selected === r.id ? 'var(--accent-border)' : 'var(--border-default)',
              transition: 'all 0.15s',
            }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
              style={{ background: r.color + '18', color: r.color }}>
              <BarChart2 size={16} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: selected === r.id ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 2 }}>
              {r.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.desc}</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="card p-5 animate-slide-up">
          <h2 className="section-title mb-4">{activeReport?.label} — Configuration</h2>
          <div className="flex flex-wrap gap-4 items-end">
            {!['gst','dead-stock','stock'].includes(selected) && (
              <>
                <div className="form-group" style={{ minWidth: 150 }}>
                  <label className="form-label">From Date</label>
                  <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ minWidth: 150 }}>
                  <label className="form-label">To Date</label>
                  <input type="date" className="input" value={toDate} onChange={e => setToDate(e.target.value)} />
                </div>
              </>
            )}
            {selected === 'gst' && (
              <>
                <div className="form-group" style={{ minWidth: 120 }}>
                  <label className="form-label">Month</label>
                  <select className="input" value={month} onChange={e => setMonth(Number(e.target.value))}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i+1} value={i+1}>{new Date(0,i).toLocaleString('default',{month:'long'})}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ minWidth: 100 }}>
                  <label className="form-label">Year</label>
                  <input type="number" className="input" min="2020" max="2030" value={year} onChange={e => setYear(Number(e.target.value))} />
                </div>
              </>
            )}
            {selected === 'dead-stock' && (
              <div className="form-group" style={{ minWidth: 150 }}>
                <label className="form-label">No movement in (days)</label>
                <select className="input" value={days} onChange={e => setDays(Number(e.target.value))}>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Output Format</label>
              <div className="flex gap-1">
                {(['json','csv','pdf'] as Format[]).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    style={{
                      padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid', cursor: 'pointer',
                      background: format === f ? 'var(--accent-muted)' : 'transparent',
                      color: format === f ? 'var(--accent)' : 'var(--text-muted)',
                      borderColor: format === f ? 'var(--accent-border)' : 'var(--border-default)',
                    }}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn-primary flex items-center gap-2" onClick={run} disabled={loading} style={{ marginBottom: 1 }}>
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Running...</> : <><Download size={14} /> Run Report</>}
            </button>
          </div>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Preview — {results.length} rows</h2>
            <span className="badge badge-success">{results.length} records</span>
          </div>
          <div className="table-wrap" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>{Object.keys(results[0]).map(k => <th key={k}>{k.replace(/_/g,' ')}</th>)}</tr>
              </thead>
              <tbody>
                {results.slice(0, 50).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v: any, j) => (
                      <td key={j} style={{ fontFamily: typeof v === 'number' ? 'var(--font-mono)' : 'inherit' }}>
                        {typeof v === 'number' ? v.toLocaleString('en-IN') : String(v ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
