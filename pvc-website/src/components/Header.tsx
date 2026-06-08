'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { site } from '@/config/site';
import { Menu, X, Phone, Package, User, LogOut } from 'lucide-react';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/portal/me').then(r => r.json()).then(d => setCustomer(d.customer)).catch(() => {});
  }, []);

  const logout = async () => {
    await fetch('/api/portal/logout', { method: 'POST' });
    setCustomer(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #eef1f5' }}>
      <div className="container-x" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--brand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={20} color="#fff" />
          </span>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{site.name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 26 }}>
          {site.nav.map(n => (
            <Link key={n.href} href={n.href} style={{ fontSize: 14.5, fontWeight: 600, color: '#374151', textDecoration: 'none' }}
              className="hover:text-brand-700">{n.label}</Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
          {customer ? (
            <>
              <Link href="/account" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--brand-700)', textDecoration: 'none' }}>
                <User size={15} /> My Account
              </Link>
              <button onClick={logout} title="Sign out" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, fontWeight: 600 }}>
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <Link href="/account/login" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--brand-700)', textDecoration: 'none' }}>
              <User size={15} /> Login
            </Link>
          )}
          <Link href={customer ? '/account/shop' : '/quote'} className="btn btn-primary" style={{ padding: '9px 18px' }}>
            {customer ? 'Order Now' : 'Get a Quote'}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(v => !v)} aria-label="Menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden" style={{ borderTop: '1px solid #eef1f5', background: '#fff', padding: '12px 20px 20px' }}>
          {site.nav.map(n => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '10px 0', fontSize: 16, fontWeight: 600, color: '#374151', textDecoration: 'none', borderBottom: '1px solid #f3f4f6' }}>{n.label}</Link>
          ))}
          {customer ? (
            <>
              <Link href="/account" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', fontSize: 16, fontWeight: 700, color: 'var(--brand-700)', textDecoration: 'none', borderBottom: '1px solid #f3f4f6' }}><User size={16} /> My Account</Link>
              <button onClick={() => { setOpen(false); logout(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', fontSize: 16, fontWeight: 600, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}><LogOut size={16} /> Sign out</button>
              <Link href="/account/shop" onClick={() => setOpen(false)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>Order Now</Link>
            </>
          ) : (
            <>
              <Link href="/account/login" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', fontSize: 16, fontWeight: 700, color: 'var(--brand-700)', textDecoration: 'none', borderBottom: '1px solid #f3f4f6' }}><User size={16} /> Login / Register</Link>
              <Link href="/quote" onClick={() => setOpen(false)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>Get a Quote</Link>
            </>
          )}
          <a href={`tel:${site.phoneHref}`} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}><Phone size={15} /> {site.phone}</a>
        </div>
      )}
    </header>
  );
}
