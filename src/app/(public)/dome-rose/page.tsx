import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createPropertySchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Dome Ros\u00e9 | Romantic Getaway Central Otago | $510/night",
  description:
    "Dome Ros\u00e9 — intimate 40sqm glamping dome perfect for couples in Cromwell, Central Otago. Outdoor spa, mountain views, vineyard setting on Lake Dunstan. Book direct from $510/night.",
  openGraph: {
    title: "Dome Rosé | Romantic Glamping Dome — Vineyard Views, Central Otago",
    description:
      "40sqm romantic dome with private outdoor spa, vineyard and mountain views. The perfect couples escape from $510/night in Central Otago wine country.",
    url: "https://lakesideretreat.co.nz/dome-rose",
    images: [
      {
        url: "/images/dome-rose-spa1.jpeg",
        width: 1200,
        height: 800,
        alt: "Dome Rosé private outdoor spa overlooking Central Otago vineyard at dusk",
      },
    ],
    type: "website",
  },
};

const features = [
  { title: "Vineyard Views", desc: "Wake up to rows of vines and mountain backdrops" },
  { title: "Private Outdoor Spa", desc: "Soak under the stars with a glass of local wine" },
  { title: "Romantic Setting", desc: "Intimate 40sqm space designed for couples" },
  { title: "Luxury Super King Bed", desc: "Premium bedding for restful nights" },
  { title: "Eco-Powered", desc: "100% renewable energy with backup power" },
  { title: "Wine Trail Access", desc: "30+ wineries within 20 minutes drive" },
];

const amenities = [
  { title: "Full Kitchenette", desc: "Induction cooktop, fridge, microwave, coffee machine" },
  { title: "Ensuite Bathroom", desc: "Rainfall shower with premium toiletries" },
  { title: "Climate Control", desc: "Underfloor heating and air conditioning" },
  { title: "Free WiFi", desc: "High-speed internet throughout" },
  { title: "Free Parking", desc: "Private parking right at your dome" },
  { title: "Cycle Trail Access", desc: "300m to Otago Rail Trail" },
];

const galleryImages = [
  { src: "/images/dome-rose-spa1.jpeg", alt: "Dome Ros\u00e9 with private outdoor spa" },
  { src: "/images/domesmountainview.jpeg", alt: "Mountain views from Dome Ros\u00e9" },
  { src: "/images/vineyard.jpeg", alt: "Vineyard views surrounding Dome Ros\u00e9" },
];

const pricingFeatures = [
  "Nightly rate: $510/night",
  "Minimum 2 nights (3 nights peak season)",
  "All amenities included",
  "Continental breakfast included",
  "Security Bond: $300 (refundable, released 48 hours after checkout)",
];

const guides = [
  { href: "/central-otago-wine-trail", title: "Wine Trail Guide", desc: "Discover 30+ cellar doors in Bannockburn, Cromwell Basin & beyond." },
  { href: "/couples-retreat-central-otago", title: "Romantic Getaway Guide", desc: "Two-night itinerary for the perfect couples retreat in wine country." },
  { href: "/cromwell-activities", title: "Cromwell Activities", desc: "Cycling, kayaking, heritage walks and seasonal events near Lake Dunstan." },
  { href: "/weekend-getaway-queenstown", title: "Weekend from Queenstown", desc: "45 minutes away — a peaceful lakeside alternative to Queenstown." },
];

