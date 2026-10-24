import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const inter = Inter({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const OG_IMAGE = {
  url: "/images/lake-mountains-perfect.jpg",
  width: 1200,
  height: 630,
  alt: "Lakeside Retreat glamping domes overlooking Lake Dunstan",
};

export const metadata: Metadata = {
  title: {
    default: "Lakeside Retreat | Luxury Glamping Central Otago",
    template: "%s | Lakeside Retreat",
  },
  description:
    "Luxury glamping domes and lakefront cottage on Lake Dunstan, Cromwell. Saltwater spas in the domes, wood-fired hot tub at the cottage, stargazing skylights, vineyard views. Adults-only. Book direct — from $350/night.",
  metadataBase: new URL("https://lakesideretreat.co.nz"),
  icons: {
    icon: "/images/favicon-16x16.png",
    apple: "/images/apple-touch-icon.png",
  },
  openGraph: {
    title: "Lakeside Retreat | Luxury Glamping Central Otago",
    description:
      "Luxury glamping domes and lakefront cottage on Lake Dunstan, Cromwell. Saltwater spas in the domes, wood-fired hot tub at the cottage, stargazing skylights, vineyard views.",
    url: "https://lakesideretreat.co.nz",
    siteName: "Lakeside Retreat",
    images: [OG_IMAGE],
    locale: "en_NZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lakeside Retreat | Luxury Glamping Central Otago",
    description:
      "Luxury glamping domes and lakefront cottage on Lake Dunstan, Cromwell.",
    images: [OG_IMAGE.url],
  },
  // Bing Webmaster Tools ownership check. Must stay in place: Bing re-checks
  // it periodically and drops the site if it disappears.
  verification: {
    other: { "msvalidate.01": "81E38D4F269A1DDB01E62EB1BDE93FA9" },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nonce is set by middleware. Absent on statically-generated responses,
  // in which case CSP 'unsafe-inline' fallback keeps the SW script working.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en-NZ" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="antialiased">
        {children}
        {/*
          The empty .catch() is deliberate — do not remove it.

          Service-worker registration is expected to fail in ordinary
          situations: private windows, older browsers, locked-down devices,
          and headless crawlers that stub navigator.serviceWorker.register to
          reject. None of those are faults in this site; the worker is pure
          progressive enhancement (it caches one logo file), and the page is
          identical without it.

          Uncaught, each such failure became an unhandled promise rejection,
          which Sentry reports as a high-priority error — JAVASCRIPT-NEXTJS-6
          was a bot on Chrome 129/Linux doing exactly this. Logging it would
          only move the noise from Sentry to the console. The right response to
          "the worker could not install" is to carry on.
        */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`,
          }}
        />
      </body>
    </html>
  );
}
