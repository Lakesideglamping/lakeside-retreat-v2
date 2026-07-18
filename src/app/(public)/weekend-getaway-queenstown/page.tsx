import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/hero-background";
import { JsonLd, createArticleSchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Queenstown Day Trip from Cromwell | Adventure Guide from Lakeside Retreat",
  description:
    "Queenstown is just 45 minutes from Lakeside Retreat. Day trip guide: bungee jumping, Skyline Gondola, Shotover Jet, Arrowtown, and more — then return to your spa or wood-fired hot tub.",

  alternates: { canonical: "/weekend-getaway-queenstown" },
  openGraph: {
    title: "Queenstown Day Trip from Cromwell | Adventure Guide from Lakeside Retreat",
    description: "Queenstown is just 45 minutes from Lakeside Retreat. Day trip guide: bungee jumping, Skyline Gondola, Shotover Jet, Arrowtown, and more — then return to your spa or wood-fired hot tub.",
    url: "https://lakesideretreat.co.nz/weekend-getaway-queenstown",
    images: [
      {
        url: "/images/Queenstown.jpeg",
        width: 1200,
        height: 800,
        alt: "Weekend getaway from Queenstown — Lakeside Retreat, 45 minutes away",
      },
    ],
    type: "article",
  },
};

const activities = [
  {
    title: "Kawarau Bungy",
    time: "On the way",
    desc: "The world's first commercial bungy site. The iconic Kawarau Bridge is right on the route between Cromwell and Queenstown — stop en route for a jump or just to watch.",
  },
  {
    title: "Skyline Gondola & Luge",
    time: "Morning",
    desc: "Ride the gondola up Bob's Peak for panoramic views over Lake Wakatipu and the Remarkables. Luge runs, zip lines, and a great café at the top.",
  },
  {
    title: "Shotover Jet",
    time: "Morning / Afternoon",
    desc: "New Zealand's most famous jet boat ride. Hurtle through the narrow Shotover River canyon at 85km/h with 360° spins. Book ahead in peak season.",
  },
  {
    title: "Queenstown Gardens",
    time: "Afternoon",
    desc: "A peaceful escape on the Queenstown peninsula. Rose gardens, giant chess, frisbee golf, and beautiful lake and mountain views — free and dog-friendly.",
  },
  {
    title: "Arrowtown",
    time: "Afternoon",
    desc: "A 20-minute detour from Queenstown. The best-preserved gold rush town in NZ — gold panning, the Chinese settlement, great cafés and boutique shops.",
  },
  {
    title: "The Mall & Waterfront",
    time: "Afternoon / Evening",
    desc: "Browse Queenstown's vibrant town centre, lakefront restaurants, and bars. Fergburger (iconic NZ burger) often has a queue — arrive early or late.",
  },
];

const itinerary = [
  {
    time: "8:30am",
    label: "Depart Lakeside Retreat",
    detail: "45-min drive through Kawarau Gorge. Scenic and easy.",
  },
  {
    time: "9:00am",
    label: "Stop at Kawarau Bungy",
    detail: "Watch the jumpers (or take the leap). Allow 30–60 minutes.",
  },
  {
    time: "10:00am",
    label: "Arrive Queenstown — Skyline Gondola",
    detail: "Head straight up the gondola before the queues build. Views are best in the morning.",
  },
  {
    time: "12:00pm",
    label: "Lunch on the waterfront",
    detail: "Fergburger, Bespoke Kitchen, or a lakefront café. Plenty of options for all budgets.",
  },
  {
    time: "1:30pm",
    label: "Shotover Jet or Arrowtown",
    detail: "Choose your adventure: adrenaline on the river, or a leisurely afternoon in Arrowtown (20 min detour).",
  },
  {
    time: "3:30pm",
    label: "Stroll the Queenstown Gardens",
    detail: "Wind down with lake views, rose gardens, and a coffee before the drive back.",
  },
  {
    time: "5:00pm",
    label: "Return to Lakeside Retreat",
    detail: "Back in 45 minutes. Your private outdoor spa is waiting.",
  },
];

