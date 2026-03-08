import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Central Otago Wine Trail Guide",
  description:
    "Your gateway to New Zealand's premier Pinot Noir region. Explore 30+ cellar doors in Bannockburn, Cromwell Basin, and Pisa — all within minutes of Lakeside Retreat.",
};

const regions = [
  {
    name: "Bannockburn: The Burgundy of the South",
    distance: "10-15 minutes from Lakeside Retreat",
    desc: "North-facing slopes, schist soils, and gold-mining heritage make Bannockburn one of Central Otago's most acclaimed sub-regions.",
    wineries: [
      { name: "Felton Road", note: "Biodynamic, tastings by appointment only" },
      { name: "Burn Cottage", note: "Biodynamic, single-vineyard Pinot Noir" },
      { name: "Carrick Winery", note: "Certified organic, on-site restaurant" },
      { name: "Mt Difficulty", note: "Cellar door in Bannockburn village, Kawarau Gorge views" },
    ],
  },
  {
    name: "Cromwell Basin: Your Nearest Neighbours",
    distance: "5-15 minutes from Lakeside Retreat",
    desc: "Diverse winery experiences in a compact area, perfect for an afternoon of tasting.",
    wineries: [
      { name: "Wooing Tree", note: "Underground barrel hall, Pinot Noir/Pinot Gris/sparkling Blush" },
      { name: "Mondillo", note: "Boutique Italian-inspired estate" },
      { name: "Aurum Wines", note: "Elegant Pinot Noir and Riesling near Lake Dunstan" },
    ],
  },
  {
    name: "Pisa and Lowburn: Lakeside Vineyards",
    distance: "10-20 minutes from Lakeside Retreat",
    desc: "Ancient glacial terraces with elevated, sun-drenched sites producing wines of exceptional depth.",
    wineries: [
      { name: "Valli", note: "Winemaker Grant Taylor, single-vineyard wines across sub-regions" },
      { name: "Domain Road Vineyard", note: "Family-run, textured Pinot Noir" },
      { name: "Wild Irishman", note: "Smaller producer, tastings by appointment" },
    ],
  },
];

const tips = [
  "Best time to visit: February through April for harvest season",
  "Book ahead for popular cellar doors like Felton Road",
  "Designate a driver or join a guided wine tour",
  "Pace yourself: 3-4 cellar doors per day is ideal",
  "Pair with food at Carrick or Mt Difficulty restaurants",
  "Buy direct for exclusive releases not available in stores",
];

export default function WineTrailPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative min-h-[60vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/images/vineyard.jpeg')",
        }}
      >
        <div className="pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4">
            Central Otago Wine Trail Guide
          </h1>
          <p className="text-xl opacity-95 max-w-[700px] mx-auto">
            Your gateway to New Zealand&apos;s premier Pinot Noir region, right from your doorstep
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200">
        <ol className="flex items-center gap-2 px-5 py-3 text-sm max-w-[1200px] mx-auto">
          <li><Link href="/" className="text-teal no-underline hover:underline">Home</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li><Link href="/guides" className="text-teal no-underline hover:underline">Guides</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li className="text-muted">Central Otago Wine Trail</li>
        </ol>
      </nav>

      {/* Intro */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-8">
            Discovering Central Otago Wine Country
          </h2>
          <p className="text-lg leading-8 text-muted text-center">
            Central Otago is New Zealand&apos;s southernmost wine region and the most southerly
            wine-producing region in the world. Renowned for world-class Pinot Noir, the region
            boasts over 100 vineyards and 30+ cellar doors across six sub-regions: Bannockburn,
            Cromwell Basin, Pisa and Lowburn, Bendigo, Gibbston Valley, and Alexandra Basin.
            Lakeside Retreat sits on the shores of Lake Dunstan near Cromwell, placing you at the
            heart of it all.
          </p>
        </div>
      </section>

      {/* Wine Regions */}
      {regions.map((region) => (
        <section key={region.name} className="py-16 px-5 odd:bg-white">
          <div className="max-w-[900px] mx-auto">
            <h2 className="font-display text-3xl mb-2">{region.name}</h2>
            <p className="text-burgundy text-sm font-semibold mb-4">{region.distance}</p>
            <p className="text-muted leading-7 mb-8">{region.desc}</p>
            <div className="space-y-4">
              {region.wineries.map((w) => (
                <div key={w.name} className="bg-cream rounded-xl p-5 flex items-start gap-3">
                  <span className="text-burgundy font-bold mt-0.5">&#10003;</span>
                  <div>
                    <span className="font-semibold text-teal">{w.name}</span>
                    <span className="text-muted text-sm"> &mdash; {w.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Tips */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-8">
            Wine Trail Tips for Visitors
          </h2>
          <div className="bg-white rounded-2xl p-8 shadow-md">
            <ul className="space-y-4">
              {tips.map((tip) => (
                <li key={tip} className="flex items-start gap-3 text-body">
                  <span className="text-burgundy font-bold mt-0.5">&#10003;</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Where to Stay */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">
            Where to Stay in Wine Country
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { href: "/dome-pinot", image: "/images/dome-pinot-hero.jpeg", title: "Dome Pinot", price: "From $530/night" },
              { href: "/dome-rose", image: "/images/dome-rose-spa1.jpeg", title: "Dome Ros\u00e9", price: "From $510/night" },
              { href: "/lakeside-cottage", image: "/images/lakeside-cottage-exterior.jpeg", title: "Lakeside Cottage", price: "From $295/night" },
            ].map((acc) => (
              <Link
                key={acc.href}
                href={acc.href}
                className="block bg-cream rounded-2xl overflow-hidden shadow-md hover:-translate-y-1 transition-transform no-underline"
              >
                <div className="relative h-[200px]">
                  <Image src={acc.image} alt={acc.title} fill className="object-cover" sizes="33vw" />
                </div>
                <div className="p-5 text-center">
                  <h3 className="font-display text-lg text-teal mb-1">{acc.title}</h3>
                  <p className="text-burgundy font-semibold text-sm">{acc.price} &rarr;</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">Book Your Wine Country Escape</h2>
          <Button href="/stay">View Our Accommodation</Button>
        </div>
      </section>
    </>
  );
}
