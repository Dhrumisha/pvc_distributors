import Link from 'next/link';
import { site } from '@/config/site';
import { Package, Phone, Mail, MapPin, Clock } from 'lucide-react';

export default function Footer() {
  const year = 2026;
  return (
    <footer style={{ background: '#0b1220', color: '#cbd5e1', marginTop: 40 }}>
      <div className="container-x" style={{ paddingBlock: 56 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 36 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--brand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={18} color="#fff" />
              </span>
              <span style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>{site.name}</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#94a3b8', maxWidth: 320 }}>{site.tagline}. {site.description.slice(0, 90)}…</p>
          </div>

          {/* Quick links */}
          <div>
            <h4 style={{ color: '#fff', fontSize: 14, marginBottom: 14, letterSpacing: '.04em' }}>QUICK LINKS</h4>
            {site.nav.map(n => (
              <Link key={n.href} href={n.href} style={{ display: 'block', padding: '6px 0', fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>{n.label}</Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#fff', fontSize: 14, marginBottom: 14, letterSpacing: '.04em' }}>CONTACT</h4>
            <a href={`tel:${site.phoneHref}`} style={{ display: 'flex', gap: 9, padding: '6px 0', fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}><Phone size={15} /> {site.phone}</a>
            <a href={`mailto:${site.email}`} style={{ display: 'flex', gap: 9, padding: '6px 0', fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}><Mail size={15} /> {site.email}</a>
            <div style={{ display: 'flex', gap: 9, padding: '6px 0', fontSize: 14, color: '#94a3b8' }}><MapPin size={15} /> {site.address}, {site.city}</div>
            <div style={{ display: 'flex', gap: 9, padding: '6px 0', fontSize: 14, color: '#94a3b8' }}><Clock size={15} /> {site.hours}</div>
          </div>

          {/* CTA */}
          <div>
            <h4 style={{ color: '#fff', fontSize: 14, marginBottom: 14, letterSpacing: '.04em' }}>GET STARTED</h4>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 14 }}>Request a wholesale quote today.</p>
            <Link href="/quote" className="btn btn-primary" style={{ padding: '10px 18px' }}>Get a Quote</Link>
            <a href={site.adminUrl} style={{ display: 'block', marginTop: 16, fontSize: 13, color: '#64748b', textDecoration: 'none' }}>Staff Login →</a>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #1e293b' }}>
        <div className="container-x" style={{ paddingBlock: 18, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
          <span>© {year} {site.legalName}. All rights reserved.</span>
          <span>PVC Sheets · ACP Panels · Pipes · Profiles · Building Materials</span>
        </div>
      </div>
    </footer>
  );
}
