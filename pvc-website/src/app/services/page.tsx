import type { Metadata } from 'next';
import { site } from '@/config/site';
import { PageHero, CtaBand } from '@/components/ui';
import {
  Boxes,
  Truck,
  Scissors,
  CreditCard,
  Headphones,
  PackageCheck,
  ClipboardList,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: `Our Services | ${site.name}`,
  description: `${site.name} offers wholesale distribution, bulk project supply, logistics and delivery, cutting and custom sizing, trade credit terms, and dedicated account support for PVC, ACP and building materials in ${site.city}.`,
};

const services = [
  {
    icon: Boxes,
    title: 'Wholesale Distribution',
    desc: 'Access our full catalog of PVC sheets, ACP panels, pipes, profiles and building accessories at competitive wholesale prices — tiered to your volume.',
    highlights: ['Transparent tiered pricing', 'No minimum order for trade accounts', 'Real-time stock availability'],
  },
  {
    icon: PackageCheck,
    title: 'Bulk / Project Supply',
    desc: 'Planning a large development or rolling programme? We reserve stock, agree project pricing and stage deliveries to match your site schedule.',
    highlights: ['Reserved inventory for committed projects', 'Staged delivery scheduling', 'Single point of contact'],
  },
  {
    icon: Truck,
    title: 'Logistics & Delivery',
    desc: 'Our own fleet covers the region with planned routes and flexible time windows. Material arrives secured, labelled and ready to unload.',
    highlights: ['Own-fleet regional delivery', 'Flexible time-window booking', 'Proof of delivery every time'],
  },
  {
    icon: Scissors,
    title: 'Cutting & Custom Sizing',
    desc: 'Standard sheet and panel sizes do not always fit. Our in-warehouse cutting service delivers pieces to your exact dimensions — reducing on-site waste.',
    highlights: ['PVC and ACP sheet cutting', 'Exact dimension tolerances', 'Batch-ready for fabricators'],
  },
  {
    icon: CreditCard,
    title: 'Trade Credit Terms',
    desc: 'Qualified trade buyers can apply for 30-day credit terms, helping you manage cash flow across multiple projects without tying up capital.',
    highlights: ['30-day credit for approved accounts', 'Simple application process', 'Single monthly statement'],
  },
  {
    icon: Headphones,
    title: 'Dedicated Account Support',
    desc: 'Every trade account gets a named contact who knows your business — ready to help with specifications, quotes and reorders without queues or callbacks.',
    highlights: ['Named account manager', 'Same-day quote response', 'Spec and material advice'],
  },
];

const steps = [
  {
    number: '01',
    icon: MessageSquare,
    title: 'Enquire',
    desc: 'Send us your material list, project size and timeline via phone, WhatsApp, or our quote form — whatever is easiest for you.',
  },
  {
    number: '02',
    icon: ClipboardList,
    title: 'Get Quote',
    desc: 'Your account manager reviews your requirement and responds with a detailed, itemised price within one business day.',
  },
  {
    number: '03',
    icon: CheckCircle2,
    title: 'Place Order',
    desc: 'Confirm the quote and we raise a proforma or credit-account order instantly. Stock is reserved from the moment you confirm.',
  },
  {
    number: '04',
    icon: Truck,
    title: 'Fast Delivery',
    desc: 'We schedule delivery to your site or yard on your preferred date. Our driver calls ahead, arrives on time and provides a signed POD.',
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="What we do"
        title="Our Services"
        subtitle={`Everything a trade buyer needs — from wholesale pricing and bulk project supply to cutting, delivery and credit terms. ${site.name} keeps your business moving.`}
      />

      {/* SERVICES GRID */}
      <section className="section">
        <div className="container-x">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="eyebrow">Full service offering</div>
            <h2 className="h-section" style={{ marginTop: 8 }}>Six ways we support your business</h2>
            <p className="lead" style={{ maxWidth: 600, margin: '12px auto 0' }}>
              From sourcing the right material to getting it to your site cut and ready — we handle the full supply chain so you can focus on the work.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {services.map(s => (
              <div key={s.title} className="card" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--brand-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <s.icon size={26} color="var(--brand-700)" />
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', margin: '0 0 10px' }}>{s.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, margin: '0 0 18px' }}>{s.desc}</p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {s.highlights.map(h => (
                    <li key={h} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--muted)' }}>
                      <CheckCircle2 size={14} color="var(--brand-600)" style={{ flexShrink: 0 }} />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" style={{ background: '#f7f9fb' }}>
        <div className="container-x">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="eyebrow">Simple process</div>
            <h2 className="h-section" style={{ marginTop: 8 }}>How it works</h2>
            <p className="lead" style={{ maxWidth: 560, margin: '12px auto 0' }}>
              From your first enquiry to material on site — four straightforward steps.
            </p>
          </div>

          {/* Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0, position: 'relative' }}>
            {steps.map((step, idx) => (
              <div key={step.number} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 24px', position: 'relative' }}>
                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div style={{
                    display: 'none', // hidden on small screens; shown via the grid layout on wider screens
                  }} />
                )}
                {/* Number circle */}
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--brand-800), var(--brand-600))',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 800,
                  marginBottom: 20,
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: '0 8px 24px rgba(21,128,61,.3)',
                }}>
                  {step.number}
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <step.icon size={22} color="var(--brand-700)" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>{step.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
                {/* Arrow between steps */}
                {idx < steps.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: 35,
                    right: -10,
                    color: 'var(--brand-600)',
                    zIndex: 2,
                  }}>
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile-friendly step list (visible when grid stacks) */}
          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <a href={`tel:${site.phoneHref}`} className="btn btn-primary">
              Call to enquire
            </a>
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener" className="btn btn-outline">
              WhatsApp us
            </a>
          </div>
        </div>
      </section>

      {/* TRADE ACCOUNT BANNER */}
      <section className="section">
        <div className="container-x">
          <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 20, padding: '40px 36px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28, alignItems: 'center' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Trade accounts welcome</div>
              <h3 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: 'var(--ink)', margin: '0 0 10px', letterSpacing: '-.02em' }}>
                Open an account in minutes
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.7, margin: 0 }}>
                Builders, contractors and retailers can apply for a credit trade account — 30-day terms, monthly statement, and a dedicated account manager from day one.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href={`mailto:${site.email}`} className="btn btn-primary">Apply now</a>
              <a href={`tel:${site.phoneHref}`} className="btn btn-outline">Talk to us</a>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
