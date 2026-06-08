import type { Metadata } from 'next';
import { CheckCircle2, DollarSign, Truck, Clock, Headphones, FileText, Search, MessageSquare, Package } from 'lucide-react';
import { site } from '@/config/site';
import { PageHero } from '@/components/ui';
import EnquiryForm from '@/components/EnquiryForm';

export const metadata: Metadata = {
  title: `Get a Quote | ${site.name}`,
  description: `Request wholesale pricing for PVC sheets, ACP panels, pipes and building materials. Fast quotes within one business day. Bulk discounts available — ${site.name}.`,
};

const benefits = [
  { icon: DollarSign, title: 'Wholesale Rates', desc: 'Access trade pricing not available to the general public — tiered by volume.' },
  { icon: Package, title: 'Bulk Discounts', desc: 'The more you order, the better the rate. Significant savings on large volumes.' },
  { icon: Clock, title: 'Fast Turnaround', desc: 'Receive your quote within one business day, often the same afternoon.' },
  { icon: Headphones, title: 'Dedicated Support', desc: 'A real team member helps you spec the right product and quantity every time.' },
];

const steps = [
  { icon: FileText, step: '01', title: 'Submit your requirement', desc: 'Tell us what product, quantity and delivery location you need.' },
  { icon: Search, step: '02', title: 'We review &amp; price', desc: 'Our team checks stock and prepares competitive pricing for your job.' },
  { icon: MessageSquare, step: '03', title: 'Receive your quote', desc: 'You get a detailed quote by email or WhatsApp — no obligation.' },
  { icon: Truck, step: '04', title: 'Order &amp; deliver', desc: 'Confirm the order and we handle packing, dispatch and on-time delivery.' },
];

export default function QuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Request pricing"
        title="Get a Quote"
        subtitle="Tell us what you need and we'll send competitive wholesale pricing within one business day."
      />

      <section className="section">
        <div className="container-x">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 56, alignItems: 'start' }}>

            {/* LEFT — benefits + process */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Why request a quote</div>
              <h2 className="h-section" style={{ fontSize: 'clamp(22px,3vw,30px)', marginBottom: 24 }}>Wholesale pricing tailored to your project</h2>

              <div style={{ display: 'grid', gap: 16, marginBottom: 44 }}>
                {benefits.map(b => (
                  <div key={b.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <span style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--brand-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <b.icon size={20} color="var(--brand-700)" />
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>{b.title}</div>
                      <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 4-step process */}
              <div style={{ borderTop: '1px solid #e8ecf1', paddingTop: 32 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 20 }}>How it works</div>
                <div style={{ display: 'grid', gap: 20 }}>
                  {steps.map((s, i) => (
                    <div key={s.step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      {/* connector line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <s.icon size={18} color="#fff" />
                        </span>
                        {i < steps.length - 1 && (
                          <div style={{ width: 2, flexGrow: 1, background: 'var(--brand-100)', marginTop: 6, minHeight: 20 }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: i < steps.length - 1 ? 20 : 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-700)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 2 }}>Step {s.step}</div>
                        <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }} dangerouslySetInnerHTML={{ __html: s.title }} />
                        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* trust note */}
              <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', background: 'var(--brand-50)', borderRadius: 12, border: '1px solid var(--brand-100)' }}>
                <CheckCircle2 size={18} color="var(--brand-700)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: 'var(--brand-800)', fontWeight: 600 }}>No obligation. Free quote. No spam — ever.</span>
              </div>
            </div>

            {/* RIGHT — form card */}
            <div className="card" style={{ padding: 32 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Fill in your details</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>Request a Quote</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 22px', lineHeight: 1.6 }}>
                Include product name, quantity and delivery location for the fastest response.
              </p>
              <EnquiryForm type="quote" />
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
