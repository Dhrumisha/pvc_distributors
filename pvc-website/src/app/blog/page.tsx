import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, Calendar } from 'lucide-react';
import { site } from '@/config/site';
import { PageHero } from '@/components/ui';
import { posts } from '@/content/posts';

export const metadata: Metadata = {
  title: `Blog | ${site.name}`,
  description: `Guides, tips and industry insights on PVC sheets, ACP panels, pipes and building materials from the team at ${site.name}.`,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Insights &amp; guides"
        title="Blog"
        subtitle="Practical tips, material guides and industry insights to help builders, contractors and fabricators make better decisions."
      />

      <section className="section">
        <div className="container-x">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {posts.map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', overflow: 'hidden' }}
              >
                {/* top accent bar */}
                <div style={{ height: 5, background: 'linear-gradient(90deg, var(--brand-800), var(--brand-600))' }} />

                <div style={{ padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  {/* meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                      <Calendar size={13} /> {formatDate(post.date)}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                      <Clock size={13} /> {post.readMins} min read
                    </span>
                  </div>

                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 10px', lineHeight: 1.35, letterSpacing: '-.01em' }}>
                    {post.title}
                  </h2>
                  <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 20px', flexGrow: 1 }}>
                    {post.excerpt}
                  </p>

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--brand-700)' }}>
                    Read more <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
