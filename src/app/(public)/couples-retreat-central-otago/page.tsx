import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/hero-background";
import { JsonLd, createArticleSchema, createBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Couples Retreat Central Otago | Romantic Glamping Domes with Private Spas",
  description:
    "Adults-only luxury geodesic domes with private outdoor spas, stargazing skylights, and Central Otago wine country at your doorstep. The perfect romantic escape.",

  alternates: { canonical: "/couples-retreat-central-otago" },
  openGraph: {
    title: "Couples Retreat Central Otago | Romantic Glamping Domes with Private Spas",
    description: "Adults-only luxury geodesic domes with private outdoor spas, stargazing skylights, and Central Otago wine country at your doorstep. The perfect romantic escape.",
    url: "https://lakesideretreat.co.nz/couples-retreat-central-otago",
    images: [
      {
        url: "/images/dome-rose-spa1.jpeg",
        width: 1200,
        height: 800,
        alt: "Couples retreat dome with private outdoor spa, Central Otago",
      },
    ],
    type: "article",
  },
};

const itinerary = [
  {
    day: "Day 1",
    title: "Arrive, Unwind, and Settle In",
    desc: "Enjoy the scenic drive from Queenstown Airport through the Kawarau Gorge. Explore your dome and enjoy a continental breakfast at your leisure. End the evening soaking in your private outdoor spa under the stars — the Milky Way is spectacular with zero light pollution.",
  },
  {
    day: "Day 2",
    title: "Wine Trail and Vineyard Dining",
    desc: "Start with a slow morning, then drive 10 minutes to Bannockburn. Visit Mt Difficulty for Pinot Noir tasting, Carrick Winery for organic vineyard platters, and Wooing Tree's underground cellar. Enjoy a picnic by Lake Dunstan in the afternoon, then dinner at Carrick or Stoaker Room.",
  },
  {
    day: "Day 3",
    title: "Cycle the Rail Trail and Farewell Brunch",
    desc: "Hire bikes and ride the Otago Rail Trail (300m from the retreat). The Cromwell to Clyde section follows the Kawarau River — flat and relaxed. Finish with brunch at the historic precinct. Optionally take the Crown Range Road to Queenstown for stunning views.",
  },
];

const experiences = [
  { title: "Wine Tasting for Two", desc: "30+ wineries within 15 min, with intimate private tastings available" },
  { title: "Couples Cycling", desc: "Otago Rail Trail and Lake Dunstan Trail with tunnels and suspension bridges" },
  { title: "Lakeside Picnics", desc: "Hamper with local produce at secluded spots along Lake Dunstan" },
  { title: "Spa Under the Stars", desc: "Private outdoor saltwater spas with dark skies and minimal light pollution" },
  { title: "Local Dining", desc: "Vineyard restaurants, degustation menus, and heritage precinct cafes" },
  { title: "Stargazing", desc: "Among NZ's darkest skies — Dome Pinot's skylight lets you view southern constellations from bed" },
];

