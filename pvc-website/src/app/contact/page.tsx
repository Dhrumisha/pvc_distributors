import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { site } from '@/config/site';
import { PageHero } from '@/components/ui';
import EnquiryForm from '@/components/EnquiryForm';

export const metadata: Metadata = {
  title: `Contact Us | ${site.name}`,
  description: `Get in touch with ${site.name}. Call, email or WhatsApp us for wholesale pricing, product enquiries and bulk orders. Located in ${site.city}.`,
};

const detail: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 20px', background: '#fff', border: '1px solid #e8ecf1', borderRadius: 14 };
const iconBox: React.CSSProperties = { width: 44, height: 44, borderRadius: 11, background: 'var(--brand-50)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Contact Us"
        subtitle={`We are here to help with pricing, product specs and bulk orders. Reach out and we will respond promptly.`}
      />

      <section className="section">
        <div className="container-x">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'start' }}>

            {/* LEFT — contact details */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Reach us directly</div>
              <h2 className="h-section" style={{ fontSize: 'clamp(22px,3vw,30px)', marginBottom: 24 }}>We&rsquo;d love to hear from you</h2>

              <div style={{ display: 'grid', gap: 14 }}>
                {/* Phone */}
                <div style={detail}>
                  <span style={iconBox}><Phone size={20} color="var(--brand-700)" /></span>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>Phone</div>
                    <a href={`tel:${site.phoneHref}`} style={{ color: 'var(--brand-700)', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>{site.phone}</a>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Available during business hours</div>
                  </div>
                </div>

                {/* Email */}
                <div style={detail}>
                  <span style={iconBox}><Mail size={20} color="var(--brand-700)" /></span>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>Email</div>
                    <a href={`mailto:${site.email}`} style={{ color: 'var(--brand-700)', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>{site.email}</a>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>We reply within one business day</div>
                  </div>
                </div>

                {/* Address */}
                <div style={detail}>
                  <span style={iconBox}><MapPin size={20} color="var(--brand-700)" /></span>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>Address</div>
                    <div style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.5 }}>{site.address}<br />{site.city}</div>
                  </div>
                </div>

                {/* Hours */}
                <div style={detail}>
                  <span style={iconBox}><Clock size={20} color="var(--brand-700)" /></span>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>Business Hours</div>
                    <div style={{ fontSize: 15, color: 'var(--muted)' }}>{site.hours}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Closed on Sundays &amp; public holidays</div>
                  </div>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 24,
                  background: '#25d366', color: '#fff', fontWeight: 700, fontSize: 15,
                  padding: '13px 22px', borderRadius: 12, textDecoration: 'none',
                  border: '1px solid #1ebe5d', transition: 'background .15s',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.18 1.6 6L0 24l6.18-1.59A11.95 11.95 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.22-3.48-8.52zm-8.52 18.4a9.9 9.9 0 0 1-5.05-1.38l-.36-.22-3.67.95.98-3.56-.23-.37A9.9 9.9 0 0 1 2.1 12c0-5.46 4.44-9.9 9.9-9.9 2.65 0 5.13 1.03 7 2.9a9.86 9.86 0 0 1 2.9 7c0 5.46-4.44 9.9-9.9 9.88zm5.44-7.4c-.3-.15-1.77-.87-2.04-.97-.28-.1-.47-.15-.68.15-.2.3-.78.97-.96 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.41-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.6.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51H7.6c-.2 0-.5.07-.76.37-.27.3-1 1-1 2.43s1.03 2.82 1.17 3.02c.15.2 2.02 3.1 4.9 4.34.69.3 1.22.47 1.64.6.69.22 1.31.19 1.81.12.55-.08 1.7-.7 1.94-1.36.24-.66.24-1.23.17-1.35-.07-.1-.27-.17-.57-.32z" />
                </svg>
                Chat on WhatsApp
              </a>

              {/* Map placeholder */}
              <div style={{ marginTop: 28, borderRadius: 16, overflow: 'hidden', border: '1px solid #e8ecf1' }}>
                <div style={{
                  height: 200,
                  background: 'linear-gradient(135deg, var(--brand-50) 0%, var(--brand-100) 100%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <MapPin size={32} color="var(--brand-700)" strokeWidth={1.5} />
                  <span style={{ fontWeight: 700, color: 'var(--brand-800)', fontSize: 15 }}>{site.city}</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{site.address}</span>
                </div>
              </div>
            </div>

            {/* RIGHT — enquiry form */}
            <div className="card" style={{ padding: 30 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>Send us a message</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 22px' }}>Fill in the form and our team will get back to you shortly.</p>
              <EnquiryForm type="contact" />
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
