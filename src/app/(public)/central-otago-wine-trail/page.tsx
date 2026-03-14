import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createArticleSchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Central Otago Wine Trail | Best Wineries Near Cromwell & Bannockburn",
  description:
    "Explore New Zealand's finest Pinot Noir country. 30+ wineries within 15 minutes of Lakeside Retreat — Bannockburn, Cromwell Basin, Mt Difficulty, Carrick, Felton Road.",
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
  {
    name: "Gibbston Valley: The Valley of Vines",
    distance: "25-35 minutes from Lakeside Retreat",
    desc: "New Zealand's coolest and highest wine-producing area, nestled in the Kawarau Gorge between Cromwell and Queenstown. Famous for elegant, cool-climate Pinot Noir.",
    wineries: [
      { name: "Gibbston Valley Winery", note: "NZ's largest wine cave — underground barrel cellar, restaurant, and guided tours" },
      { name: "Peregrine Wines", note: "Architecturally stunning winery, award-winning Pinot Noir and Pinot Gris" },
      { name: "Chard Farm", note: "One of Central Otago's original estates, dramatic gorge setting" },
    ],
  },
  {
    name: "Bendigo: High Country Intensity",
    distance: "20-30 minutes from Lakeside Retreat",
    desc: "Hot, dry summers and cool nights on the eastern shores of Lake Dunstan produce wines of exceptional concentration and depth.",
    wineries: [
      { name: "Quartz Reef", note: "Specialists in méthode traditionnelle sparkling wine and Pinot Noir" },
      { name: "Bendigo Estate", note: "Boutique producer with stunning lake and Pisa Range views" },
      { name: "Prophecy Rock", note: "Small-batch Pinot Noir, open by appointment" },
    ],
  },
  {
    name: "Alexandra Basin: Pioneer Country",
    distance: "40-50 minutes from Lakeside Retreat",
    desc: "The oldest commercial wine-growing area in Central Otago, with a harsh continental climate producing distinctive, food-friendly styles.",
    wineries: [
      { name: "Two Paddocks", note: "Owned by actor Sam Neill — Pinot Noir and Riesling, tastings in Clyde" },
      { name: "Grasshopper Rock", note: "High-altitude vineyard, limited production, appointments recommended" },
      { name: "Doctors Flat Vineyard", note: "Small family producer, intense Pinot Noir from old vines" },
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
      <JsonLd data={[
        createArticleSchema({
          title: "Central Otago Wine Trail Guide",
          description: "Your gateway to New Zealand's premier Pinot Noir region. Explore 30+ cellar doors in Bannockburn, Cromwell Basin, and Pisa.",
          path: "/central-otago-wine-trail",
          image: "vineyard.jpeg",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: "Central Otago Wine Trail", path: "/central-otago-wine-trail" },
        ]),
        createFaqSchema([
          { question: "How many wineries are in Central Otago?", answer: "Central Otago has over 100 vineyards and 30+ cellar doors across six sub-regions: Bannockburn, Cromwell Basin, Pisa and Lowburn, Gibbston Valley, Bendigo, and Alexandra Basin. Lakeside Retreat is centrally located near Cromwell, giving easy access to all sub-regions." },
          { question: "What wine is Central Otago famous for?", answer: "Central Otago is world-renowned for Pinot Noir — considered among the finest expressions of the variety outside Burgundy. The region also produces excellent Pinot Gris, Riesling, and sparkling wines." },
          { question: "Which is the best winery to visit in Central Otago?", answer: "Felton Road in Bannockburn is consistently rated New Zealand's top winery (tastings by appointment). For a restaurant experience, Carrick Winery and Mt Difficulty are excellent choices. Gibbston Valley Winery has the most visitor-friendly experience including underground cave tours." },
          { question: "How far are the Central Otago wineries from Cromwell?", answer: "Bannockburn and Cromwell Basin wineries are 5–15 minutes from Cromwell. Gibbston Valley is 25–35 minutes (on the way to Queenstown). Alexandra Basin wineries are 40–50 minutes. All six sub-regions are easily visited as day trips from Lakeside Retreat." },
        ]),
      ]} />
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
              { href: "/dome-pinot", image: "/images/Pinotfront.jpeg", title: "Dome Pinot", price: "From $530/night" },
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

      {/* Also Explore */}
      <section className="py-16 px-5 bg-cream">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-2xl text-center mb-8">Also Explore</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { href: "/glamping-central-otago", title: "Glamping in Central Otago", desc: "Luxury domes with private spa — your wine country base" },
              { href: "/autumn-central-otago", title: "Autumn Harvest Season", desc: "March–May: golden vineyards and pinot noir harvest" },
              { href: "/cromwell-activities", title: "Cromwell Activities", desc: "Lake Dunstan, cycling trails, and more right from your door" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="block bg-white rounded-xl p-5 no-underline hover:-translate-y-1 transition-transform shadow-sm">
                <p className="font-semibold text-teal mb-1">{link.title}</p>
                <p className="text-muted text-sm">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">Book Your Wine Country Escape</h2>
          <p className="text-lg text-muted mb-8">
            30+ cellar doors within 15 minutes. Private spa to return to each evening.
            Domes from $510 &bull; Cottage from $295/night.
          </p>
          <Button href="/book">Check Availability & Book</Button>
        </div>
      </section>
    </>
  );
}
