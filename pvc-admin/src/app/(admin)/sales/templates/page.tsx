'use client';
// src/app/(admin)/sales/templates/page.tsx
import { useEffect, useState, useCallback } from 'react';
import { salesOrderService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { LayoutTemplate } from 'lucide-react';

const FMT = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function OrderTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesOrderService.getTemplates();
      setTemplates(res.data.data?.templates || res.data.data || []);
    } catch (e) { toast.error(getApiError(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="page-title">Order Templates</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
          {templates.length} saved order {templates.length === 1 ? 'template' : 'templates'}
        </p>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Template Name</th>
                <th>Customer</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10"><div className="spinner mx-auto" /></td></tr>
              ) : templates.length === 0 ? (
                <tr><td colSpan={4}>
                  <div className="empty-state py-12">
                    <LayoutTemplate size={32} className="empty-state-icon" />
                    <p className="empty-state-title">No order templates</p>
                    <p className="empty-state-desc">
                      Save a sales order as a template from the Sales Orders page to reuse it quickly.
                    </p>
                  </div>
                </td></tr>
              ) : templates.map((t: any, idx: number) => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12, width: 48 }}>{idx + 1}</td>
                  <td>
                    <div className="td-primary">{t.template_name || '—'}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {t.customer?.business_name || '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }}>
                    {t.total_amount != null ? FMT(t.total_amount) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
