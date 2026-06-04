'use client';
// src/app/(admin)/customers/ledger/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { customerService, ledgerService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

const FMT = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function CustomerLedgerPage() {
  const [customers,     setCustomers]    = useState<any[]>([]);
  const [customersLoad, setCustomersLoad]= useState(true);
  const [selectedId,    setSelectedId]   = useState<number | null>(null);

  // Summary
  const [summary, setSummary] = useState<{ billed: number; paid: number; outstanding: number; overdue: number } | null>(null);
  const [summaryLoad, setSummaryLoad] = useState(false);

  // Ledger entries
  const [entries,  setEntries]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const LIMIT = 30;

  // Load customers once
  useEffect(() => {
    (async () => {
      setCustomersLoad(true);
      try {
        const res = await customerService.list({ limit: 100 });
        setCustomers(res.data.data?.customers || res.data.data || []);
      } catch (e) { toast.error(getApiError(e)); }
      finally { setCustomersLoad(false); }
    })();
  }, []);

  const loadLedger = useCallback(async (cid: number, pg: number) => {
    setLoading(true);
    try {
      const res = await ledgerService.get(cid, { page: pg, limit: LIMIT });
      setEntries(res.data.data?.entries || res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, []);

  const loadSummary = useCallback(async (cid: number) => {
    setSummaryLoad(true);
    try {
      const res = await ledgerService.summary(cid);
      const d = res.data.data;
      setSummary({
        billed:      d?.billed      ?? 0,
        paid:        d?.paid        ?? 0,
        outstanding: d?.outstanding ?? 0,
        overdue:     d?.overdue     ?? 0,
      });
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSummaryLoad(false); }
  }, []);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) { setSelectedId(null); setSummary(null); setEntries([]); setTotal(0); setPage(1); return; }
    const cid = Number(val);
    setSelectedId(cid);
    setPage(1);
    loadSummary(cid);
    loadLedger(cid, 1);
  };

  useEffect(() => {
    if (selectedId) loadLedger(selectedId, page);
  }, [page, selectedId, loadLedger]);

  const pages = Math.ceil(total / LIMIT);

  const TXN_BADGE: Record<string, string> = {
    invoice:       'badge-warning',
    payment:       'badge-success',
    credit_note:   'badge-info',
    adjustment:    'badge-neutral',
    opening:       'badge-accent',
  };

  const statCard = (label: string, value: number, accent?: string) => (
    <div className="card p-4 flex-1 min-w-[140px]">
      <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</p>
      {summaryLoad
        ? <div className="spinner" style={{ width: 18, height: 18 }} />
        : <p style={{ fontSize: 20, fontWeight: 700, color: accent || 'inherit' }}>{FMT(value)}</p>}
    </div>
  );

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="page-title">Customer Ledger</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
          View transaction history and account summary for a customer
        </p>
      </div>

      {/* Customer selector */}
      <div className="card p-4 flex items-center gap-3">
        <label style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Customer</label>
        {customersLoad ? (
          <div className="spinner" style={{ width: 16, height: 16 }} />
        ) : (
          <select
            className="input flex-1"
            style={{ maxWidth: 380 }}
            value={selectedId ?? ''}
            onChange={handleCustomerChange}
          >
            <option value="">— Select a customer —</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>{c.business_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* No customer selected */}
      {!selectedId && (
        <div className="card">
          <div className="empty-state py-16">
            <BookOpen size={36} className="empty-state-icon" />
            <p className="empty-state-title">Select a customer</p>
            <p className="empty-state-desc">Choose a customer above to view their ledger and account summary.</p>
          </div>
        </div>
      )}

      {/* Summary stat cards */}
      {selectedId && (
        <div className="flex flex-wrap gap-4">
          {statCard('Total Billed', summary?.billed ?? 0)}
          {statCard('Total Paid', summary?.paid ?? 0, 'var(--success)')}
          {statCard('Outstanding', summary?.outstanding ?? 0, 'var(--warning)')}
          {statCard('Overdue', summary?.overdue ?? 0, 'var(--error)')}
        </div>
      )}

      {/* Ledger table */}
      {selectedId && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                  <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                  <th style={{ textAlign: 'right' }}>Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state py-12">
                      <BookOpen size={28} className="empty-state-icon" />
                      <p className="empty-state-title">No ledger entries</p>
                      <p className="empty-state-desc">No transactions have been recorded for this customer yet.</p>
                    </div>
                  </td></tr>
                ) : entries.map((e: any) => (
                  <tr key={e.id}>
                    <td style={{ fontSize: 12 }}>
                      {e.txn_date ? new Date(e.txn_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td>
                      <span className={`badge ${TXN_BADGE[e.txn_type] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                        {(e.txn_type || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{e.ref_number || e.ref_id || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 240 }}>{e.description || e.notes || '—'}</td>
                    <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--error)' }}>
                      {e.debit_amount ? FMT(e.debit_amount) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                      {e.credit_amount ? FMT(e.credit_amount) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {e.balance != null ? FMT(e.balance) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </p>
              <div className="flex gap-1">
                <button className="btn-icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 30, height: 30, borderRadius: 6, fontSize: 12, fontWeight: 600,
                      border: '1px solid', cursor: 'pointer',
                      background: page === p ? 'var(--accent-muted)' : 'transparent',
                      color: page === p ? 'var(--accent)' : 'var(--text-muted)',
                      borderColor: page === p ? 'var(--accent-border)' : 'var(--border-default)',
                    }}
                  >{p}</button>
                ))}
                <button className="btn-icon" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
