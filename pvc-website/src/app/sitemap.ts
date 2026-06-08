import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { getProducts } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ['', '/products', '/services', '/gallery', '/about', '/blog', '/faq', '/contact', '/quote'];
  const base: MetadataRoute.Sitemap = staticPaths.map(p => ({
    url: `${site.url}${p}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: p === '' ? 1 : 0.7,
  }));

  // Include product detail pages for SEO
  try {
    const { products } = await getProducts({ limit: 100 });
    for (const p of products) {
      base.push({ url: `${site.url}/products/${p.id}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 });
    }
  } catch { /* ignore if backend unavailable at build */ }

  return base;
}
