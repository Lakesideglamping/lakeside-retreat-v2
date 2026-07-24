import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createArticleSchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Central Otago Cycle Trails Accommodation | Luxury Stay 200m from the Trail",
  description:
    "Luxury accommodation for Central Otago Cycle Trails cyclists — just 200m from the Lake Dunstan Trail at Cromwell. Geodesic domes with private spas and a lakeside cottage. $350/night.",

  alternates: { canonical: "/otago-rail-trail-accommodation" },
  openGraph: {
    title: "Central Otago Cycle Trails Accommodation | Luxury Stay 200m from the Trail",
    description: "Luxury accommodation for Central Otago Cycle Trails cyclists — just 200m from the Lake Dunstan Trail at Cromwell. Geodesic domes with private spas and a lakeside cottage. $350/night.",
    url: "https://lakesideretreat.co.nz/otago-rail-trail-accommodation",
    images: [
      {
        url: "/images/LakeDunstanCycleTrail.jpeg",
        width: 1200,
        height: 800,
        alt: "Central Otago Cycle Trails accommodation — Lakeside Cottage 200m from the Lake Dunstan Trail trailhead",
      },
    ],
    type: "article",
  },
};

const trailSections = [
  {
    name: "The Lake DunstanTrail (55km)",
    description: "Starts 200m from Lakeside Retreat, the trail runs along Lake Dunstan, the Kawarau River, and the Clutha River, linking Cromwell and Clyde. It's one of the most accessible cycle trail, the section from Smiths Way to Cromwell Heritage Precinct (16km, Grade 1) is a popular day ride, winding alongside Lake Dunstan via Pisa Moorings with plenty of spots to rest beside the lake. Beyond Cromwell, the first section through to Carrick Winery and Cornish Point is mostly easy Grade 2 riding, while beyond Cornish Point it becomes more challenging with narrow sections and exposed cliff faces.",
    duration: "2–3 hours",
    difficulty: "(Grade 1–3) Easy",
  },
  {
    name: "The Kawarau Gorge Trail (42km)",
    description: "Opens in Sept 2026 The Kawarau Gorge Trail is NZ's newest Great Ride.  The trail connects Cromwell to Gibbston Valley on a spectacular journey alongside the Kawarau River. Starting in Cromwell - Central Otago wine country, the trail enters into a dramatic and remote gorge, a place few have experienced until now.",
    duration: "2–3 hours",
    difficulty: "(Grade 1–3) Easy",
  },
  {
    name: "Bannockburn Sluicings Loop (3.5km)",
    description: "A favourite for Cromwell mountain bikers. The 3.5km loop  winds around the former Bannockburn goldfield, where you'll see remains of dams, water races, tunnels and towering cliff faces — all that's left of hills sluiced away during the gold rush. Also reachable via the Lake Dunstan Trail.",
    duration: "1.5–2 hours",
    difficulty: "(Grade 2–3) Easy–Moderate",
  },
  {
    name: "Clyde to Alexandra (11km)",
    description: "A short, flat section through the Clutha Valley past orchards and the historic Clyde Dam. Easy riding with lovely river scenery.",
    duration: "1.5–2 hours",
    difficulty: "(Grade 1–2) Easy",
  },
  {
    name: "Otago Central Rail Trail (152km)",
    description: "The original Great Ride, following the old railway line between Clyde and Middlemarch. The classic experience is to ride it over several days, but the trail can easily be broken into shorter rides, with highlights including spectacular railway bridges and tunnels, abandoned gold diggings, and historic architecture. The Clyde end is the natural starting point from Cromwell.",
    duration: "1–5 days",
    difficulty: "(Grade 1–2) Easy",
  },
  {
    name: "Roxburgh Gorge Trail  (34km)",
    description: "The Trail starts from the Lake Roxburgh Dam to Clyde (21km), with a jet boat ride in the middle on the Clutha Mata-Au River (13km). The trail is a breathtaking journey through some of Central Otago's most remote and dramatic landscapes. The track follows the Clutha River and Lake Roxburgh, flanked by steep rugged cliffs, and passes historic gold mining sites. Bookings for the jet boat transfer are essential.",
    duration: "1 day",
    difficulty: "(Grade 1–2) Easy",
  },
  {
    name: "Clutha Gold Trail (135km)",
    description: "This trail showcases the rich history of the Central Otago and Clutha regions, following the path once traversed by gold miners during the 19th-century gold rush. Walkers and cyclists can immerse themselves in the picturesque landscapes, including rolling hills, lush woodlands, and the mesmerizing colours of the Clutha River..",
    duration: "2–4 days",
    difficulty: "(Grade 1–2) Easy",
  },
];

