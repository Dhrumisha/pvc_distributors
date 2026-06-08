import type { Metadata } from 'next';
import Link from 'next/link';
import { getPortalProducts } from '@/lib/portal';
import { PageHero } from '@/components/ui';
import ShopClient from '@/components/ShopClient';
import { ArrowLeft, Tag, CreditCard, ShoppingBag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shop | Customer Portal',
  description: 'Browse your exclusive discounted catalog and place orders directly.',
};

export default async function ShopPage() {
  const r = await getPortalProducts();
  const products = r?.data?.products ?? [];
  const discountPercent: number = Number(r?.data?.discount_percent ?? 0);

  return (
    <>
      <PageHero
        eyebrow="Customer Portal"
        title="Your Catalog"
        subtitle={
          discountPercent > 0
            ? `You have a ${discountPercent}% exclusive discount applied to all products.`
            : 'Browse and order from your personalised product catalog.'
        }
      />

      <div className="container-x" style={{ paddingBlock: 48 }}>
        <Link
          href="/account"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--brand-700)', fontWeight: 600, fontSize: 14,
            textDecoration: 'none', marginBottom: 28,
          }}
        >
          <ArrowLeft size={16} /> Back to Account
        </Link>

        {/* Info banner */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          {discountPercent > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'var(--brand-50)', border: '1px solid var(--brand-100)',
              borderRadius: 12, padding: '12px 18px',
            }}>
              <Tag size={18} color="var(--brand-700)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                  Your pricing — {discountPercent}% off
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Net prices already reflect your exclusive discount.
                </div>
              </div>
            </div>
          )}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#fefce8', border: '1px solid #fef08a',
            borderRadius: 12, padding: '12px 18px',
          }}>
            <CreditCard size={18} color="#854d0e" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#713f12' }}>
                Credit / Udhaar available
              </div>
              <div style={{ fontSize: 13, color: '#92400e' }}>
                Choose "Credit / Udhaar" at checkout if your account supports it.
              </div>
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="card" style={{ padding: '56px 32px', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
            <ShoppingBag size={48} color="var(--brand-600)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
              No products available
            </h2>
            <p className="lead" style={{ marginBottom: 24 }}>
              Your catalog is being set up. Please contact us to enquire about products.
            </p>
            <Link href="/contact" className="btn btn-outline">Contact Us</Link>
          </div>
        ) : (
          <ShopClient products={products} />
        )}
      </div>
    </>
  );
}
