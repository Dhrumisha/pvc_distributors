import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { site } from '@/config/site';
import { CtaBand } from '@/components/ui';
import { posts, getPost } from '@/content/posts';

interface Props {
  params: { slug: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost(params.slug);
  if (!post) {
    return { title: `Post not found | ${site.name}` };
  }
  return {
    title: `${post.title} | ${site.name} Blog`,
    description: post.excerpt,
  };
}

export function generateStaticParams() {
  return posts.map(p => ({ slug: p.slug }));
}

export default function BlogPostPage({ params }: Props) {
  const post = getPost(params.slug);

  if (!post) {
    return (
      <section className="section">
        <div className="container-x" style={{ maxWidth: 720, textAlign: 'center' }}>
          <h1 className="h-section" style={{ marginBottom: 12 }}>Article not found</h1>
          <p className="lead" style={{ marginBottom: 28 }}>
            Sorry, we could not find that article. It may have been moved or removed.
          </p>
          <Link href="/blog" className="btn btn-primary">Back to Blog</Link>
        </div>
      </section>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: site.name,
      url: site.url,
    },
    publisher: {
      '@type': 'Organization',
      name: site.name,
      url: site.url,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${site.url}/blog/${post.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, var(--brand-800), var(--brand-600))', color: '#fff' }}>
        <div className="container-x" style={{ paddingBlock: 64, maxWidth: 800 }}>
          {/* back link */}
          <Link
            href="/blog"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.8)', fontSize: 14, fontWeight: 600, textDecoration: 'none', marginBottom: 22 }}
          >
            <ArrowLeft size={15} /> All articles
          </Link>

          {/* meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,.75)', fontWeight: 500 }}>
              <Calendar size={13} /> {formatDate(post.date)}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,.75)', fontWeight: 500 }}>
              <Clock size={13} /> {post.readMins} min read
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(26px,4.5vw,42px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-.02em', margin: 0 }}>
            {post.title}
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.88)', lineHeight: 1.7, margin: '16px 0 0', maxWidth: 680 }}>
            {post.excerpt}
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="section">
        <div className="container-x" style={{ maxWidth: 760 }}>
          <article>
            {post.body.map((para, i) => (
              <p
                key={i}
                style={{
                  fontSize: 16.5,
                  lineHeight: 1.85,
                  color: i === 0 ? 'var(--ink)' : 'var(--muted)',
                  fontWeight: i === 0 ? 500 : 400,
                  marginBottom: 22,
                  marginTop: 0,
                }}
              >
                {para}
              </p>
            ))}
          </article>

          {/* divider + back link */}
          <div style={{ borderTop: '1px solid #e8ecf1', marginTop: 40, paddingTop: 28 }}>
            <Link href="/blog" className="btn btn-outline">
              <ArrowLeft size={16} /> Back to Blog
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
