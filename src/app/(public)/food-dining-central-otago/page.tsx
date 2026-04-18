import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createArticleSchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Food & Dining in Central Otago | Best Restaurants Near Cromwell",
  description:
    "Best restaurants, cafés, and food experiences near Lakeside Retreat — Cromwell Heritage Precinct, winery restaurants, local stone fruit, farmers markets, and fine dining.",
};

const categories = [
  {
    name: "Winery Restaurants",
    icon: "🍷",
    places: [
      { name: "Carrick Winery Restaurant", distance: "10 min", desc: "Certified organic winery with a stunning restaurant overlooking the vineyard. Seasonal menu using local Central Otago produce. Lunch daily, dinner by arrangement." },
      { name: "Mt Difficulty Restaurant", distance: "12 min", desc: "Cellar door restaurant in Bannockburn with panoramic Kawarau Gorge views. Excellent lunch menu, award-winning Pinot Noir by the glass." },
      { name: "Gibbston Valley Winery", distance: "30 min", desc: "NZ's most visited winery — underground cave, restaurant, and cheese rooms. Full lunch menu, cave tours, and wine tastings. Book ahead in summer." },
      { name: "Wooing Tree", distance: "10 min", desc: "Relaxed cellar door with platters, wines, and the famous underground barrel hall. Great for a casual afternoon with a glass of Blush." },
    ],
  },
  {
    name: "Cromwell Cafés & Restaurants",
    icon: "☕",
    places: [
      { name: "Armando's Kitchen", distance: "10 min", desc: "Beloved Italian restaurant in the Cromwell Heritage Precinct. Housemade pasta, wood-fired pizza, and a great Central Otago wine list. Book ahead — locals love it." },
      { name: "The Grain Kitchen & Bar", distance: "10 min", desc: "All-day dining in Cromwell town centre. Good coffee, cabinet food, and hearty mains. Reliable spot for breakfast or a casual lunch." },
      { name: "Cromwell Heritage Precinct Cafés", distance: "10 min", desc: "The historic stone buildings by the lake house several artisan cafés, a bakery, and gift shops. Perfect for a morning coffee and a stroll by the water." },
      { name: "Highlands Motorsport Park Café", distance: "8 min", desc: "Open daily — good café food with views of the racetrack. Popular with families and car enthusiasts. Quick and easy." },
    ],
  },
  {
    name: "Wanaka Dining",
    icon: "🏔️",
    places: [
      { name: "Francesca's Italian Kitchen", distance: "45 min", desc: "One of Wanaka's most celebrated restaurants — housemade pasta, wood-fired dishes, and an intimate atmosphere. Book well ahead in summer." },
      { name: "Kika", distance: "45 min", desc: "Modern, seasonal menu in a relaxed Wanaka setting. Great for lunch or dinner, excellent NZ wine list." },
      { name: "Ritual Café", distance: "45 min", desc: "Wanaka's best coffee, right on the lakefront. A Wanaka institution — perfect for breakfast with lake views." },
    ],
  },
];

const localProduce = [
  { item: "Stone Fruit", season: "Dec – Mar", desc: "Central Otago is famous for cherries, apricots, peaches, and nectarines. Buy direct from roadside stalls on SH8 near Cromwell — the best you'll ever taste." },
  { item: "Pinot Noir", season: "Year-round", desc: "World-class Pinot Noir from 6 sub-regions. Buy direct from cellar doors for exclusive releases not available in shops." },
  { item: "Merino Lamb", season: "Year-round", desc: "High-country Merino lamb is on menus throughout the region. Intensely flavoured, tender, and sustainably raised on the surrounding stations." },
  { item: "Artisan Cheese", season: "Year-round", desc: "Gibbston Valley Winery has an on-site cheese room. Local artisan producers supply cafés and restaurants throughout Cromwell." },
  { item: "Cromwell Farmers Market", season: "Seasonal", desc: "Held at the Cromwell Heritage Precinct on Sunday mornings in summer. Local produce, baked goods, preserves, and craft goods from around Central Otago." },
];

