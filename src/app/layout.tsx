import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/lib/customer/cartContext';

export const metadata: Metadata = {
  title: 'Wrap Nation — Fresh Fast Food & QR Ordering',
  description: 'Production QR-based ordering and live billing system for Wrap Nation. Fresh wraps, burgers & crispy chicken.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#FFCC00',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