export default function DomeRosePage() {
  return (
    <>
      <JsonLd data={[
        createPropertySchema({
          id: "dome-rose",
          name: "Dome Ros\u00e9",
          description: "Romantic 40sqm luxury geodesic dome with vineyard views, private outdoor spa, and intimate wine country setting.",
          price: 510,
          floorSize: 40,
          maxOccupancy: 2,
          bedType: "Super King",
          images: ["dome-rose-spa1.jpeg", "dome-rose-interior.jpeg"],
          amenities: ["Private Outdoor Spa", "Mountain Views", "Super King Bed", "Vineyard Setting", "Sustainably Powered", "Underfloor Heating", "Air Conditioning", "Kitchenette", "Free WiFi", "Free Parking"],
          reviewCount: "98",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Stay", path: "/stay" },
          { name: "Dome Ros\u00e9", path: "/dome-rose" },
        ]),
        createFaqSchema([
          { question: "What makes Dome Ros\u00e9 special?", answer: "Dome Ros\u00e9 is a romantic 40sqm retreat with private outdoor spa, vineyard and mountain views, and a cosy intimate atmosphere perfect for couples." },
          { question: "Is Dome Ros\u00e9 suitable for families?", answer: "No, Dome Ros\u00e9 is strictly adults-only. For families, we recommend our Lakeside Cottage." },
          { question: "What's the difference between Dome Pinot and Dome Ros\u00e9?", answer: "Dome Pinot is larger (50sqm vs 40sqm) with lake views and a stargazing skylight. Dome Ros\u00e9 offers a more intimate setting with vineyard and mountain views." },
        ]),
      ]} />
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/images/dome-rose-spa1.jpeg"
          alt="Dome Rosé romantic geodesic dome with private outdoor spa and vineyard views"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4 drop-shadow-lg">
            Dome Rosé
          </h1>
          <p className="text-xl mb-8 opacity-95">
            A romantic 40sqm geodesic dome nestled among the vineyards
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/book?a=dome-rose" ariaLabel="Book Dome Rosé now from $510 per night">
              Book Now - From $510/night
            </Button>
            <Button href="#gallery" variant="outline">
              View Gallery
            </Button>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200">
        <ol className="flex items-center gap-2 px-5 py-3 text-sm max-w-[1200px] mx-auto">
          <li><Link href="/" className="text-teal no-underline hover:underline">Home</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li><Link href="/stay" className="text-teal no-underline hover:underline">Stay</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li className="text-muted">Dome Rosé</li>
        </ol>
      </nav>

      {/* Overview */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-8">
            Romance in Wine Country
          </h2>
          <p className="max-w-[800px] mx-auto text-center text-lg leading-8 text-muted mb-12">
            Dome Rosé offers an intimate 40sqm retreat perfectly positioned among the
            vineyards of Central Otago. Named after the region&apos;s famous ros&eacute; wines,
            this romantic dome features stunning views of the surrounding mountains and vineyard
            rows. With your own private outdoor spa, you can soak under the stars while enjoying a
            glass of local wine. The perfect escape for couples seeking tranquility and romance in
            New Zealand&apos;s premier wine region.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white p-8 rounded-2xl text-center shadow-md hover:-translate-y-1 transition-transform"
              >
                <h3 className="font-display text-xl mb-2">{f.title}</h3>
                <p className="text-muted text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 px-5 bg-white" id="gallery">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-8">Gallery</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((img) => (
              <div key={img.src} className="rounded-2xl overflow-hidden aspect-[4/3]">
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={800}
                  height={600}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-8">
            What&apos;s Included
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {amenities.map((a) => (
              <div
                key={a.title}
                className="bg-white p-8 rounded-2xl text-center shadow-md hover:-translate-y-1 transition-transform"
              >
                <h3 className="font-display text-xl mb-2">{a.title}</h3>
                <p className="text-muted text-sm">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[500px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-8">Pricing</h2>
          <div className="bg-cream rounded-3xl p-10 text-center shadow-xl">
            <div className="text-5xl font-bold text-teal mb-1">From $510</div>
            <p className="text-muted mb-6">per night (2 guests)</p>
            <ul className="text-left space-y-3 mb-6">
              {pricingFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-burgundy font-bold mt-0.5">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 mb-6 text-left">
              <p className="text-red-800 text-sm font-semibold m-0">
                Adults Only &mdash; No children permitted. Guests arriving with children will be
                asked to leave without refund.
              </p>
            </div>
            <Button
              href="/book?a=dome-rose"
              className="w-full text-center"
              ariaLabel="Check availability for Dome Rosé"
            >
              Check Availability
            </Button>
          </div>
        </div>
      </section>

      {/* Other Accommodations */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-8">
            Explore Our Other Accommodations
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Link
              href="/dome-pinot"
              className="block bg-white rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 transition-transform no-underline"
            >
              <div className="relative h-[200px]">
                <Image
                  src="/images/Pinotfront.jpeg"
                  alt="Dome Pinot luxury geodesic dome with Lake Dunstan views"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl text-teal mb-2">Dome Pinot</h3>
                <p className="text-muted text-sm mb-3">
                  Our flagship 50sqm luxury dome with panoramic Lake Dunstan views and private spa.
                </p>
                <p className="text-burgundy font-semibold">From $530/night &rarr;</p>
              </div>
            </Link>
            <Link
              href="/lakeside-cottage"
              className="block bg-white rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 transition-transform no-underline"
            >
              <div className="relative h-[200px]">
                <Image
                  src="/images/lakeside-cottage-exterior.jpeg"
                  alt="Lakeside Cottage family accommodation"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl text-teal mb-2">Lakeside Cottage</h3>
                <p className="text-muted text-sm mb-3">
                  Spacious family cottage with direct lake access. Sleeps up to 3 guests.
                </p>
                <p className="text-burgundy font-semibold">From $295/night &rarr;</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Local Guides */}
      <section className="py-20 px-5 bg-gray-50">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-8">
            Plan Your Central Otago Stay
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {guides.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="block bg-white rounded-xl p-6 no-underline shadow-md hover:-translate-y-1 transition-transform"
              >
                <h3 className="text-teal font-semibold mb-2">{g.title}</h3>
                <p className="text-muted text-sm m-0">{g.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 bg-white text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">
            Ready for Romance in Wine Country?
          </h2>
          <p className="text-lg text-muted mb-8">
            Book direct for the best rates and complimentary continental breakfast.
            Just 45 minutes from Queenstown, 30 minutes from Wanaka.
          </p>
          <Button
            href="/book?a=dome-rose"
            ariaLabel="Book Dome Rosé now from $510 per night"
          >
            Book Dome Rosé Now
          </Button>
        </div>
      </section>
    </>
  );
}