const whyStayHere = [
  { title: "200m from the Trail", desc: "Walk from your accommodation to the Lake Dunstan Cycle Trail in 2 minutes. No car needed to access the Cromwell trailhead." },
  { title: "Bike Storage & Wash", desc: "Secure covered bike storage and a hose-down area available for all guests." },
  { title: "Early Breakfast", desc: "Continental breakfast included with dome bookings, stocked ready for an early start. Pack what you need for the trail." },
  { title: "Laundry Facilities", desc: "Avaialbe in the Lakeside Cottage - Wash and dry your cycling gear overnight. Arrive fresh for each day on the trail." },
  { title: "Shuttles & Hire", desc: "We can provide information about bike hire, shuttle pickups, and luggage transfers for multi-day trail itineraries." },
  { title: "Recovery Spa or Hot Tub", desc: "Private saltwater spa in the domes, or a wood-fired cedar hot tub at the cottage. Nothing better after a long day in the saddle." },
];

export default function OtagoRailTrailAccommodationPage() {
  return (
    <>
      <JsonLd data={[
        createArticleSchema({
          title: "Otago Cycle Trails Accommodation | Luxury Stay 200m from the Trail",
          description: "Luxury accommodation for Central Otago Trail cyclists — geodesic domes and lakeside cottage just 200m from the Cromwell trailhead.",
          path: "/otago-rail-trail-accommodation",
          image: "LakeDunstanCycleTrail.jpeg",
          datePublished: "2026-05-15",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Otago Cycle Trails Accommodation", path: "/otago-cycle-trail-accommodation" },
        ]),
        createFaqSchema([
          { question: "What is the best accommodation for the Otago Cycle Trails?", answer: "Lakeside Retreat at Mount Pisa is perfectly located for the Lake Dunstan Trail — just 200m from the trailhead. Cyclists stay in luxury geodesic domes or a lakeside cottage, with bike storage, early breakfast, laundry facilities, and a private outdoor spa for post-ride recovery. $350/night." },
          { question: "Where does the Lake Dustan Cycle Trail start?", answer: "The Lake Dustan Cycle Trail runs between Clyde and Cromwell (55km). The Cromwell to Clyde section is the most popular starting point and is just 200 metres from Lakeside Retreat." },
          { question: "How many days does the Otago Rail Trail take?", answer: "The full Otago Rail Trail takes 4–5 days to complete at a relaxed pace. Many cyclists do just the Cromwell to Clyde section (2–3 hours) as a day ride. Lakeside Retreat is ideal as a base for the first 1–2 days or as the final night before completing the trail." },
          { question: "Is the Central Otago Cycle Trails suitable for beginners?", answer: "Yes — the Central Otago Cycle Trails is graded as an easy to moderate ride with most sections being flat or gently undulating on a well-maintained gravel surface. The Cromwell to Clyde section is grade 1-2 and follows Lake Dunstan — ideal for first-time trail riders." },
        ]),
      ]} />

      {/* Hero */}
      <section className="relative min-h-[65vh] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/images/LakeDunstanCycleTrail.jpeg"
          alt="Central Otago Cycle Trails cycling through Central Otago wine country"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-[750px] px-5 pt-20">
          <h1 className="font-display text-5xl md:text-6xl text-white mb-4 drop-shadow-lg">
          Central Otago Cycle Trails Accommodation
          </h1>
          <p className="text-xl mb-8 opacity-95">
            Luxury stay just 200 metres from the Lake Dunstan trail at Cromwell.
            Saltwater spas in the domes, wood-fired hot tub at the cottage.
          </p>
          <Button href="/book">Book Your Trail Stay</Button>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200">
        <ol className="flex items-center gap-2 px-5 py-3 text-sm max-w-[1200px] mx-auto">
          <li><Link href="/" className="text-burgundy no-underline hover:underline">Home</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li className="text-muted">Central Otago Cycle Trails Accommodation</li>
        </ol>
      </nav>

      {/* Distance callout */}
      <section className="py-16 px-5 bg-burgundy text-white text-center">
        <div className="max-w-[800px] mx-auto">
          <p className="font-display text-3xl mb-2">
            &#128690; Just 200 Metres from the Otago Rail Trail Trailhead
          </p>
          <p className="text-white/90 text-lg">
            Walk to the trail from your accommodation. No car, no shuttle, no hassle.
          </p>
        </div>
      </section>

      {/* About the trail */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-6">
            New Zealand&apos;s Otago Great Rides
          </h2>
          <p className="text-lg leading-8 text-muted mb-6">
          The Otago Cycle Trails cater to cyclists of all levels, with well-maintained paths and support services, including bike hire, accommodation, and shuttle services. Whether you&apos;re a leisure cyclist seeking a scenic escape or a seasoned adventurer, the Otago Trails promise an unforgettable two-wheeled adventure through the heart of the lower South Island&apos;s stunning landscapes and rich history.
          </p>
          <p className="text-lg leading-8 text-muted">
            The most popular and accessible section is Cromwell to Clyde (17km, 2–3 hours),
            which runs directly past Lakeside Retreat. Flat, well-graded gravel, and suitable
            for cyclists of all fitness levels.
          </p>
        </div>
      </section>

      {/* Trail Sections */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">Central Otago Great Ride at a Glance</h2>
          <div className="space-y-4">
            {trailSections.map((section, i) => (
              <div key={section.name} className={`rounded-xl p-6 ${i === 0 ? "bg-burgundy text-white" : "bg-cream"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <h3 className={`font-semibold ${i === 0 ? "text-white" : "text-body"}`}>
                    {i === 0 && "★ "}{section.name}
                    {i === 0 && <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">Starts near Lakeside Retreat</span>}
                  </h3>
                  <div className="flex gap-3 text-sm">
                    <span className={`font-semibold ${i === 0 ? "text-white/90" : "text-burgundy"}`}>{section.duration}</span>
                    <span className={`${i === 0 ? "text-white/90" : "text-muted"}`}>{section.difficulty}</span>
                  </div>
                </div>
                <p className={`text-sm leading-6 ${i === 0 ? "text-white/85" : "text-muted"}`}>{section.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Stay */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">
            Why Cyclists Choose Lakeside Retreat
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyStayHere.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 shadow-md">
                <h3 className="font-display text-xl text-burgundy mb-2">{item.title}</h3>
                <p className="text-muted text-sm leading-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accommodation Options */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">Choose Your Trail Base</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                href: "/dome-pinot",
                image: "/images/Pinotfront.jpeg",
                title: "Dome Pinot",
                badge: "Adults Only",
                price: "$650/night",
                notes: "Private spa, stargazing skylight, breakfast included",
              },
              {
                href: "/dome-rose",
                image: "/images/dome-rose-spa1.jpeg",
                title: "Dome Ros\u00e9",
                badge: "Adults Only",
                price: "$599/night",
                notes: "Private spa, vineyard views, kitchenette",
              },
              {
                href: "/lakeside-cottage",
                image: "/images/lakeside-cottage-exterior.jpeg",
                title: "Lakeside Cottage",
                badge: "Adults-Only · Pet Friendly",
                price: "$350/night",
                notes: "Queen + sofa bed, sleeps 3, wood-fired hot tub, direct lake access",
              },
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
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-display text-lg text-burgundy">{acc.title}</h3>
                    <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-semibold shrink-0">{acc.badge}</span>
                  </div>
                  <p className="text-burgundy font-semibold text-sm mb-1">{acc.price}</p>
                  <p className="text-muted text-xs">{acc.notes}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Related Guides */}
      <section className="py-16 px-5 bg-cream">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-2xl text-center mb-8">Also Explore</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { href: "/glamping-central-otago", title: "Glamping Central Otago", desc: "Reward yourself with a luxury dome after the ride" },
              { href: "/winter-glamping-central-otago", title: "Winter Rail Trail", desc: "Ride in winter — return to your private spa each evening" },
              { href: "/dog-friendly-accommodation-central-otago", title: "Dog-Friendly Accommodation", desc: "Bring your dog on the trail — cottage welcomes pets" },
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
          <h2 className="font-display text-4xl mb-4">Book Your Cycle Trail Base</h2>
          <p className="text-lg text-muted mb-8">
            200m to the trailhead. Spa or hot tub for post-ride recovery.
            Luxury domes and lakeside cottage available.
          </p>
          <Button href="/book">Check Availability & Book</Button>
        </div>
      </section>
    </>
  );
}
