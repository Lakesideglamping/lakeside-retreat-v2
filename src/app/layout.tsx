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
    "Luxury glamping domes and lakefront cottage on Lake Dunstan, Cromwell. Saltwater spas in the domes, wood-fired hot tub at the cottage, stargazing skylights, vineyard views. Adults-only. Book direct — $365/night.",
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
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
      </body>
    </html>
  );
}
