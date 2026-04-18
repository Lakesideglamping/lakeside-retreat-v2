import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createArticleSchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Wanaka Day Trip Guide | Lakes, Mountains & That Tree — from Lakeside Retreat",
  description:
    "Wanaka is just 45 minutes from Lakeside Retreat. Day trip guide: That Wanaka Tree, Roy's Peak, Rippon Vineyard, Puzzling World, lake walks, and the best cafés.",
};

const activities = [
  {
    title: "That Wanaka Tree",
    time: "Morning",
    desc: "New Zealand's most photographed tree — a lone willow growing in Lake Wanaka near the town waterfront. Best light in the morning. Short walk from the town centre.",
  },
  {
    title: "Roy's Peak Track",
    time: "Full Day",
    desc: "The iconic alpine hike above Wanaka. 16km return, 1,200m elevation gain, and one of the best views in New Zealand. Allow 5–6 hours. Start early to beat the heat.",
  },
  {
    title: "Rippon Vineyard",
    time: "Morning / Afternoon",
    desc: "One of New Zealand's most beautiful wineries — biodynamic Pinot Noir with the vineyard sloping down to Lake Wanaka and mountains behind. Open seasonally for tastings.",
  },
  {
    title: "Puzzling World",
    time: "Afternoon",
    desc: "Wanaka's famous attraction — a giant maze, optical illusions, and puzzle rooms. Great for all ages and a NZ institution since 1973. Allow 1–2 hours.",
  },
  {
    title: "Lake Wanaka Waterfront",
    time: "Any Time",
    desc: "Walk, swim, paddleboard, or simply sit at the lakefront. The calm turquoise water, mountain backdrop, and willow trees make it one of the most beautiful spots in NZ.",
  },
  {
    title: "Mount Iron Walk",
    time: "Morning / Afternoon",
    desc: "A shorter alternative to Roy's Peak — 1 hour return, great 360° views over Lake Wanaka, Lake Hawea, and the surrounding ranges. Starts just outside town.",
  },
  {
    title: "Cardrona Valley",
    time: "On the Way",
    desc: "The scenic back road between Wanaka and Queenstown. Pass the historic Cardrona Hotel (1863) and the Cardrona ski field turn-off. Beautiful high-country landscape.",
  },
  {
    title: "Wanaka Cafés & Dining",
    time: "Any Time",
    desc: "Wanaka has a great café scene for a town its size. Francesca's Italian Kitchen, Kika, and the waterfront cafés are local favourites. Quieter and better value than Queenstown.",
  },
];

const itinerary = [
  {
    time: "8:30am",
    label: "Depart Lakeside Retreat",
    detail: "45-min drive via SH8 through Tarras and Luggate — easy, scenic high-country roads.",
  },
  {
    time: "9:15am",
    label: "That Wanaka Tree",
    detail: "First stop — morning light is best. Short stroll from the car park on Lakeside Road.",
  },
  {
    time: "9:45am",
    label: "Coffee on the waterfront",
    detail: "Grab a flat white at one of the lakefront cafés and watch the morning light on the mountains.",
  },
  {
    time: "10:30am",
    label: "Roy's Peak or Mount Iron",
    detail: "Roy's Peak for a full day's adventure (5–6 hrs). Mount Iron for a shorter walk with great views (1.5 hrs).",
  },
  {
    time: "1:00pm",
    label: "Lunch in Wanaka town",
    detail: "Francesca's Italian, Kika, or a lakeside café. Wanaka has excellent food for a small town.",
  },
  {
    time: "2:30pm",
    label: "Puzzling World & Rippon Vineyard",
    detail: "Afternoon exploration — optical illusions at Puzzling World, or a tasting at Rippon if it's open.",
  },
  {
    time: "4:30pm",
    label: "Return to Lakeside Retreat",
    detail: "Back in 45 minutes. Your spa is warm and the wine rack is stocked.",
  },
];

