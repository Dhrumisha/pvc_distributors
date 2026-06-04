// src/app/layout.tsx
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'PVC Admin', template: '%s | PVC Admin' },
  description: 'PVC Distributor Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background:  'var(--bg-elevated)',
                color:       'var(--text-primary)',
                border:      '1px solid var(--border-default)',
                borderRadius:'var(--radius)',
                fontFamily:  'var(--font-body)',
                fontSize:    '14px',
              },
              success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--bg-page)' } },
              error:   { iconTheme: { primary: 'var(--error)',   secondary: 'var(--bg-page)' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
