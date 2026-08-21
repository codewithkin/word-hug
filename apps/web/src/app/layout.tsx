import type { Metadata } from 'next';
import { Baloo_2 } from 'next/font/google';

import '../index.css';
import Footer from '@/components/footer';
import Header from '@/components/header';
import Providers from '@/components/providers';
import { SITE } from '@/lib/site';

/**
 * ── Baloo 2, and nothing else ─────────────────────────────────────────────
 * The app has exactly one typeface in two weights (700 and 800) and no lighter
 * cut anywhere. The template shipped Geist Sans and Geist Mono, which is a
 * perfectly good pairing belonging to a different product.
 *
 * 400 is included here and used nowhere: `next/font` subsets to the weights
 * requested, and long legal prose at 700 is exhausting to read. The app has no
 * long legal prose, which is why it never needed the weight.
 */
const baloo = Baloo_2({
  variable: '--font-baloo',
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  display: 'swap',
});

/**
 * ── Why the metadata is this thorough for two legal pages ─────────────────
 * These URLs are submitted to Google Play and the App Store, and both crawl
 * them. `metadataBase` in particular: without it Next emits relative Open
 * Graph URLs, which some crawlers resolve against the wrong origin and then
 * report as a broken listing.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.publisher }],
  openGraph: {
    type: 'website',
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${baloo.variable} font-sans antialiased`}>
        <Providers>
          {/*
            `min-h-svh` with the content row growing, rather than the template's
            `h-svh` grid. The privacy policy is far taller than the viewport and
            a fixed-height grid would clip it.
          */}
          <div className="flex min-h-svh flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
