import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createArticleSchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Glamping Central Otago | Luxury Geodesic Domes on Lake Dunstan",
  description:
    "Central Otago's premier glamping experience. Two luxury geodesic domes with private outdoor spas, stargazing skylights, vineyard views, and continental breakfast. From $599/night.",
  alternates: { canonical: "/glamping-central-otago" },
  openGraph: {
    title: "Glamping Central Otago | Luxury Geodesic Domes on Lake Dunstan",
    description:
      "Luxury geodesic domes with private saltwater spas, stargazing skylights, and vineyard views on Lake Dunstan. Adults-only glamping — from $599/night.",
    url: "https://lakesideretreat.co.nz/glamping-central-otago",
    images: [
      {
        url: "/images/domes-vineyard-sunset.jpg",
        width: 1200,
        height: 800,
        alt: "Luxury geodesic glamping dome with outdoor spa on Lake Dunstan, Central Otago",
      },
    ],
    type: "article",
  },
};

const features = [
  {
    title: "Private Outdoor Spa",
    desc: "Each dome has its own saltwater outdoor spa with uninterrupted Lake Dunstan and mountain views. Perfect for sunrise soaks or stargazing at night.",
    image: "/images/SpaArialView.jpeg",
  },
  {
    title: "Stargazing Skylight",
    desc: "Dome Pinot features a panoramic skylight directly above the bed. With zero light pollution, the Milky Way is visible on clear nights — no telescope needed.",
    image: "/images/MilkyWay.jpg",
  },
  {
    title: "Vineyard & Lake Views",
    desc: "Wake up to panoramic views of Lake Dunstan, the Pisa Range, and Central Otago's famous vineyards. There are 30+ wineries within 15 minutes.",
    image: "/images/springview.jpeg",
  },
];

const comparisonPoints = [
  { feature: "Private outdoor spa", basic: false, lakeside: true },
  { feature: "Stargazing skylight", basic: false, lakeside: true },
  { feature: "Continental breakfast included", basic: false, lakeside: true },
  { feature: "Kitchenette", basic: false, lakeside: true },
  { feature: "Lake Dunstan views", basic: false, lakeside: true },
  { feature: "Otago Rail Trail access (300m)", basic: false, lakeside: true },
  { feature: "30+ wineries within 15 min", basic: false, lakeside: true },
  { feature: "Heated bathroom", basic: true, lakeside: true },
  { feature: "Super King size bed", basic: false, lakeside: true },
];

const domes = [
  {
    slug: "dome-pinot",
    name: "Dome Pinot",
    size: "50sqm",
    price: "$650/night",
    image: "/images/Pinotfront.jpeg",
    tagline: "Larger of the two domes with panoramic Lake Dunstan views, stargazing skylight, private saltwater spa, and continental breakfast included.",
    highlights: ["50sqm geodesic dome", "Stargazing skylight above bed", "Private saltwater outdoor spa", "Lake & Pisa Range views", "Kitchenette", "Continental breakfast"],
  },
  {
    slug: "dome-rose",
    name: "Dome Rosé",
    size: "40sqm",
    price: "$599/night",
    image: "/images/dome-rose-spa1.jpeg",
    tagline: "Intimate retreat with vineyard and mountain views, private outdoor spa, luxury super king bed, and outdoor dining deck.",
    highlights: ["40sqm geodesic dome", "Private saltwater outdoor spa", "Vineyard & mountain views", "Luxury super king bed", "Outdoor dining deck", "Kitchenette"],
  },
];