export default function WanakaDayTripPage() {
  return (
    <>
      <JsonLd data={[
        createArticleSchema({
          title: "Wanaka Day Trip Guide from Lakeside Retreat",
          description: "That Wanaka Tree, Roy's Peak, Rippon Vineyard, Puzzling World — a full Wanaka day trip guide from your Central Otago base.",
          path: "/wanaka-day-trip",
          image: "lakeviewautumn.jpeg",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: "Wanaka Day Trip", path: "/wanaka-day-trip" },
        ]),
        createFaqSchema([
          { question: "How far is Wanaka from Cromwell?", answer: "Wanaka is approximately 45 minutes from Cromwell (and Lakeside Retreat) via State Highway 8 through Tarras and Luggate. The drive passes through beautiful Central Otago high-country scenery." },
          { question: "What is That Wanaka Tree?", answer: "That Wanaka Tree is a lone willow tree growing in the shallows of Lake Wanaka near the town waterfront. It is one of the most photographed subjects in New Zealand. Morning light is best for photos." },
          { question: "Is Roy's Peak worth doing on a day trip from Cromwell?", answer: "Yes — Roy's Peak is absolutely worth it if you have a full day. The 16km return track takes 5–6 hours and offers one of the best mountain views in New Zealand. Start early (before 9am) to beat the crowds and heat in summer." },
          { question: "What is Rippon Vineyard in Wanaka?", answer: "Rippon is one of New Zealand's most beautiful and respected wineries, located on the shores of Lake Wanaka with the mountains as a backdrop. They produce biodynamic Pinot Noir and open seasonally for tastings — check their website before visiting." },
        ]),
      ]} />

      {/* Hero */}
      <section
        className="relative min-h-[60vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url('/images/lakeviewautumn.jpeg')",
        }}
      >
        <div className="pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4">
            Wanaka Day Trip
          </h1>
          <p className="text-xl opacity-95 max-w-[700px] mx-auto">
            Lakes, mountains, and That Tree — just 45 minutes from Lakeside Retreat
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
          <li className="text-muted">Wanaka Day Trip</li>
        </ol>
      </nav>

      {/* Intro */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-6">
            Wanaka: Central Otago&apos;s Gem
          </h2>
          <p className="text-lg leading-8 text-muted mb-6">
            Wanaka is quieter than Queenstown, just as beautiful, and easier to enjoy.
            A pristine lake, dramatic mountain walks, world-class vineyards, and a
            relaxed café scene — it&apos;s the kind of place you plan to spend two hours
            and end up staying all day. From Lakeside Retreat, it&apos;s 45 minutes
            through classic Central Otago high country.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-cream rounded-xl px-6 py-3">
              <span className="font-bold text-burgundy block">~45 min</span>
              <span className="text-muted">Drive from Lakeside Retreat</span>
            </div>
            <div className="bg-cream rounded-xl px-6 py-3">
              <span className="font-bold text-burgundy block">Via SH8</span>
              <span className="text-muted">Tarras & Luggate route</span>
            </div>
            <div className="bg-cream rounded-xl px-6 py-3">
              <span className="font-bold text-burgundy block">That Tree</span>
              <span className="text-muted">NZ&apos;s most photographed</span>
            </div>
            <div className="bg-cream rounded-xl px-6 py-3">
              <span className="font-bold text-burgundy block">Roy&apos;s Peak</span>
              <span className="text-muted">Best views in NZ</span>
            </div>
          </div>
        </div>
      </section>

      {/* Drive callout */}
      <section className="py-16 px-5 bg-burgundy text-white">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-3xl mb-4">
            The Drive: High Country & Blue Water
          </h2>
          <p className="text-white/90 text-lg leading-8">
            Head north from Cromwell on SH8 through the wide-open Tarras flats
            and into the Luggate gorge, where the Clutha River turns brilliant
            turquoise. The route passes through some of Central Otago&apos;s most
            beautiful sheep-farming country before Lake Wanaka appears on the
            horizon. No traffic lights, no stress.
          </p>
        </div>
      </section>

      {/* Activities */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">
            Top Things to Do in Wanaka
          </h2>
          <p className="text-center text-muted text-lg mb-12">
            From iconic photo stops to full-day alpine adventures
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activities.map((a) => (
              <div key={a.title} className="bg-white rounded-2xl p-6 shadow-md">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display text-lg text-burgundy">{a.title}</h3>
                </div>
                <span className="text-xs bg-cream text-burgundy px-2 py-1 rounded-full font-semibold inline-block mb-3">
                  {a.time}
                </span>
                <p className="text-muted text-sm leading-6">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Suggested Itinerary */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">
            Suggested Day Itinerary
          </h2>
          <p className="text-center text-muted mb-12">
            A perfect day from Lakeside Retreat to Wanaka and back
          </p>
          <div className="space-y-4">
            {itinerary.map((step, i) => (
              <div
                key={step.time}
                className={`rounded-xl p-5 flex gap-5 items-start ${
                  i === 0 || i === itinerary.length - 1
                    ? "bg-burgundy text-white"
                    : "bg-cream"
                }`}
              >
                <div className={`text-sm font-bold shrink-0 w-[60px] ${i === 0 || i === itinerary.length - 1 ? "text-white/90" : "text-burgundy"}`}>
                  {step.time}
                </div>
                <div>
                  <p className={`font-semibold ${i === 0 || i === itinerary.length - 1 ? "text-white" : "text-body"}`}>
                    {step.label}
                  </p>
                  <p className={`text-sm mt-0.5 ${i === 0 || i === itinerary.length - 1 ? "text-white/80" : "text-muted"}`}>
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-muted text-sm mt-8">
            Combining Wanaka and Queenstown in one day? It&apos;s doable via the Crown Range (scenic) or Cardrona Valley — allow extra time.
          </p>
        </div>
      </section>

      {/* Practical Tips */}
      <section className="py-20 px-5">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">Practical Tips</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: "Roy's Peak: Go Early", desc: "In summer (Dec–Feb) Roy's Peak can get crowded by mid-morning and the track gets hot. Aim to start before 9am for the best experience." },
              { title: "Rippon Vineyard Hours", desc: "Rippon is open seasonally for cellar door tastings — typically Feb–Apr and Sep–Nov. Check their website before visiting as hours vary." },
              { title: "That Tree Parking", desc: "Park on Lakeside Road near the town centre — it's a short walk to the tree. The tree is on the lake edge and easy to find." },
              { title: "Cardrona Valley Return", desc: "On the way back, take the Cardrona Valley Road to see the historic Cardrona Hotel (1863), alpine scenery, and the ski field turn-off. Rejoins SH6 near Queenstown or loops back to Cromwell." },
            ].map((tip) => (
              <div key={tip.title} className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-display text-xl text-burgundy mb-2">{tip.title}</h3>
                <p className="text-muted text-sm leading-6">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Return callout */}
      <section className="py-16 px-5 bg-cream">
        <div className="max-w-[700px] mx-auto text-center">
          <p className="font-display text-3xl mb-3">
            Then Home to Your Lakeside Retreat 🌙
          </p>
          <p className="text-muted text-lg leading-8">
            After a day out, the drive back through the high country feels
            effortless. Pull in to Lakeside Retreat, pour a glass of Central Otago
            Pinot Noir, and ease into the private outdoor spa as the stars emerge
            over the Pisa Range. There&apos;s no better way to end a Wanaka day.
          </p>
        </div>
      </section>

      {/* Where to Stay */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">Your Central Otago Base</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { href: "/dome-pinot", image: "/images/Pinotfront.jpeg", title: "Dome Pinot", badge: "Adults Only", price: "From $530/night", note: "Private spa, skylight, breakfast included" },
              { href: "/dome-rose", image: "/images/dome-rose-spa1.jpeg", title: "Dome Ros\u00e9", badge: "Adults Only", price: "From $510/night", note: "Private spa, vineyard views, full kitchen" },
              { href: "/lakeside-cottage", image: "/images/lakeside-cottage-exterior.jpeg", title: "Lakeside Cottage", badge: "Pet & Family Friendly", price: "From $295/night", note: "2 bedrooms, lake access, dogs welcome" },
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
              { href: "/weekend-getaway-queenstown", title: "Queenstown Day Trip", desc: "Bungy, gondola, jet boat — 45 min in the other direction" },
              { href: "/cromwell-activities", title: "Cromwell & Lake Dunstan", desc: "Activities right from your door — kayaks, cycle trails, wineries" },
              { href: "/central-otago-wine-trail", title: "Central Otago Wine Trail", desc: "30+ cellar doors within 15 minutes of the retreat" },
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
          <h2 className="font-display text-4xl mb-4">Book Your Central Otago Base</h2>
          <p className="text-lg text-muted mb-8">
            Wanaka, Queenstown, and wine country — all within 45 minutes.
            Luxury domes from $510 &bull; Cottage from $295/night.
          </p>
          <Button href="/book">Check Availability & Book</Button>
        </div>
      </section>
    </>
  );
}