export default function CouplesRetreatPage() {
  return (
    <>
      <JsonLd data={[
        createArticleSchema({
          title: "The Perfect Romantic Getaway in Central Otago",
          description: "Adults-only luxury glamping domes with private spas, vineyard views, and wine country at your doorstep.",
          path: "/couples-retreat-central-otago",
          image: "dome-rose-spa1.jpeg",
          datePublished: "2025-02-14",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: "Couples Retreat", path: "/couples-retreat-central-otago" },
        ]),
      ]} />
      {/* Hero */}
      <HeroBackground
        src="/images/dome-rose-spa1.jpeg"
        alt="Dome Rose private outdoor spa — romantic couples retreat in Central Otago"
        minHeight="60vh"
        overlayOpacity={0.4}
      >
        <h1 className="font-display text-5xl text-white mb-4">
          The Perfect Romantic Getaway
        </h1>
        <p className="text-xl opacity-95 max-w-[700px] mx-auto">
          Adults-only luxury glamping domes with private spas, vineyard views, and wine country
          at your doorstep
        </p>
      </HeroBackground>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200">
        <ol className="flex items-center gap-2 px-5 py-3 text-sm max-w-[1200px] mx-auto">
          <li><Link href="/" className="text-burgundy no-underline hover:underline">Home</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li><Link href="/guides" className="text-burgundy no-underline hover:underline">Guides</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li className="text-muted">Couples Retreat</li>
        </ol>
      </nav>

      {/* Intro */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-6">
            Why Central Otago Is New Zealand&apos;s Best-Kept Secret for Couples
          </h2>
          <p className="text-lg leading-8 text-muted">
            While Queenstown and Wanaka draw the crowds, Central Otago offers something rarer:
            space, silence, and genuine escape. Lakeside Retreat sits at 96 Smiths Way, Mount Pisa,
            with views across Lake Dunstan toward Bannockburn, surrounded by vineyards and framed
            by the Pisa Range. The famous Otago Rail Trail is just 300m away.
          </p>
        </div>
      </section>

      {/* Domes */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-4">
            <span className="bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
              Strictly Adults Only
            </span>
          </div>
          <h2 className="font-display text-4xl text-center mb-10">
            Our Adults-Only Luxury Domes
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Link href="/dome-pinot" className="block bg-cream rounded-2xl overflow-hidden shadow-lg no-underline hover:-translate-y-1 transition-transform">
              <div className="relative h-[250px]">
                <Image src="/images/Pinotfront.jpeg" alt="Dome Pinot luxury geodesic dome with Lake Dunstan views" fill className="object-cover" sizes="50vw" />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl text-burgundy mb-1">Dome Pinot</h3>
                <p className="text-burgundy font-semibold text-sm mb-3">$635/night &middot; 50sqm</p>
                <ul className="text-sm text-muted space-y-1">
                  <li>&bull; Private outdoor spa with lake views</li>
                  <li>&bull; Stargazing skylight</li>
                  <li>&bull; Continental breakfast included</li>
                  <li>&bull; Kitchenette</li>
                </ul>
              </div>
            </Link>
            <Link href="/dome-rose" className="block bg-cream rounded-2xl overflow-hidden shadow-lg no-underline hover:-translate-y-1 transition-transform">
              <div className="relative h-[250px]">
                <Image src="/images/dome-rose-spa1.jpeg" alt="Dome Rosé" fill className="object-cover" sizes="50vw" />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl text-burgundy mb-1">Dome Rosé</h3>
                <p className="text-burgundy font-semibold text-sm mb-3">$615/night &middot; 40sqm</p>
                <ul className="text-sm text-muted space-y-1">
                  <li>&bull; Private outdoor spa</li>
                  <li>&bull; Mountain and vineyard views</li>
                  <li>&bull; Luxury super king bed</li>
                  <li>&bull; Kitchenette</li>
                </ul>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">
            A Romantic 3-Day Central Otago Itinerary
          </h2>
          <div className="space-y-8">
            {itinerary.map((day) => (
              <div key={day.day} className="flex gap-6">
                <div className="text-2xl font-bold text-burgundy min-w-[70px]">{day.day}</div>
                <div className="bg-white rounded-xl p-6 shadow-sm flex-1">
                  <h3 className="font-display text-xl mb-3">{day.title}</h3>
                  <p className="text-muted leading-7">{day.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experiences */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">
            Romantic Things to Do
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((e) => (
              <div key={e.title} className="bg-cream rounded-2xl p-6">
                <h3 className="font-display text-lg text-burgundy mb-2">{e.title}</h3>
                <p className="text-muted text-sm">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">Book Your Romantic Escape</h2>
          <p className="text-lg text-muted mb-8">
            Book direct for the best rates and complimentary continental breakfast.
          </p>
          <Button href="/book">Book Your Stay</Button>
        </div>
      </section>
    </>
  );
}
