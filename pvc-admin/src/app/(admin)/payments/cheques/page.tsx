'use client';
// src/app/(admin)/payments/cheques/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { customerPaymentService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { Hash, RefreshCw } from 'lucide-react';

const FMT  = (n: any) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`;
const DATE = (x: any) => x ? new Date(x).toLocaleDateString('en-IN') : '—';

// Cheques whose cheque_date is today or earlier are "due / urgent"
const isDue = (chequeDate: any) => {
  if (!chequeDate) return false;
  return new Date(chequeDate) <= new Date();
};

export default function ChequesDuePage() {
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerPaymentService.chequesDue();
      setRows(res.data.data?.cheques || res.data.data || []);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalAmount = rows.reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Cheques Due</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            Upcoming cheque clearances · next 7 days
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
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Cheque Value</p>
            <p style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{FMT(totalAmount)}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Cheques Pending</p>
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
                <th>Cheque No.</th>
                <th>Customer</th>
                <th>Invoice</th>
                <th>Amount</th>
                <th>Cheque Date</th>
                <th>Bank</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state py-12">
                    <Hash size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No cheques due</p>
                    <p className="empty-state-desc">No cheques are due for clearance in the next 7 days.</p>
                  </div>
                </td></tr>
              ) : rows.map((c: any) => {
                const due = isDue(c.cheque_date);
                return (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {c.cheque_number || '—'}
                    </td>
                    <td>
                      <div className="td-primary">{c.business_name || c.customer_name || '—'}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {c.invoice_number || '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{FMT(c.amount)}</td>
                    <td style={due ? { color: 'var(--error)', fontWeight: 600 } : { fontSize: 13 }}>
                      {DATE(c.cheque_date)}
                      {due && <span style={{ fontSize: 10, marginLeft: 5, verticalAlign: 'middle' }}>
                        <span className="badge badge-error" style={{ fontSize: 9, padding: '2px 5px' }}>DUE</span>
                      </span>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {c.cheque_bank || '—'}
                    </td>
                    <td>
                      <span className={`badge ${due ? 'badge-warning' : 'badge-info'}`}>
                        {due ? 'Clearing' : 'Upcoming'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
