// src/config/site.ts
// ─────────────────────────────────────────────────────────────────────────────
// EDIT YOUR BUSINESS DETAILS HERE — everything on the site reads from this file.
// (Replace the placeholder phone/email/address with your real details.)
// ─────────────────────────────────────────────────────────────────────────────
export const site = {
  name: 'PVC Distributors',
  legalName: 'PVC Distributors',
  tagline: 'Quality PVC & Building Materials, Delivered',
  description:
    'Leading distributor of PVC sheets, ACP panels, pipes, profiles and building materials. ' +
    'Bulk supply, competitive wholesale pricing, and reliable on-time delivery for builders, ' +
    'contractors, fabricators and retailers.',
  // Contact — UPDATE THESE
  phone: '+91 00000 00000',
  phoneHref: '+910000000000',          // digits only, for tel: and WhatsApp
  whatsapp: '910000000000',            // country code + number, no +, for wa.me
  email: 'info@pvcdistributors.com',
  address: 'Your Address, Industrial Area',
  city: 'Ahmedabad, Gujarat, India',
  hours: 'Mon–Sat: 9:30 AM – 7:00 PM',
  // URLs
  url: 'https://www.pvcdistributors.com',     // your public domain (for SEO/sitemap)
  adminUrl: 'https://pvcdist-admin.vercel.app',   // staff login (admin panel)
  // Social (leave '' to hide)
  social: {
    facebook: '',
    instagram: '',
    linkedin: '',
    youtube: '',
  },
  // Top navigation
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Services', href: '/services' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
  ],
  stats: [
    { value: '15+', label: 'Years in business' },
    { value: '5,000+', label: 'Orders delivered' },
    { value: '1,200+', label: 'Happy customers' },
    { value: '500+', label: 'Products in stock' },
  ],
};

export type Site = typeof site;
