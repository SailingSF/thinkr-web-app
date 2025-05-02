import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import type { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#141718"
};

export const metadata: Metadata = {
  title: 'thinkr - Shopify AI Agent',
  description: 'Automate your Shopify store with AI',
  applicationName: 'thinkr',
  keywords: ['shopify', 'ai', 'automation', 'e-commerce'],
  authors: [{ name: 'thinkr' }],
  robots: {
    index: true,
    follow: true,
    googleBot: 'index, follow',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || '',
    title: 'thinkr - Shopify AI Agent',
    description: 'Automate your Shopify store with AI',
    siteName: 'thinkr',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
