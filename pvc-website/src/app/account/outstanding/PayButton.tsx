'use client';
import { useState } from 'react';
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  invoiceId: string;
  amount: number;
}

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function PayButton({ invoiceId, amount }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handlePay() {
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/portal/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId, amount }),
      });
      const json = await res.json();
      if (res.ok && (json.success || json.ok)) {
        setStatus('success');
        setMessage(json.message || 'Payment recorded successfully.');
      } else {
        setStatus('error');
        setMessage(json.message || 'Payment request failed. Please contact us.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#15803d', fontWeight: 700, fontSize: 13 }}>
        <CheckCircle2 size={15} /> {message}
      </span>
    );
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={status === 'loading'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--brand)', color: '#fff',
          border: '1px solid var(--brand)', borderRadius: 8,
          padding: '6px 14px', fontSize: 13, fontWeight: 700,
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          opacity: status === 'loading' ? 0.7 : 1,
          whiteSpace: 'nowrap', transition: 'all .15s',
        }}
      >
        {status === 'loading'
          ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
          : <><CreditCard size={14} /> Pay Now ({fmt(amount)})</>
        }
      </button>
      {status === 'error' && message && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, color: '#dc2626', fontSize: 12, fontWeight: 600 }}>
          <AlertCircle size={13} /> {message}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
