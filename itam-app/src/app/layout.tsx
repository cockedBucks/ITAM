// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono, Caveat } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Smart Oasis IT Portal — نظام إدارة الأصول التقنية',
  description: 'نظام إدارة الأصول التقنية لشركة واحة الذكاء — Smart Oasis ITAM',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${ibmPlexMono.variable} ${caveat.variable}`}>
      <body className="bg-oasis-950 text-oasis-200 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
