'use client';
// src/app/(admin)/suppliers/invoices/new/page.tsx — Record a Supplier Invoice
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supplierService, purchaseInvoiceService } from '@/lib/services';
import { getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, FileText } from 'lucide-react';

const TODAY = () => new Date().toISOString().split('T')[0];

export default function NewSupplierInvoicePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  const [form, setForm] = useState({
    supplier_id:          '',
    supplier_invoice_no:  '',
    invoice_date:         TODAY(),
    due_date:             '',
    total_amount:         '',
    purchase_order_id:    '',
    notes:                '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await supplierService.list({ limit: 200 });
        setSuppliers(res.data.data?.suppliers || res.data.data || []);
      } catch (e) { toast.error(getApiError(e)); }
      finally { setLoading(false); }
    })();
  }, []);

  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.supplier_id)         { toast.error('Select a supplier.');               return; }
    if (!form.supplier_invoice_no) { toast.error('Supplier invoice number is required.'); return; }
    if (!form.invoice_date)        { toast.error('Invoice date is required.');        return; }
    if (!form.total_amount || Number(form.total_amount) <= 0) {
      toast.error('Total amount must be greater than 0.');
      return;
    }
    setSaving(true);
    try {
      await purchaseInvoiceService.create({
        supplier_id:         Number(form.supplier_id),
        supplier_invoice_no: form.supplier_invoice_no,
        invoice_date:        form.invoice_date,
        due_date:            form.due_date || null,
        total_amount:        Number(form.total_amount),
        purchase_order_id:   form.purchase_order_id ? Number(form.purchase_order_id) : null,
        ...(form.notes ? { notes: form.notes } : {}),
      });
      toast.success('Supplier invoice recorded.');
      router.push('/suppliers/invoices');
    } catch (e) { toast.error(getApiError(e)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="space-y-5 animate-slide-up" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/suppliers/invoices" className="btn-icon"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText size={18} style={{ color: 'var(--accent)' }} /> Record Supplier Invoice
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            Log a supplier invoice against a purchase.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="card p-5 space-y-4">
        <h2 className="section-title">Invoice Details</h2>
        <div className="grid md:grid-cols-2 gap-4">

          {/* Supplier */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Supplier *</label>
            <select className="input" value={form.supplier_id} onChange={setF('supplier_id')}>
              <option value="">Select a supplier…</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name || s.supplier_name || `Supplier #${s.id}`}</option>
              ))}
            </select>
          </div>

          {/* Supplier Invoice No */}
          <div className="form-group">
            <label className="form-label">Supplier Invoice No. *</label>
            <input
              className="input"
              placeholder="e.g. INV-2024-001"
              value={form.supplier_invoice_no}
              onChange={setF('supplier_invoice_no')}
            />
          </div>

          {/* Total Amount */}
          <div className="form-group">
            <label className="form-label">Total Amount (₹) *</label>
            <input
              type="number"
              min="0"
              step="any"
              className="input"
              placeholder="0"
              value={form.total_amount}
              onChange={setF('total_amount')}
            />
            {form.total_amount && Number(form.total_amount) > 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                ₹{Number(form.total_amount).toLocaleString('en-IN')}
              </p>
            )}
          </div>

          {/* Invoice Date */}
          <div className="form-group">
            <label className="form-label">Invoice Date *</label>
            <input type="date" className="input" value={form.invoice_date} onChange={setF('invoice_date')} />
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label className="form-label">Due Date <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input type="date" className="input" value={form.due_date} onChange={setF('due_date')} />
          </div>

          {/* Linked PO */}
          <div className="form-group">
            <label className="form-label">
              Linked Purchase Order ID{' '}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="number"
              min="1"
              className="input"
              placeholder="Leave blank if not linking"
              value={form.purchase_order_id}
              onChange={setF('purchase_order_id')}
            />
          </div>

          {/* Notes */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input
              className="input"
              placeholder="Any additional notes…"
              value={form.notes}
              onChange={setF('notes')}
            />
          </div>
        </div>

        {/* Amount preview */}
        {form.total_amount && Number(form.total_amount) > 0 && (
          <div className="flex justify-end">
            <div style={{ fontSize: 13, padding: '10px 16px', background: 'var(--accent-muted)', borderRadius: 8, border: '1px solid var(--accent-border)' }}>
              Invoice Total:{' '}
              <strong style={{ fontSize: 15, color: 'var(--accent)' }}>
                ₹{Number(form.total_amount).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/suppliers/invoices" className="btn-secondary">Cancel</Link>
        <button className="btn-primary" onClick={submit} disabled={saving}>
          {saving
            ? <span className="flex items-center gap-2"><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</span>
            : <><FileText size={14} /> Record Invoice</>}
        </button>
      </div>
    </div>
  );
}
