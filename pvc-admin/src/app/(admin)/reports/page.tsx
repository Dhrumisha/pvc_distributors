'use client';
// src/app/(admin)/reports/page.tsx
// Click a report → it runs immediately and shows the data on screen.
// Adjust filters and Apply to refresh; use Export CSV / PDF to download.
import { useState, useEffect, useCallback } from 'react';
import { reportService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { BarChart2, Download, FileText, RefreshCw, ArrowLeft } from 'lucide-react';

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

const SERVICE_MAP: Record<string, any> = {
  'sales': () => reportService.sales, 'purchases': () => reportService.purchases,
  'profit-loss': () => reportService.profitLoss, 'stock': () => reportService.stock,
  'stock-movement': () => reportService.stockMovement, 'dead-stock': () => reportService.deadStock,
  'payments': () => reportService.payments, 'outstanding': () => reportService.outstanding,
  'aging': () => reportService.aging, 'gst': () => reportService.gst,
  'customer-profitability': () => reportService.customerProfitability,
  'deliveries': () => reportService.deliveries,
  'supplier-price-trend': () => reportService.supplierPriceTrend,
  'sales-staff': () => reportService.salesStaff,
};

const fmtVal = (v: any) =>
  typeof v === 'number' ? v.toLocaleString('en-IN') : (v == null || v === '' ? '—' : String(v));
const prettify = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function ReportsPage() {
  const [selected,  setSelected]  = useState<string | null>(null);
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [month,     setMonth]     = useState(new Date().getMonth() + 1);
  const [year,      setYear]      = useState(new Date().getFullYear());
  const [days,      setDays]      = useState(60);
  const [loading,   setLoading]   = useState(false);
  const [exporting, setExporting] = useState('');
  const [rows,      setRows]      = useState<any[]>([]);
  const [summary,   setSummary]   = useState<Record<string, any> | null>(null);

  const activeReport = REPORTS.find(r => r.id === selected);

  const buildParams = useCallback((fmt: string) => {
    const params: Record<string, any> = { format: fmt };
    if (!['gst', 'dead-stock', 'stock'].includes(selected || '')) {
      if (fromDate) params.from_date = fromDate;
      if (toDate)   params.to_date   = toDate;
    }
    if (selected === 'gst')        { params.month = month; params.year = year; }
    if (selected === 'dead-stock') { params.days = days; }
    return params;
  }, [selected, fromDate, toDate, month, year, days]);

  const loadPreview = useCallback(async () => {
    if (!selected) return;
    const fn = SERVICE_MAP[selected]?.();
    if (!fn) { toast.error('Report not available'); return; }
    setLoading(true); setRows([]); setSummary(null);
    try {
      const res = await fn(buildParams('json'));
      const data = res.data?.data;
      const r = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
      setRows(r);
      setSummary(data && !Array.isArray(data) ? (data.summary || null) : null);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, [selected, buildParams]);

  // Auto-run whenever a report is selected
  useEffect(() => { if (selected) loadPreview(); /* eslint-disable-next-line */ }, [selected]);

  const exportReport = async (fmt: 'csv' | 'pdf') => {
    if (!selected) return;
    const fn = SERVICE_MAP[selected]?.();
    if (!fn) return;
    setExporting(fmt);
    try {
      const res = await fn(buildParams(fmt));
      const mime = fmt === 'csv' ? 'text/csv' : 'application/pdf';
      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${selected}-report.${fmt}`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${fmt.toUpperCase()} downloaded`);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setExporting(''); }
  };

  // ── Report list (grid) ────────────────────────────────────────────────────────
  if (!selected) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="page-title">Reports</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            Click any report to view it on screen. You can filter by date and export to CSV or PDF.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {REPORTS.map(r => (
            <button key={r.id} onClick={() => setSelected(r.id)}
              className="card"
              style={{ padding: '16px', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border-default)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.transform = 'none'; }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: r.color + '18', color: r.color }}>
                <BarChart2 size={17} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{r.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Single report view ──────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button className="btn-icon" onClick={() => { setSelected(null); setRows([]); setSummary(null); }}><ArrowLeft size={16} /></button>
          <div>
            <h1 className="page-title">{activeReport?.label}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{activeReport?.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => exportReport('csv')} disabled={exporting === 'csv' || loading}>
            {exporting === 'csv' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><Download size={14} /> CSV</>}
          </button>
          <button className="btn-secondary" onClick={() => exportReport('pdf')} disabled={exporting === 'pdf' || loading}>
            {exporting === 'pdf' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><FileText size={14} /> PDF</>}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4 items-end">
        {!['gst', 'dead-stock', 'stock'].includes(selected) && (
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
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
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
              <option value={30}>30 days</option><option value={60}>60 days</option><option value={90}>90 days</option>
            </select>
          </div>
        )}
        <button className="btn-primary flex items-center gap-2" onClick={loadPreview} disabled={loading} style={{ marginBottom: 1 }}>
          {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Loading…</> : <><RefreshCw size={14} /> Apply</>}
        </button>
      </div>

      {/* Summary */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summary).map(([k, v]) => (
            <div className="card p-4" key={k}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{prettify(k)}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{typeof v === 'number' ? Number(v).toLocaleString('en-IN') : fmtVal(v)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Data table */}
      <div className="card">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="section-title">Results</h2>
          {!loading && <span className="badge badge-success">{rows.length} rows</span>}
        </div>
        <div className="table-wrap" style={{ maxHeight: 540, overflowY: 'auto' }}>
          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : rows.length === 0 ? (
            <div className="empty-state py-12">
              <BarChart2 size={32} className="empty-state-icon" />
              <p className="empty-state-title">No data for this report</p>
              <p className="empty-state-desc">Try a different date range, or add some records first.</p>
            </div>
          ) : (
            <table className="table">
              <thead><tr>{Object.keys(rows[0]).map(k => <th key={k}>{prettify(k)}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0, 200).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v: any, j) => (
                      <td key={j} style={{ fontFamily: typeof v === 'number' ? 'var(--font-mono)' : 'inherit' }}>{fmtVal(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {rows.length > 200 && (
          <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Showing first 200 of {rows.length} rows — export to CSV for the full data.
          </div>
        )}
      </div>
    </div>
  );
}