export default function FoodDiningPage() {
  return (
    <>
      <JsonLd data={[
        createArticleSchema({
          title: "Food & Dining in Central Otago — Restaurant Guide from Lakeside Retreat",
          description: "Best restaurants, cafés, winery dining, and local produce near Cromwell and Lakeside Retreat.",
          path: "/food-dining-central-otago",
          image: "ViewfromVineyard.jpeg",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: "Food & Dining", path: "/food-dining-central-otago" },
        ]),
        createFaqSchema([
          { question: "What are the best restaurants near Cromwell NZ?", answer: "The top dining options near Cromwell include Carrick Winery Restaurant and Mt Difficulty Restaurant in Bannockburn (10–12 minutes), Armando's Kitchen in the Cromwell Heritage Precinct, and Wooing Tree cellar door for relaxed platters. Wanaka has excellent dining 45 minutes away." },
          { question: "Are there good restaurants at Central Otago wineries?", answer: "Yes — Carrick Winery and Mt Difficulty both have excellent restaurants with vineyard and gorge views. Gibbston Valley Winery (30 minutes) has a full restaurant, underground wine cave tours, and a cheese room." },
          { question: "Where can I buy Central Otago stone fruit?", answer: "Look for roadside fruit stalls on State Highway 8 near Cromwell, especially in summer (December to March). The Cromwell Heritage Precinct also has local produce, and the Cromwell Farmers Market runs Sunday mornings in summer." },
          { question: "Is there a farmers market in Cromwell?", answer: "Yes — the Cromwell Farmers Market runs on Sunday mornings at the Heritage Precinct in summer. Local fruit, vegetables, baked goods, preserves, and artisan products from around Central Otago." },
        ]),
      ]} />

      {/* Hero */}
      <section
        className="relative min-h-[60vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url('/images/ViewfromVineyard.jpeg')",
        }}
      >
        <div className="pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4">
            Food &amp; Dining in Central Otago
          </h1>
          <p className="text-xl opacity-95 max-w-[700px] mx-auto">
            Winery restaurants, heritage cafés, stone fruit stalls, and world-class Pinot Noir — all within minutes of Lakeside Retreat
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200">
        <ol className="flex items-center gap-2 px-5 py-3 text-sm max-w-[1200px] mx-auto">
          <li><Link href="/" className="text-burgundy no-underline hover:underline">Home</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li><Link href="/guides" className="text-burgundy no-underline hover:underline">Guides</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li className="text-muted">Food &amp; Dining</li>
        </ol>
      </nav>

      {/* Intro */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-6">Eat Well in Wine Country</h2>
          <p className="text-lg leading-8 text-muted">
            Central Otago&apos;s food scene punches well above its weight. Winery
            restaurants with vineyard views, Italian kitchens in gold rush stone
            buildings, Wanaka&apos;s vibrant café culture, and roadside stalls selling
            the country&apos;s finest stone fruit. From Lakeside Retreat, it&apos;s all
            within 10–45 minutes.
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories.map((cat, i) => (
        <section key={cat.name} className={`py-16 px-5 ${i % 2 === 0 ? "bg-white" : ""}`}>
          <div className="max-w-[1000px] mx-auto">
            <h2 className="font-display text-3xl mb-10">
              {cat.icon} {cat.name}
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {cat.places.map((place) => (
                <div key={place.name} className="bg-cream rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-display text-lg text-burgundy">{place.name}</h3>
                    <span className="text-xs bg-white text-burgundy px-2 py-1 rounded-full font-semibold shrink-0 whitespace-nowrap">
                      {place.distance}
                    </span>
                  </div>
                  <p className="text-muted text-sm leading-6">{place.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Local Produce */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">🍑 Local Produce & Markets</h2>
          <p className="text-center text-muted text-lg mb-12">
            Central Otago&apos;s land produces some of New Zealand&apos;s finest food and wine
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {localProduce.map((p) => (
              <div key={p.item} className="bg-cream rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg text-burgundy">{p.item}</h3>
                  <span className="text-xs bg-white text-burgundy px-2 py-1 rounded-full font-semibold">
                    {p.season}
                  </span>
                </div>
                <p className="text-muted text-sm leading-6">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips callout */}
      <section className="py-16 px-5 bg-burgundy text-white">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-3xl mb-6">Stephen &amp; Sandy&apos;s Tips</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              { tip: "Book winery restaurants ahead", detail: "Carrick and Mt Difficulty book out fast in summer and autumn — reserve before you arrive." },
              { tip: "Don't miss the stone fruit stalls", detail: "The roadside stalls on SH8 near Cromwell in Dec–Feb sell the best cherries and apricots in the country." },
              { tip: "Lunch over dinner at wineries", detail: "Most winery restaurants serve lunch only. Plan your day around a long winery lunch rather than driving back in the evening." },
              { tip: "Armando's needs a booking", detail: "One of the most popular restaurants in the area — walk-ins are often turned away. Book a day or two ahead." },
            ].map((t) => (
              <div key={t.tip} className="bg-white/10 rounded-xl p-4">
                <p className="font-semibold text-white mb-1">{t.tip}</p>
                <p className="text-white/80 text-sm">{t.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Where to Stay */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">Stay in the Heart of It</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { href: "/dome-pinot", image: "/images/Pinotfront.jpeg", title: "Dome Pinot", badge: "Adults Only", price: "From $530/night", note: "Private spa, vineyard views, breakfast included" },
              { href: "/dome-rose", image: "/images/dome-rose-spa1.jpeg", title: "Dome Rosé", badge: "Adults Only", price: "From $510/night", note: "Private spa, mountain views, kitchenette" },
              { href: "/lakeside-cottage", image: "/images/lakeside-cottage-exterior.jpeg", title: "Lakeside Cottage", badge: "Pet Friendly", price: "From $295/night", note: "Sleeps 3, wood-fired hot tub, direct lake access" },
            ].map((acc) => (
              <Link
                key={acc.href}
                href={acc.href}
                className="block bg-cream rounded-2xl overflow-hidden shadow-md hover:-translate-y-1 transition-transform no-underline"
              >
                <div className="relative h-[200px]">
                  <Image src={acc.image} alt={acc.title} fill className="object-cover" sizes="33vw" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-lg text-burgundy">{acc.title}</h3>
                    <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-semibold shrink-0">
                      {acc.badge}
                    </span>
                  </div>
                  <p className="text-burgundy font-semibold text-sm mb-1">{acc.price}</p>
                  <p className="text-muted text-xs">{acc.note}</p>
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
              { href: "/central-otago-wine-trail", title: "Central Otago Wine Trail", desc: "Full guide to all 6 wine sub-regions and 30+ cellar doors" },
              { href: "/autumn-central-otago", title: "Autumn Harvest Season", desc: "March–May: golden vineyards, harvest events, and pinot noir" },
              { href: "/cromwell-activities", title: "Cromwell Activities", desc: "Lake Dunstan, cycling trails, and the Heritage Precinct" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="block bg-white rounded-xl p-5 no-underline hover:-translate-y-1 transition-transform shadow-sm">
                <p className="font-semibold text-burgundy mb-1">{link.title}</p>
                <p className="text-muted text-sm">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">Book Your Stay</h2>
          <p className="text-lg text-muted mb-8">
            Winery restaurants, stone fruit stalls, and Cromwell&apos;s best cafés — all on your doorstep.
            Domes from $510 &bull; Cottage from $295/night.
          </p>
          <Button href="/book">Check Availability & Book</Button>
        </div>
      </section>
    </>
  );
}