export default function WeekendGetawayPage() {
  return (
    <>
      <JsonLd data={[
        createArticleSchema({
          title: "Queenstown Day Trip from Lakeside Retreat — Adventure Guide",
          description: "Make the most of a day trip to Queenstown from your Central Otago base — bungee, gondola, jet boat, Arrowtown, and more, just 45 minutes away.",
          path: "/weekend-getaway-queenstown",
          image: "Queenstown.jpeg",
          datePublished: "2025-06-15",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: "Queenstown Day Trip", path: "/weekend-getaway-queenstown" },
        ]),
        createFaqSchema([
          { question: "How far is Queenstown from Cromwell?", answer: "Queenstown is approximately 45 minutes from Cromwell (and Lakeside Retreat) via State Highway 6 through the Kawarau Gorge. The drive is one of the most scenic in New Zealand, passing the Kawarau River and AJ Hackett bungy bridge." },
          { question: "What is there to do in Queenstown on a day trip?", answer: "On a day trip to Queenstown from Cromwell you can visit the Skyline Gondola, take the Shotover Jet, bungee jump at Kawarau Bridge, explore Arrowtown, walk the Queenstown Gardens, and enjoy the lakefront restaurants and bars. Most activities can be booked in advance online." },
          { question: "Is Kawarau Bungy on the way to Queenstown from Cromwell?", answer: "Yes — the AJ Hackett Kawarau Bridge Bungy is right on the route between Cromwell and Queenstown on State Highway 6. It's a convenient stop on the drive in, whether you're jumping or just watching." },
          { question: "Can I visit Arrowtown from Queenstown on a day trip?", answer: "Arrowtown is 20 minutes from central Queenstown and well worth including. It's New Zealand's best-preserved gold rush town with gold panning, historic Chinese settlement, boutique shops, and great cafés." },
        ]),
      ]} />

      {/* Hero */}
      <HeroBackground
        src="/images/Queenstown.jpeg"
        alt="Lake and mountains on the drive between Cromwell and Queenstown"
        minHeight="60vh"
        overlayOpacity={0.45}
      >
        <h1 className="font-display text-5xl text-white mb-4">
          Queenstown Day Trip
        </h1>
        <p className="text-xl opacity-95 max-w-[700px] mx-auto">
          Adventure awaits — just 45 minutes from Lakeside Retreat through
          the stunning Kawarau Gorge
        </p>
      </HeroBackground>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200">
        <ol className="flex items-center gap-2 px-5 py-3 text-sm max-w-[1200px] mx-auto">
          <li><Link href="/" className="text-burgundy no-underline hover:underline">Home</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li><Link href="/guides" className="text-burgundy no-underline hover:underline">Guides</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li className="text-muted">Queenstown Day Trip</li>
        </ol>
      </nav>

      {/* Intro */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-6">
            The Perfect Adventure Base
          </h2>
          <p className="text-lg leading-8 text-muted mb-6">
            Queenstown is New Zealand&apos;s adventure capital — bungee jumping, jet
            boats, gondolas, and world-class restaurants. From Lakeside Retreat
            you&apos;re just 45 minutes away, making it the ideal day trip. Go hard,
            then come home to your private outdoor spa and a glass of Central Otago
            Pinot Noir.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-cream rounded-xl px-6 py-3">
              <span className="font-bold text-burgundy block">45 min</span>
              <span className="text-muted">Drive to Queenstown</span>
            </div>
            <div className="bg-cream rounded-xl px-6 py-3">
              <span className="font-bold text-burgundy block">Kawarau Gorge</span>
              <span className="text-muted">Scenic route via SH6</span>
            </div>
            <div className="bg-cream rounded-xl px-6 py-3">
              <span className="font-bold text-burgundy block">Bungy on the way</span>
              <span className="text-muted">Kawarau Bridge stop</span>
            </div>
            <div className="bg-cream rounded-xl px-6 py-3">
              <span className="font-bold text-burgundy block">Free parking</span>
              <span className="text-muted">Start & end at the retreat</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Drive */}
      <section className="py-8 px-5 bg-burgundy text-white">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-3xl mb-4">
            A Scenic Drive You&apos;ll Love
          </h2>
          <p className="text-white/90 text-lg leading-8">
            The 45-minute drive from Cromwell passes through the spectacular
            Kawarau Gorge alongside the turquoise Kawarau River. The{" "}
            <strong>AJ Hackett Kawarau Bridge</strong> — where commercial bungy
            jumping began in 1988 — is right on the route. Stop and watch, or
            strap in for a jump. Continue to Queenstown through one of New
            Zealand&apos;s most dramatic landscapes.
          </p>
        </div>
      </section>

      {/* Top Activities */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">
            Top Things to Do in Queenstown
          </h2>
          <p className="text-center text-muted text-lg mb-12">
            From world-class adventure to relaxed sightseeing — one day is plenty to sample the highlights
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((a) => (
              <div key={a.title} className="bg-white rounded-2xl p-6 shadow-md">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display text-xl text-burgundy">{a.title}</h3>
                  <span className="text-xs bg-cream text-burgundy px-2 py-1 rounded-full font-semibold shrink-0 whitespace-nowrap">
                    {a.time}
                  </span>
                </div>
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
            A full day from Lakeside Retreat — make the most of every hour
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
            Prefer a slower pace? Skip the jet boat and spend longer in Arrowtown, or add a winery stop in Gibbston Valley on the way back.
          </p>
        </div>
      </section>

      {/* Practical Tips */}
      <section className="py-20 px-5">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">Practical Tips</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: "Book Activities in Advance", desc: "Shotover Jet and Skyline Gondola can sell out in peak season (Dec–Feb, Apr). Book online the evening before or at breakfast." },
              { title: "Arrive Early", desc: "Queenstown gets busy by mid-morning, especially in summer. Leaving Lakeside Retreat by 8:30am means you beat the tour buses and queues." },
              { title: "Queenstown Parking", desc: "Use the Lakeview car park (paid, 10-min walk to town) or Queenstown Events Centre (free, 15-min walk). Avoid central parking — it's limited and expensive." },
              { title: "Gibbston Valley Detour", desc: "On the return drive, detour into the Gibbston Valley for a winery stop. Peregrine and Gibbston Valley Winery are just off SH6 on the way back to Cromwell." },
            ].map((tip) => (
              <div key={tip.title} className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-display text-xl text-burgundy mb-2">{tip.title}</h3>
                <p className="text-muted text-sm leading-6">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Return to retreat CTA */}
      <section className="py-16 px-5 bg-cream">
        <div className="max-w-[700px] mx-auto text-center">
          <p className="font-display text-3xl mb-3">
            Then Return to the Lake
          </p>
          <p className="text-muted text-lg leading-8">
            After a full day of adventure, the 45-minute drive back to Lakeside
            Retreat feels like the best part. Change into your robe, sink into
            your saltwater spa or the wood-fired cedar tub, and watch the stars
            appear over the Pisa Range. That&apos;s the Central Otago way.
          </p>
        </div>
      </section>

      {/* Where to Stay */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">Your Queenstown Base</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { href: "/dome-pinot", image: "/images/Pinotfront.jpeg", title: "Dome Pinot", badge: "Adults Only", price: "$650/night", note: "Private spa, skylight, breakfast" },
              { href: "/dome-rose", image: "/images/dome-rose-spa1.jpeg", title: "Dome Ros\u00e9", badge: "Adults Only", price: "$599/night", note: "Private spa, vineyard views" },
              { href: "/lakeside-cottage", image: "/images/lakeside-cottage-exterior.jpeg", title: "Lakeside Cottage", badge: "Adults-Only · Pet Friendly", price: "$350/night", note: "Sleeps 3, wood-fired hot tub, lake access, dogs welcome" },
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
              { href: "/cromwell-activities", title: "Lake Dunstan Activities", desc: "Swimming, cycling & lakeside walks from your door" },
              { href: "/otago-rail-trail-accommodation", title: "Central Otago Cycle Trails", desc: "NZ's iconic Lake Dunstan cycle trail starts 200m away" },
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
            45 minutes to Queenstown. Spa or hot tub to return to. Wine country on your doorstep.
            Luxury domes from $599 &bull; Cottage $350/night.
          </p>
          <Button href="/book">Check Availability & Book</Button>
        </div>
      </section>
    </>
  );
}
