import { site } from '@/config/site';

// Organization + LocalBusiness structured data for rich SEO results.
export default function JsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: site.phoneHref,
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address,
      addressLocality: site.city,
      addressCountry: 'IN',
    },
    openingHours: site.hours,
    areaServed: 'IN',
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
