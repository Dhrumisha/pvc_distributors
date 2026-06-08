import type { Metadata } from 'next';
import { site } from '@/config/site';
import { PageHero, CtaBand } from '@/components/ui';
import {
  ShieldCheck,
  Handshake,
  Star,
  RefreshCw,
  Truck,
  Award,
  Users,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: `About Us | ${site.name}`,
  description: `Learn about ${site.name} — a trusted wholesale distributor of PVC sheets, ACP panels, pipes and building materials based in ${site.city}. Over ${site.stats[0].value} years supplying builders, contractors, fabricators and retailers with quality materials and dependable service.`,
};

const values = [
  {
    icon: ShieldCheck,
    title: 'Quality',
    desc: 'Every product we stock meets rigorous grade and specification standards. We partner only with reputed manufacturers so our customers get consistent, reliable material on every order.',
  },
  {
    icon: ShieldCheck,
    title: 'Integrity',
    desc: 'Transparent pricing, honest stock availability and straightforward terms. We say what we mean and deliver on our commitments — no hidden charges, no surprises.',
  },
  {
    icon: RefreshCw,
    title: 'Reliability',
    desc: 'Deep inventory and a dependable logistics network mean you can count on us to fulfil orders on time, every time — including during peak project seasons.',
  },
  {
    icon: Handshake,
    title: 'Partnership',
    desc: 'We invest in long-term relationships. Our dedicated account managers understand your business and proactively help you plan stock, reduce waste and manage costs.',
  },
];

const whyUs = [
  { icon: Award, text: `${site.stats[0].value} years of industry expertise` },
  { icon: Truck, text: 'Own fleet for reliable regional delivery' },
  { icon: CheckCircle2, text: 'Graded, branded stock — no compromise on quality' },
  { icon: Users, text: 'Dedicated account support for every trade buyer' },
  { icon: Star, text: 'Competitive wholesale pricing with trade credit options' },
  { icon: RefreshCw, text: 'Fast reordering and consistent supply chain' },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title={`About ${site.name}`}
        subtitle={`Your trusted partner for PVC, ACP and building materials in ${site.city} — serving the trade for over ${site.stats[0].value} years.`}
      />

      {/* COMPANY STORY */}
      <section className="section">
        <div className="container-x">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'start' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Our story</div>
              <h2 className="h-section" style={{ marginBottom: 20 }}>Built on trust, grown through service</h2>
              <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>
                {site.name} was founded with a straightforward goal: give builders, contractors, fabricators and retailers access to premium PVC, ACP and building materials at genuine wholesale prices — backed by stock that is actually available and deliveries that actually arrive on time.
              </p>
              <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>
                Over {site.stats[0].value} years we have grown from a modest storefront into one of {site.city.split(',')[0]}'s most relied-upon distribution hubs, handling {site.stats[1].label.toLowerCase()} for customers across the construction, interiors and retail sectors. Our warehousing infrastructure, supplier partnerships and logistics capability have all been built to serve one purpose — removing friction from your supply chain.
              </p>
              <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8 }}>
                Today, {site.stats[2].value} satisfied customers trust us for a catalog of {site.stats[3].value} products including PVC foam boards, ACP sheets, rigid PVC profiles, CPVC and UPVC pipes, and specialty building accessories. Whether you need a single pallet or a project-scale bulk shipment, we have the stock, the pricing and the team to make it happen.
              </p>
            </div>

            {/* Highlight card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Established', value: `${new Date().getFullYear() - parseInt(site.stats[0].value)} +` },
                { label: 'Headquarters', value: site.city },
                { label: 'Hours', value: site.hours },
                { label: 'Products stocked', value: site.stats[3].value },
              ].map(item => (
                <div key={item.label} className="card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 15 }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="section" style={{ background: '#f7f9fb' }}>
        <div className="container-x">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className="eyebrow">What drives us</div>
            <h2 className="h-section" style={{ marginTop: 8 }}>Mission &amp; Vision</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div className="card" style={{ padding: 36 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Star size={26} color="var(--brand-700)" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px' }}>Our Mission</h3>
              <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8, margin: 0 }}>
                To make high-quality PVC, ACP and building materials available to every trade buyer in the region — at wholesale prices, with reliable stock and a team that genuinely cares about helping projects succeed on time and on budget.
              </p>
            </div>
            <div className="card" style={{ padding: 36, borderTop: '3px solid var(--brand)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Award size={26} color="var(--brand-700)" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px' }}>Our Vision</h3>
              <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8, margin: 0 }}>
                To be the most trusted name in building-materials distribution across Gujarat — recognised for uncompromising quality, fair dealing and a supply chain robust enough to serve any project, at any scale, without disruption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES GRID */}
      <section className="section">
        <div className="container-x">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className="eyebrow">What we stand for</div>
            <h2 className="h-section" style={{ marginTop: 8 }}>Our Values</h2>
            <p className="lead" style={{ maxWidth: 580, margin: '12px auto 0' }}>
              Four principles guide every decision we make — from the suppliers we choose to the way we handle a complaint.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {values.map(v => (
              <div key={v.title} className="card" style={{ padding: 28 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--brand-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <v.icon size={24} color="var(--brand-700)" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>{v.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section style={{ background: 'linear-gradient(135deg, var(--brand-800), var(--brand-600))', color: '#fff' }}>
        <div className="container-x" style={{ paddingBlock: 56 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24, textAlign: 'center' }}>
            {site.stats.map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.02em' }}>{s.value}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="section" style={{ background: '#f7f9fb' }}>
        <div className="container-x">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className="eyebrow">Why choose us</div>
            <h2 className="h-section" style={{ marginTop: 8 }}>The {site.name} advantage</h2>
            <p className="lead" style={{ maxWidth: 580, margin: '12px auto 0' }}>
              Here is what sets us apart from generic building-materials suppliers.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {whyUs.map(item => (
              <div key={item.text} className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--brand-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon size={20} color="var(--brand-700)" />
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
