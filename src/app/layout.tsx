import type { Metadata } from "next";
import { Playfair_Display, Roboto } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lakeside Retreat | Luxury Glamping Central Otago",
    template: "%s | Lakeside Retreat",
  },
  description:
    "Luxury glamping domes and lakefront cottage on Lake Dunstan, Cromwell. Private spas, stargazing skylights, vineyard views. Book direct from $295/night.",
  metadataBase: new URL("https://lakesideretreat.co.nz"),
  icons: {
    icon: "/images/favicon-16x16.png",
    apple: "/images/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-NZ">
      <body className={`${playfair.variable} ${roboto.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
