import type { Metadata } from 'next';
import { site } from '@/config/site';
import { PageHero, CtaBand } from '@/components/ui';
import {
  Package,
  Layers,
  Warehouse,
  Truck,
  Box,
  Grid3x3,
  Hammer,
  Building2,
  CircleDot,
  Shapes,
  HardHat,
  PackageCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: `Gallery — Products & Projects | ${site.name}`,
  description: `Browse ${site.name}'s product range and operations gallery — PVC sheets, ACP panels, foam boards, pipes, profiles, warehouse operations and on-site project deliveries in ${site.city}.`,
};

type Tile = {
  icon: React.ElementType;
  label: string;
  sub?: string;
  gradient: string;
  span?: 'wide' | 'tall';
};

const productTiles: Tile[] = [
  {
    icon: Layers,
    label: 'ACP Sheets',
    sub: 'Aluminium Composite Panels',
    gradient: 'linear-gradient(135deg, var(--brand-800) 0%, var(--brand-600) 100%)',
    span: 'wide',
  },
  {
    icon: Package,
    label: 'PVC Foam Boards',
    sub: 'Lightweight & rigid',
    gradient: 'linear-gradient(150deg, #166534 0%, #15803d 60%, #22c55e 130%)',
  },
  {
    icon: CircleDot,
    label: 'PVC Pipes',
    sub: 'CPVC · UPVC · SWR',
    gradient: 'linear-gradient(135deg, #1e4d2b 0%, var(--brand-700) 100%)',
  },
  {
    icon: Grid3x3,
    label: 'PVC Profiles',
    sub: 'T, L, U & channel sections',
    gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',
  },
  {
    icon: Box,
    label: 'Solid PVC Sheets',
    sub: 'High-density, colour range',
    gradient: 'linear-gradient(150deg, var(--brand-700) 0%, #4ade80 140%)',
  },
  {
    icon: Shapes,
    label: 'Specialty Laminates',
    sub: 'Textured & woodgrain finish',
    gradient: 'linear-gradient(135deg, #166534 0%, #15803d 50%, var(--brand-accent) 120%)',
  },
];

const operationsTiles: Tile[] = [
  {
    icon: Warehouse,
    label: 'Our Warehouse',
    sub: `${site.city.split(',')[0]} distribution hub`,
    gradient: 'linear-gradient(135deg, #0f4c2a 0%, var(--brand-700) 100%)',
    span: 'tall',
  },
  {
    icon: PackageCheck,
    label: 'Stock & Packing',
    sub: 'Batch-ready for dispatch',
    gradient: 'linear-gradient(150deg, #166534 0%, #4ade80 140%)',
  },
  {
    icon: Truck,
    label: 'On-site Delivery',
    sub: 'Own fleet, on time',
    gradient: 'linear-gradient(135deg, var(--brand-800) 0%, #22c55e 120%)',
  },
];

const projectTiles: Tile[] = [
  {
    icon: Building2,
    label: 'Commercial Facade',
    sub: 'ACP cladding project',
    gradient: 'linear-gradient(150deg, #166534 0%, var(--brand-600) 100%)',
    span: 'wide',
  },
  {
    icon: Hammer,
    label: 'Site Fabrication',
    sub: 'Contractor installation',
    gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 80%, #4ade80 130%)',
  },
  {
    icon: HardHat,
    label: 'Infrastructure Works',
    sub: 'CPVC piping installation',
    gradient: 'linear-gradient(135deg, var(--brand-800) 0%, var(--brand-accent) 120%)',
  },
];

function GalleryTile({ tile }: { tile: Tile }) {
  return (
    <div
      style={{
        background: tile.gradient,
        borderRadius: 16,
        aspectRatio: tile.span === 'wide' ? '2/1' : tile.span === 'tall' ? '1/1.4' : '1/1',
        gridColumn: tile.span === 'wide' ? 'span 2' : undefined,
        gridRow: tile.span === 'tall' ? 'span 2' : undefined,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: '#fff',
        padding: 24,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'transform .2s, box-shadow .2s',
      }}
      className="gallery-tile"
    >
      {/* Decorative background circles */}
      <div style={{
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: 'rgba(255,255,255,.06)',
        bottom: -40,
        right: -40,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(255,255,255,.04)',
        top: -20,
        left: -20,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: 'rgba(255,255,255,.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        position: 'relative',
        zIndex: 1,
      }}>
        <tile.icon size={28} color="#fff" strokeWidth={1.6} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.01em', lineHeight: 1.2 }}>{tile.label}</div>
        {tile.sub && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 5 }}>{tile.sub}</div>
        )}
      </div>
    </div>
  );
}

function GroupHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="h-section" style={{ marginTop: 6, fontSize: 'clamp(20px,2.8vw,28px)' }}>{title}</h2>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="Products & Projects"
        subtitle={`A visual overview of our product range, warehouse operations and project deliveries — giving you a sense of what ${site.name} supplies and how we work.`}
      />

      {/* Product Range */}
      <section className="section">
        <div className="container-x">
          <GroupHeading eyebrow="What we stock" title="Product Range" />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {productTiles.map(tile => (
              <GalleryTile key={tile.label} tile={tile} />
            ))}
          </div>
        </div>
      </section>

      {/* Operations */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <GroupHeading eyebrow="Behind the scenes" title="Operations" />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {operationsTiles.map(tile => (
              <GalleryTile key={tile.label} tile={tile} />
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <GroupHeading eyebrow="In the field" title="Projects" />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {projectTiles.map(tile => (
              <GalleryTile key={tile.label} tile={tile} />
            ))}
          </div>
        </div>
      </section>

      {/* Notice */}
      <section style={{ paddingBottom: 32 }}>
        <div className="container-x">
          <div style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <PackageCheck size={24} color="var(--brand-700)" style={{ flexShrink: 0 }} />
            <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              <b style={{ color: 'var(--ink)' }}>Want to see actual product samples?</b> Visit our showroom in {site.city} during {site.hours}, or request a sample pack by calling us on{' '}
              <a href={`tel:${site.phoneHref}`} style={{ color: 'var(--brand-700)', fontWeight: 700 }}>{site.phone}</a>.
            </p>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