export default function GlampingCentralOtagoPage() {
  return (
    <>
      <JsonLd data={[
        createArticleSchema({
          title: "Glamping Central Otago | Luxury Geodesic Domes on Lake Dunstan",
          description: "Central Otago's premier glamping experience — luxury geodesic domes with private outdoor spas, stargazing skylights, and vineyard views.",
          path: "/glamping-central-otago",
          image: "IMG_8536.jpg",
          datePublished: "2025-02-01",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Glamping Central Otago", path: "/glamping-central-otago" },
        ]),
        createFaqSchema([
          { question: "What is glamping in Central Otago like?", answer: "Glamping in Central Otago combines luxury accommodation with stunning natural surroundings. At Lakeside Retreat, our geodesic domes offer private outdoor spas, stargazing skylights, panoramic Lake Dunstan views, and vineyard scenery — far more comfortable than traditional camping but deeply connected to the landscape." },
          { question: "How much does glamping in Central Otago cost?", answer: "Lakeside Retreat's luxury glamping domes start at $599/night (Dome Rosé) and $650/night (Dome Pinot), including continental breakfast. Our Lakeside Cottage is $350/night and sleeps up to 3 guests." },
          { question: "Where is the best glamping in New Zealand?", answer: "Central Otago is widely regarded as one of New Zealand's best glamping regions thanks to its dramatic landscapes, world-class wineries, and dark skies. Lakeside Retreat on Lake Dunstan offers a combination of private spas, stargazing, vineyard access, and the Otago Rail Trail — making it one of NZ's top-rated glamping experiences." },
          { question: "Is glamping suitable for couples?", answer: "Absolutely. Both of our glamping domes are adults-only and designed specifically for couples — private outdoor spas, stargazing skylights, premium bedding, and complete seclusion. Many guests use Lakeside Retreat for anniversary trips, honeymoons, and romantic getaways." },
        ]),
      ]} />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/images/IMG_8536.jpg"
          alt="Luxury glamping dome at Lakeside Retreat overlooking Lake Dunstan, Central Otago"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative max-w-[750px] px-5 pt-20">
          <h1 className="font-display text-5xl md:text-6xl text-white mb-4 drop-shadow-lg">
            Glamping Central Otago
          </h1>
          <p className="text-xl mb-8 opacity-95">
            Luxury geodesic domes with private outdoor spas, stargazing skylights,
            and Lake Dunstan views — New Zealand&apos;s most scenic glamping experience
          </p>
          <Button href="/book">Book Your Glamping Stay</Button>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200">
        <ol className="flex items-center gap-2 px-5 py-3 text-sm max-w-[1200px] mx-auto">
          <li><Link href="/" className="text-burgundy no-underline hover:underline">Home</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li className="text-muted">Glamping Central Otago</li>
        </ol>
      </nav>

      {/* Intro */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-6">
            Central Otago&apos;s Premier Glamping Experience
          </h2>
          <p className="text-lg leading-8 text-muted mb-6">
            Forget basic tents and shared facilities. Glamping at Lakeside Retreat means sleeping
            in a 50sqm luxury geodesic dome with a private outdoor saltwater spa, a panoramic
            stargazing skylight, and uninterrupted views across Lake Dunstan toward the Pisa Range.
          </p>
          <p className="text-lg leading-8 text-muted">
            Located at 96 Smiths Way, Mount Pisa — in the heart of Central Otago wine country,
            300 metres from the{" "}
            <Link href="/otago-rail-trail-accommodation" className="text-burgundy no-underline hover:underline">Otago Rail Trail</Link>
            , and 45 minutes from Queenstown. Rated
            4.9/5 by 416 guests across Airbnb and Booking.com.
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">
            What Makes Our Glamping Unique
          </h2>
          <p className="text-center text-muted text-lg mb-12">
            Every detail designed for an unforgettable Central Otago experience
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-cream rounded-2xl overflow-hidden shadow-md">
                <div className="relative h-[220px]">
                  <Image src={f.image} alt={f.title} fill className="object-cover" sizes="33vw" />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl text-burgundy mb-3">{f.title}</h3>
                  <p className="text-muted text-sm leading-6">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Domes */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-4">
            <span className="bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
              Strictly Adults Only — Couples &amp; Honeymooners
            </span>
          </div>
          <h2 className="font-display text-4xl text-center mb-12 mt-4">
            Choose Your Glamping Dome
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            {domes.map((dome) => (
              <div key={dome.slug} className="bg-white rounded-2xl overflow-hidden shadow-lg">
                <Link href={`/${dome.slug}`} className="block relative h-[280px]">
                  <Image
                    src={dome.image}
                    alt={`${dome.name} luxury glamping dome, Central Otago`}
                    fill
                    className="object-cover"
                    sizes="50vw"
                  />
                </Link>
                <div className="p-8">
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-display text-2xl text-burgundy">{dome.name}</h3>
                    <span className="text-sm text-muted">{dome.size}</span>
                  </div>
                  <p className="text-burgundy font-semibold text-lg mb-4">{dome.price}</p>
                  <p className="text-muted text-sm leading-6 mb-5">{dome.tagline}</p>
                  <ul className="space-y-2 mb-6">
                    {dome.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-body border-b border-gray-100 pb-2">
                        <span className="text-burgundy font-bold">&#10003;</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                  <Button href={`/book?a=${dome.slug}`} className="w-full text-center">
                    Book {dome.name} &rarr;
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">
            Glamping vs Camping: What You Get
          </h2>
          <p className="text-center text-muted text-lg mb-10">
            Lakeside Retreat glamping means all the nature, none of the roughing it
          </p>
          <div className="bg-cream rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-burgundy text-white text-sm font-semibold px-4 py-3">
              <span>Feature</span>
              <span className="text-center">Basic Glamping</span>
              <span className="text-center">Lakeside Retreat</span>
            </div>
            {comparisonPoints.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 px-4 py-3 text-sm ${i % 2 === 0 ? "bg-white" : "bg-cream"}`}
              >
                <span className="text-body">{row.feature}</span>
                <span className="text-center">{row.basic ? <span className="text-burgundy">&#10003;</span> : <span className="text-red-400">&#215;</span>}</span>
                <span className="text-center"><span className="text-burgundy font-bold">&#10003;</span></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-6">
            The Best Location for Glamping in New Zealand
          </h2>
          <p className="text-lg leading-8 text-muted mb-8">
            Central Otago offers some of New Zealand&apos;s most dramatic scenery: snow-capped
            mountains, turquoise lakes, ancient schist gorges, and golden vineyards. Our
            location at Mount Pisa puts you at the centre of it all.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Queenstown", time: "45 min" },
              { label: "Wanaka", time: "30 min" },
              { label: "Nearest Winery", time: "5 min" },
              { label: "Otago Rail Trail", time: "300m walk" },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-5 text-center shadow-sm">
                <div className="font-bold text-burgundy text-xl">{item.time}</div>
                <div className="text-sm text-muted">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">
            Glamping FAQs
          </h2>
          <div className="space-y-6">
            {[
              { q: "Do I need to bring my own bedding?", a: "No — both domes come fully equipped with premium bedding, pillows, and towels. Continental breakfast provisions are stocked in the kitchenette. You just arrive and relax." },
              { q: "Is the glamping heated for winter stays?", a: "Yes. Both domes have a heat pump, a fully insulated geodesic structure, and a heated bathroom. Winter stays are particularly magical with snow on the Pisa Range visible from your spa." },
              { q: "Can I see the Milky Way from the glamping domes?", a: "Yes — on clear nights the Milky Way is spectacularly visible. Dome Pinot has a panoramic skylight directly above the bed. There's minimal light pollution at our rural Mount Pisa location, making it one of the best stargazing spots in Central Otago." },
              { q: "Is there Wi-Fi at the glamping site?", a: "Yes, both domes and the cottage have fast Wi-Fi. However, many guests find they naturally disconnect and enjoy the peace and quiet of the location." },
            ].map((item) => (
              <div key={item.q} className="bg-cream rounded-xl p-6">
                <h3 className="font-semibold text-body mb-2">{item.q}</h3>
                <p className="text-muted text-sm leading-6">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="text-yellow-500 text-3xl mb-4" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <blockquote className="font-display text-2xl text-burgundy italic mb-4">
            &ldquo;The most magical place we&apos;ve ever stayed. Woke up to the Milky Way through the skylight, soaked in the spa with vineyard views. Nothing compares.&rdquo;
          </blockquote>
          <p className="text-muted text-sm">Sarah &amp; James — Auckland &bull; Dome Pinot</p>
        </div>
      </section>

      {/* Related Guides */}
      <section className="py-16 px-5 bg-cream">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-2xl text-center mb-8">Also Explore</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { href: "/winter-glamping-central-otago", title: "Winter Glamping Guide", desc: "Heated domes, outdoor spas in the snow & ski fields nearby" },
              { href: "/otago-rail-trail-accommodation", title: "Otago Rail Trail Stays", desc: "300m from the Cromwell trailhead — the perfect trail base" },
              { href: "/luxury-accommodation-cromwell", title: "Luxury Accommodation Cromwell", desc: "Compare all three of our Central Otago properties" },
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
      <section className="py-20 px-5 bg-white text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">Book Your Central Otago Glamping Stay</h2>
          <p className="text-lg text-muted mb-8">
            Book direct for the best rates. Continental breakfast included. Strictly adults only.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/book?a=dome-pinot">Book Dome Pinot</Button>
            <Button href="/book?a=dome-rose">Book Dome Ros&eacute;</Button>
          </div>
          <p className="text-sm text-muted mt-6">
            Questions? <Link href="/contact" className="text-burgundy no-underline hover:underline">Contact Stephen &amp; Sandy</Link>
          </p>
        </div>
      </section>
    </>
  );
}
