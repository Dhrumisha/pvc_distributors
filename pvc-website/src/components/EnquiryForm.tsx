'use client';
import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

export default function EnquiryForm({ type = 'contact', compact = false }: { type?: 'contact' | 'quote'; compact?: boolean }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', product_interest: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || (!form.email.trim() && !form.phone.trim())) {
      setStatus('error'); setMsg('Please enter your name and a phone or email.'); return;
    }
    setStatus('sending'); setMsg('');
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('done'); setMsg(data.message || 'Thank you! We will get back to you soon.');
        setForm({ name: '', email: '', phone: '', company: '', product_interest: '', message: '' });
      } else { setStatus('error'); setMsg(data.message || 'Could not submit. Please try again.'); }
    } catch { setStatus('error'); setMsg('Network error. Please try again or call us.'); }
  };

  const input: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1px solid #d8dee6', borderRadius: 10, fontSize: 15, fontFamily: 'inherit', outline: 'none', background: '#fff' };
  const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };

  if (status === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '32px 20px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--brand-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <CheckCircle size={28} color="var(--brand-700)" />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>Enquiry sent!</h3>
        <p className="lead" style={{ fontSize: 15 }}>{msg}</p>
        <button onClick={() => setStatus('idle')} className="btn btn-outline" style={{ marginTop: 14 }}>Send another</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <div><label style={label}>Full Name *</label><input style={input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" /></div>
        <div><label style={label}>Company</label><input style={input} value={form.company} onChange={e => set('company', e.target.value)} placeholder="Business name (optional)" /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <div><label style={label}>Phone *</label><input style={input} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 …" /></div>
        <div><label style={label}>Email</label><input type="email" style={input} value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" /></div>
      </div>
      <div><label style={label}>Product of interest</label><input style={input} value={form.product_interest} onChange={e => set('product_interest', e.target.value)} placeholder="e.g. ACP Sheets, PVC pipes, profiles…" /></div>
      <div><label style={label}>{type === 'quote' ? 'Requirement details (quantity, sizes, delivery location)' : 'Message'}</label>
        <textarea style={{ ...input, minHeight: 110, resize: 'vertical' }} value={form.message} onChange={e => set('message', e.target.value)} placeholder={type === 'quote' ? 'Tell us what you need and we will send pricing…' : 'How can we help?'} /></div>
      {status === 'error' && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: 10, fontSize: 14 }}>⚠ {msg}</div>}
      <button type="submit" className="btn btn-primary" disabled={status === 'sending'} style={{ justifyContent: 'center', padding: '13px 22px', fontSize: 15 }}>
        {status === 'sending' ? 'Sending…' : <>{type === 'quote' ? 'Request Quote' : 'Send Enquiry'} <Send size={16} /></>}
      </button>
      <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', margin: 0 }}>We typically respond within one business day.</p>
    </form>
  );
}
