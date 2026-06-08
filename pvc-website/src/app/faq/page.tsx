import type { Metadata } from 'next';
import { site } from '@/config/site';
import { PageHero, CtaBand } from '@/components/ui';

export const metadata: Metadata = {
  title: `FAQs | ${site.name}`,
  description: `Answers to the most common questions about ordering PVC sheets, ACP panels, pipes and building materials from ${site.name} — MOQ, delivery, pricing, GST, returns and more.`,
};

const faqs = [
  {
    q: 'What is the minimum order quantity (MOQ)?',
    a: 'Our MOQ varies by product category. For PVC sheets and ACP panels it is typically 10 sheets, for pipes it is one bundle (approximately 6 metres each), and for profiles it is 50 metres. Contact us and we will confirm the MOQ for your specific product — smaller trial orders may be possible for first-time trade buyers.',
  },
  {
    q: 'Which areas do you deliver to, and how long does delivery take?',
    a: 'We deliver across Gujarat and neighbouring states, with regular runs to Ahmedabad, Surat, Vadodara, Rajkot and beyond. Local deliveries within the city are typically 1–2 business days. Outstation orders generally ship within 2–5 business days depending on volume and destination. We will confirm lead time when we send your quote.',
  },
  {
    q: 'Do you offer wholesale or trade pricing?',
    a: 'Yes — we are a B2B wholesale distributor. Trade pricing is available to registered businesses, contractors, fabricators and retailers. Simply request a quote with your business details and we will set up a trade account with volume-based pricing tiers.',
  },
  {
    q: 'What are your payment terms and do you offer credit?',
    a: 'Standard terms are advance payment for first orders. Established trade accounts with a good order history may qualify for credit terms (typically net 15 or net 30 days). Credit limits are assessed on a case-by-case basis. We accept NEFT, RTGS, UPI and cheque.',
  },
  {
    q: 'Will I receive a GST-compliant tax invoice?',
    a: 'Absolutely. Every order comes with a proper GST tax invoice showing our GSTIN, HSN codes, tax breakdowns and your business details. Invoices are sent by email and a hard copy is included with the delivery.',
  },
  {
    q: 'Can I request product samples before placing a bulk order?',
    a: 'Yes, we can supply small sample pieces for most PVC and ACP products so you can verify colour, finish and thickness before committing to a bulk order. Samples may attract a nominal handling fee. Contact us to arrange.',
  },
  {
    q: 'What are the lead times for large or custom bulk orders?',
    a: 'Standard in-stock items are typically ready within 1–3 business days. For very large volumes or custom specifications, lead times range from 5–15 business days depending on stock levels and manufacturer schedules. We will give you a confirmed lead time in your quote.',
  },
  {
    q: 'Do you offer custom cutting or sizes?',
    a: 'Yes, we offer cut-to-size services for PVC sheets and ACP panels. Cutting charges apply and minimum quantities may differ from standard stock items. Please specify your exact dimensions when requesting a quote and we will advise on feasibility and pricing.',
  },
  {
    q: 'What is your return or replacement policy?',
    a: 'We stand behind the quality of our products. If an item arrives damaged or does not match its specification, notify us within 48 hours of delivery with photos and we will arrange a replacement or credit at no charge. Returns for change-of-mind on cut or custom items are generally not accepted. Please inspect goods on delivery.',
  },
  {
    q: 'How do I place an order?',
    a: 'The easiest way is to request a quote through our website, call us directly, or send us a WhatsApp message with your product list and quantities. Once we send pricing and you confirm, we raise an invoice, you make payment, and we schedule dispatch. Repeat orders can be placed by phone, email or WhatsApp.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow="Help"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about ordering from us — MOQ, delivery, pricing, GST and more."
      />

      <section className="section">
        <div className="container-x" style={{ maxWidth: 800 }}>
          <div style={{ display: 'grid', gap: 14 }}>
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="card"
                style={{ padding: 0, overflow: 'hidden' }}
              >
                <summary style={{
                  listStyle: 'none',
                  padding: '20px 24px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 16,
                  color: 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  userSelect: 'none',
                }}>
                  <span>{faq.q}</span>
                  {/* chevron via CSS pseudo via inline style trick */}
                  <span aria-hidden="true" style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--brand-50)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: 'var(--brand-700)', fontSize: 18, fontWeight: 400,
                    lineHeight: 1,
                  }}>+</span>
                </summary>
                <div style={{
                  padding: '0 24px 20px',
                  borderTop: '1px solid #f0f4f8',
                  fontSize: 15,
                  color: 'var(--muted)',
                  lineHeight: 1.75,
                }}>
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 16 }}>
              Still have a question?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={`tel:${site.phoneHref}`} className="btn btn-primary">Call us now</a>
              <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline">WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
