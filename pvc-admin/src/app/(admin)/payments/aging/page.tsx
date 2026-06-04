'use client';
// src/app/(admin)/payments/aging/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { customerPaymentService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { BarChart2, RefreshCw } from 'lucide-react';

const FMT = (n: any) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`;

// Colours for overdue buckets (anything beyond current is "overdue")
const OVERDUE_STYLE = { color: 'var(--error)', fontWeight: 700 };

export default function AgingReportPage() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerPaymentService.aging();
      setRows(res.data.data?.aging || res.data.data || []);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grandTotal = rows.reduce((s: number, r: any) => s + Number(r.total_due ?? 0), 0);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Aging Report</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            Outstanding invoice aging by customer · {rows.length} customers
          </p>
        </div>
        <button className="btn-icon" onClick={load} title="Refresh">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Summary strip */}
      {rows.length > 0 && (
        <div className="card p-4 flex flex-wrap gap-6">
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Outstanding</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--error)', marginTop: 2 }}>{FMT(grandTotal)}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Customers</p>
            <p style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{rows.length}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>0–30 days</th>
                <th>31–60 days</th>
                <th>61–90 days</th>
                <th>90+ days</th>
                <th>Total Due</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state py-12">
                    <BarChart2 size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No outstanding invoices</p>
                    <p className="empty-state-desc">All customer invoices are settled — great job!</p>
                  </div>
                </td></tr>
              ) : rows.map((r: any, idx: number) => (
                <tr key={idx}>
                  <td>
                    <div className="td-primary">{r.customer || '—'}</div>
                  </td>
                  {/* 0-30: neutral (current) */}
                  <td style={{ fontWeight: 600 }}>{FMT(r['0_30'])}</td>
                  {/* 31-60: overdue — red */}
                  <td style={Number(r['31_60'] ?? 0) > 0 ? OVERDUE_STYLE : {}}>{FMT(r['31_60'])}</td>
                  {/* 61-90: overdue — red */}
                  <td style={Number(r['61_90'] ?? 0) > 0 ? OVERDUE_STYLE : {}}>{FMT(r['61_90'])}</td>
                  {/* 90+: overdue — red */}
                  <td style={Number(r['over_90'] ?? 0) > 0 ? OVERDUE_STYLE : {}}>{FMT(r['over_90'])}</td>
                  {/* Total */}
                  <td style={{ fontWeight: 700, color: 'var(--error)' }}>{FMT(r.total_due)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
