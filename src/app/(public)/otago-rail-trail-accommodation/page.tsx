import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createArticleSchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Otago Rail Trail Accommodation | Luxury Stay 300m from the Trail",
  description:
    "Luxury accommodation for Otago Rail Trail cyclists — just 300m from the trail at Cromwell. Geodesic domes with private spas and a lakeside cottage. $365/night.",

  alternates: { canonical: "/otago-rail-trail-accommodation" },
  openGraph: {
    title: "Otago Rail Trail Accommodation | Luxury Stay 300m from the Trail",
    description: "Luxury accommodation for Otago Rail Trail cyclists — just 300m from the trail at Cromwell. Geodesic domes with private spas and a lakeside cottage. $365/night.",
    url: "https://lakesideretreat.co.nz/otago-rail-trail-accommodation",
    images: [
      {
        url: "/images/lakeside-cottage-exterior.jpeg",
        width: 1200,
        height: 800,
        alt: "Otago Rail Trail accommodation — Lakeside Cottage 300m from the trailhead",
      },
    ],
    type: "article",
  },
};

const trailSections = [
  {
    name: "Cromwell to Clyde (17km)",
    description: "Flat and accessible, this section follows the shores of Lake Dunstan through rocky gorges. Perfect for beginners. Starts 300m from Lakeside Retreat.",
    duration: "2–3 hours",
    difficulty: "Easy",
  },
  {
    name: "Clyde to Alexandra (11km)",
    description: "A short, flat section through the Clutha Valley past orchards and the historic Clyde Dam. Easy riding with lovely river scenery.",
    duration: "1.5–2 hours",
    difficulty: "Easy",
  },
  {
    name: "Alexandra to Omakau (29km)",
    description: "The landscape opens up to high schist tors, rolling farmland, and wide Central Otago skies. Passes through the historic township of Chatto Creek.",
    duration: "3–4 hours",
    difficulty: "Easy–Moderate",
  },
  {
    name: "Omakau to Ranfurly (38km)",
    description: "Enter the Maniototo plains — the most remote and dramatic section of the trail. Long flat stretches and incredible dark skies at night.",
    duration: "4–5 hours",
    difficulty: "Moderate",
  },
];

const whyStayHere = [
  { title: "300m from the Trail", desc: "Walk from your accommodation to the Otago Rail Trail in 5 minutes. No car needed to access the Cromwell trailhead." },
  { title: "Bike Storage & Wash", desc: "Secure covered bike storage and a hose-down area available for all guests." },
  { title: "Early Breakfast", desc: "Continental breakfast included with dome bookings, stocked ready for an early start. Pack what you need for the trail." },
  { title: "Laundry Facilities", desc: "Wash and dry your cycling gear overnight. Arrive fresh for each day on the trail." },
  { title: "Shuttles & Hire", desc: "We can help organise bike hire, shuttle pickups, and luggage transfers for multi-day trail itineraries." },
  { title: "Recovery Spa or Hot Tub", desc: "Private saltwater spa in the domes, or a wood-fired cedar hot tub at the cottage. Nothing better after a long day in the saddle." },
];

export default function OtagoRailTrailAccommodationPage() {
  return (
    <>
      <JsonLd data={[
        createArticleSchema({
          title: "Otago Rail Trail Accommodation | Luxury Stay 300m from the Trail",
          description: "Luxury accommodation for Otago Rail Trail cyclists — geodesic domes and lakeside cottage just 300m from the Cromwell trailhead.",
          path: "/otago-rail-trail-accommodation",
          image: "vineyard-path.jpg",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Otago Rail Trail Accommodation", path: "/otago-rail-trail-accommodation" },
        ]),
        createFaqSchema([
          { question: "What is the best accommodation for the Otago Rail Trail?", answer: "Lakeside Retreat at Mount Pisa is perfectly located for the Otago Rail Trail — just 300m from the Cromwell trailhead. Cyclists stay in luxury geodesic domes or a lakeside cottage, with bike storage, early breakfast, laundry facilities, and a private outdoor spa for post-ride recovery. $365/night." },
          { question: "Where does the Otago Rail Trail start?", answer: "The Otago Rail Trail runs between Clyde and Middlemarch (150km). The Cromwell to Clyde section is the most popular starting point and is just 300 metres from Lakeside Retreat. Cromwell is approximately 45 minutes from Queenstown." },
          { question: "How many days does the Otago Rail Trail take?", answer: "The full Otago Rail Trail takes 4–5 days to complete at a relaxed pace. Many cyclists do just the Cromwell to Clyde section (2–3 hours) as a day ride. Lakeside Retreat is ideal as a base for the first 1–2 days or as the final night before completing the trail." },
          { question: "Is the Otago Rail Trail suitable for beginners?", answer: "Yes — the Otago Rail Trail is graded as an easy to moderate ride with most sections being flat or gently undulating on a well-maintained gravel surface. The Cromwell to Clyde section is completely flat and follows Lake Dunstan — ideal for first-time trail riders." },
        ]),
      ]} />

      {/* Hero */}
      <section className="relative min-h-[65vh] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/images/vineyard-path.jpg"
          alt="Otago Rail Trail cycling path through Central Otago wine country"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-[750px] px-5 pt-20">
          <h1 className="font-display text-5xl md:text-6xl text-white mb-4 drop-shadow-lg">
            Otago Rail Trail Accommodation
          </h1>
          <p className="text-xl mb-8 opacity-95">
            Luxury stay just 300 metres from the trail at Cromwell.
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
          <li className="text-muted">Otago Rail Trail Accommodation</li>
        </ol>
      </nav>

      {/* Distance callout */}
      <section className="py-16 px-5 bg-burgundy text-white text-center">
        <div className="max-w-[800px] mx-auto">
          <p className="font-display text-3xl mb-2">
            &#128690; Just 300 Metres from the Otago Rail Trail Trailhead
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
            New Zealand&apos;s Original Great Ride
          </h2>
          <p className="text-lg leading-8 text-muted mb-6">
            The Otago Central Rail Trail follows the historic Central Otago railway line between
            Clyde and Middlemarch (150km). One of New Zealand&apos;s original Great Rides, it passes
            through spectacular Central Otago scenery: schist tors, river gorges, old tunnel and
            viaduct crossings, and the wide open Maniototo plains.
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
          <h2 className="font-display text-4xl text-center mb-12">Trail Sections at a Glance</h2>
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
                price: "$635/night",
                notes: "Private spa, stargazing skylight, breakfast included",
              },
              {
                href: "/dome-rose",
                image: "/images/dome-rose-spa1.jpeg",
                title: "Dome Ros\u00e9",
                badge: "Adults Only",
                price: "$615/night",
                notes: "Private spa, vineyard views, kitchenette",
              },
              {
                href: "/lakeside-cottage",
                image: "/images/lakeside-cottage-exterior.jpeg",
                title: "Lakeside Cottage",
                badge: "Adults-Only · Pet Friendly",
                price: "$365/night",
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
          <h2 className="font-display text-4xl mb-4">Book Your Rail Trail Base</h2>
          <p className="text-lg text-muted mb-8">
            300m to the trailhead. Spa or hot tub for post-ride recovery.
            Luxury domes and lakeside cottage available.
          </p>
          <Button href="/book">Check Availability & Book</Button>
        </div>
      </section>
    </>
  );
}
