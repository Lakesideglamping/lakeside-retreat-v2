import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createArticleSchema, createBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Things to Do in Cromwell | Activities Guide — Cycling, Wine & Lake Dunstan",
  description:
    "Complete guide to Cromwell activities: Otago Rail Trail cycling, Lake Dunstan water sports, Central Otago wine tasting, heritage precinct, and day trips to Queenstown.",
};

const waterActivities = [
  { title: "Swimming", desc: "Clear calm water with multiple beach access points" },
  { title: "Kayaking", desc: "Hidden inlets and rocky coves, rental available in Cromwell" },
  { title: "Paddleboarding", desc: "Calm morning conditions, perfect for beginners" },
  { title: "Fishing", desc: "Brown and rainbow trout, landlocked salmon" },
];

const seasons = [
  { name: "Summer", months: "Dec-Feb", highlights: "Lake swimming, evening cycle rides, outdoor winery dining, stone fruit season, daylight until 9:30pm" },
  { name: "Autumn", months: "Mar-May", highlights: "Golden vineyard colours, harvest events, quieter trails, mild cycling weather, autumn produce" },
  { name: "Winter", months: "Jun-Aug", highlights: "Cardrona & Treble Cone ski fields, cosy cellar doors, frost landscapes, ice skating, stargazing" },
  { name: "Spring", months: "Sep-Nov", highlights: "Blossom festival, lambing season, warming trails, shoulder season pricing, gardens coming to life" },
];

const dayTrips = [
  { title: "Queenstown", time: "45 min", desc: "Bungy, jet boats, gondola, shopping, and the scenic Kawarau Gorge drive." },
  { title: "Wanaka", time: "30 min", desc: "Puzzling World, That Wanaka Tree, Roy's Peak, and lakeside cafes." },
  { title: "Arrowtown", time: "35 min", desc: "Gold rush village, boutique shopping, cafes, and the Chinese Settlement." },
  { title: "Alexandra", time: "30 min", desc: "Otago Rail Trail gateway, Central Stories museum, and riverside walks." },
];

export default function CromwellActivitiesPage() {
  return (
    <>
      <JsonLd data={[
        createArticleSchema({
          title: "Things to Do in Cromwell, Central Otago",
          description: "Complete guide to activities in Cromwell: Lake Dunstan water sports, cycling trails, wine tasting, heritage precinct, and day trips.",
          path: "/cromwell-activities",
          image: "lakeview.jpeg",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: "Cromwell Activities", path: "/cromwell-activities" },
        ]),
      ]} />
      {/* Hero */}
      <section
        className="relative min-h-[60vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/images/lakeview.jpeg')",
        }}
      >
        <div className="pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4">
            Things to Do in Cromwell
          </h1>
          <p className="text-xl opacity-95 max-w-[700px] mx-auto">
            Your complete guide to activities, attractions, and experiences in the heart of Central Otago
          </p>
        </div>
      </section>

      {/* Water Activities */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">Lake Dunstan Water Activities</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {waterActivities.map((a) => (
              <div key={a.title} className="bg-white rounded-2xl p-6 text-center shadow-md">
                <h3 className="font-display text-xl mb-2">{a.title}</h3>
                <p className="text-muted text-sm">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cycling */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">Cycling &amp; Walking Trails</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-cream rounded-2xl overflow-hidden">
              <Image
                src="/images/vineyard-path.jpg"
                alt="Otago Rail Trail"
                width={800}
                height={500}
                className="w-full h-[200px] object-cover"
              />
              <div className="p-6">
                <h3 className="font-display text-xl mb-2">Otago Rail Trail</h3>
                <p className="text-muted text-sm">
                  152km Middlemarch to Clyde, passing just 300m from Lakeside Retreat. The Cromwell
                  to Clyde section is ~15km, flat, and suitable for all fitness levels.
                </p>
              </div>
            </div>
            <div className="bg-cream rounded-2xl overflow-hidden">
              <Image
                src="/images/lakeview.jpeg"
                alt="Lake Dunstan Cycle Trail"
                width={800}
                height={500}
                className="w-full h-[200px] object-cover"
              />
              <div className="p-6">
                <h3 className="font-display text-xl mb-2">Lake Dunstan Cycle Trail</h3>
                <p className="text-muted text-sm">
                  55km Cromwell to Clyde along the lake edge with hand-carved tunnels, cliff-edge
                  sections, and suspension bridges. Allow 4-6 hours for the full trail.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Heritage */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-6">Historic Cromwell Heritage Precinct</h2>
          <p className="text-lg leading-8 text-muted">
            Built when the Clyde Dam raised Lake Dunstan in the 1990s, the Heritage Precinct
            features beautifully restored 19th-century buildings housing craft shops, galleries,
            a bookshop, and charming cafes. Just 10 minutes from Lakeside Retreat with free parking.
          </p>
        </div>
      </section>

      {/* Seasons */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">Cromwell Through the Seasons</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {seasons.map((s) => (
              <div key={s.name} className="bg-cream rounded-2xl p-6">
                <h3 className="font-display text-xl text-teal mb-1">{s.name}</h3>
                <p className="text-burgundy text-xs font-semibold mb-3">{s.months}</p>
                <p className="text-muted text-sm">{s.highlights}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Day Trips */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">Day Trips from Cromwell</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dayTrips.map((t) => (
              <div key={t.title} className="bg-white rounded-2xl p-6 shadow-md">
                <span className="text-burgundy text-xs font-semibold">{t.time}</span>
                <h3 className="font-display text-xl mb-2">{t.title}</h3>
                <p className="text-muted text-sm">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Where to Stay */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">Where to Stay in Cromwell</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { href: "/dome-pinot", image: "/images/Pinotfront.jpeg", title: "Dome Pinot", badge: "Adults Only", price: "From $530/night" },
              { href: "/dome-rose", image: "/images/dome-rose-spa1.jpeg", title: "Dome Ros\u00e9", badge: "Adults Only", price: "From $510/night" },
              { href: "/lakeside-cottage", image: "/images/lakeside-cottage-exterior.jpeg", title: "Lakeside Cottage", badge: "Pet Friendly", price: "From $295/night" },
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
                    <h3 className="font-display text-lg text-teal">{acc.title}</h3>
                    <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                      {acc.badge}
                    </span>
                  </div>
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
          <h2 className="font-display text-4xl mb-4">Book Your Cromwell Adventure</h2>
          <Button href="/stay">View Accommodation &amp; Book</Button>
        </div>
      </section>
    </>
  );
}
