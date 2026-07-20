import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createPropertySchema, createBreadcrumbSchema, createFaqSchema, fetchReviewStats } from "@/lib/structured-data";
import { PropertyAvailability } from "@/components/booking/property-availability";

export const metadata: Metadata = {
  title: "Dome Ros\u00e9 | Romantic Getaway Central Otago | $599/night",
  description:
    "Dome Ros\u00e9 — intimate 40sqm glamping dome perfect for couples in Cromwell, Central Otago. Outdoor spa, mountain views, vineyard setting on Lake Dunstan. Book direct — $599/night.",
  alternates: { canonical: '/dome-rose' },
  openGraph: {
    title: "Dome Rosé | Romantic Glamping Dome — Vineyard Views, Central Otago",
    description:
      "40sqm romantic dome with private outdoor spa, vineyard and mountain views. The perfect couples escape — $599/night in Central Otago wine country.",
    url: "https://lakesideretreat.co.nz/dome-rose",
    images: [
      {
        url: "/images/galleryrainbow.jpeg",
        width: 1200,
        height: 630,
        alt: "Dome Rosé private outdoor spa overlooking Central Otago vineyard at dusk",
      },
    ],
    type: "website",
  },
};

const features = [
  { title: "Vineyard Views", desc: "Wake up to rows of vines and mountain backdrops" },
  { title: "Private Saltwater Spa", desc: "Soak under the stars with a glass of local wine" },
  { title: "Romantic Setting", desc: "Intimate 40sqm space designed for couples" },
  { title: "Luxury Super King Bed", desc: "Premium bedding for restful nights" },
  { title: "Eco-Powered", desc: "100% renewable energy with backup power" },
  { title: "Wine Trail Access", desc: "30+ wineries within 20 minutes drive" },
];

const amenities = [
  { title: "Kitchenette", desc: "Induction cooktop, fridge, microwave, coffee machine" },
  { title: "Ensuite Bathroom", desc: "Rainfall shower with premium toiletries" },
  { title: "Climate Control", desc: "Heat pump keeps the dome cosy year-round" },
  { title: "Free WiFi", desc: "High-speed internet throughout" },
  { title: "Free Parking", desc: "Private parking right at your dome" },
  { title: "Cycle Trail Access", desc: "300m to Otago Rail Trail" },
];

const galleryImages = [
  { src: "/images/dome-rose-spa1.jpeg", alt: "Dome Ros\u00e9 with private outdoor spa" },
  { src: "/images/domesmountainview.jpeg", alt: "Mountain views from Dome Ros\u00e9" },
  { src: "/images/SkyView.jpeg", alt: "Vineyard views surrounding Dome Ros\u00e9" },
  { src: "/images/IMG_1403.webp", alt: "Dome Rose interior" },
  { src: "/images/IMG_E8726.jpg", alt: "Mountain views from Dome Ros\u00e9 desking" },
  { src: "/images/IMG_8043.jpg", alt: "Dome Rose entrance" },
];

const pricingFeatures = [
  "Nightly rate: $599/night (GST incl.)",
  "Cleaning fee: included in your nightly rate",
  "Continental breakfast: included",
  "No minimum stay — 1 night bookings welcome",
  "Strictly 18+ — adults only",
  "No pets — strictly no animals (the cottage is our pet-friendly option)",
  "Security Bond: $300 (refundable, released within 7 days of checkout)",
];

const guides = [
  { href: "/central-otago-wine-trail", title: "Wine Trail Guide", desc: "Discover 30+ cellar doors in Bannockburn, Cromwell Basin & beyond." },
  { href: "/couples-retreat-central-otago", title: "Romantic Getaway Guide", desc: "Two-night itinerary for the perfect couples retreat in wine country." },
  { href: "/cromwell-activities", title: "Cromwell Activities", desc: "Cycling, wine trails, heritage walks and seasonal events near Lake Dunstan." },
  { href: "/weekend-getaway-queenstown", title: "Weekend from Queenstown", desc: "45 minutes away — a peaceful lakeside alternative to Queenstown." },
];

export default async function DomeRosePage() {
  const reviewStats = await fetchReviewStats("dome-rose");
  return (
    <>
      <JsonLd data={[
        createPropertySchema({
          id: "dome-rose",
          name: "Dome Rosé",
          description: "Romantic 40sqm luxury geodesic dome with vineyard views, private outdoor spa, and intimate wine country setting.",
          price: 599,
          floorSize: 40,
          maxOccupancy: 2,
          bedType: "Super King",
          images: ["dome-rose-spa1.jpeg", "dome-rose-interior.jpeg"],
          amenities: ["Private Saltwater Spa", "Mountain Views", "Super King Bed", "Vineyard Setting", "Sustainably Powered", "Heat Pump", "Kitchenette", "Free WiFi", "Free Parking"],
          ratingValue: reviewStats.ratingValue,
          reviewCount: reviewStats.reviewCount,
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Stay", path: "/stay" },
          { name: "Dome Ros\u00e9", path: "/dome-rose" },
        ]),
        createFaqSchema([
          { question: "What makes Dome Ros\u00e9 special?", answer: "Dome Ros\u00e9 is a romantic 40sqm retreat with private outdoor spa, vineyard and mountain views, and a cosy intimate atmosphere perfect for couples." },
          { question: "Is Dome Ros\u00e9 suitable for families?", answer: "No. Lakeside Retreat is strictly adults-only (18+) across all accommodations \u2014 Dome Ros\u00e9, Dome Pinot, and the Lakeside Cottage. Guests arriving with anyone under 18 will be refused check-in with no refund." },
          { question: "What's the difference between Dome Pinot and Dome Ros\u00e9?", answer: "Dome Pinot is larger (50sqm vs 40sqm) with lake views and a stargazing skylight. Dome Ros\u00e9 offers a more intimate setting with vineyard and mountain views." },
        ]),
      ]} />
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/images/20211122_185234.jpg"
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
            Soak under the stars. Wake among the vines.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/book?a=dome-rose" ariaLabel="Book Dome Rosé now — $599 per night">
              Book Now — $599/night
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
          <li><Link href="/" className="text-burgundy no-underline hover:underline">Home</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li><Link href="/stay" className="text-burgundy no-underline hover:underline">Stay</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li className="text-muted">Dome Rosé</li>
        </ol>
      </nav>

      {/* Overview */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-8">
            A bed by the vineyard. A spa under the stars.
          </h2>
          <p className="max-w-[800px] mx-auto text-center text-lg leading-8 text-muted mb-12">
            Forty square metres tucked into the vines. A super-king bed where
            the mountains rise out of rows of pinot, and a private spa out
            back warm enough to forget the hour. Pour something local, climb
            in, look up. This is what we mean by a weekend away.
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

      {/* Live availability */}
      <section className="py-20 px-5 bg-white" id="availability">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-3">Live availability</h2>
          <p className="text-center text-muted mb-8">
            Two months at a glance &mdash; straight from our booking system.
          </p>
          <PropertyAvailability accommodationId="dome-rose" minStay={1} />
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-5 bg-cream/40">
        <div className="max-w-[500px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-8">Pricing</h2>
          <div className="bg-cream rounded-3xl p-10 text-center shadow-xl">
            <div className="text-5xl font-bold text-burgundy mb-1">$599</div>
            <p className="text-muted mb-1">per night (2 guests)</p>
            <p className="text-sm text-teal font-semibold mb-6">GST and cleaning included — no hidden fees</p>
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
                  src="/images/gallerydeck.jpeg"
                  alt="Dome Pinot luxury geodesic dome with Lake Dunstan views"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl text-burgundy mb-2">Dome Pinot</h3>
                <p className="text-muted text-sm mb-3">
                  Our flagship 50sqm luxury dome with panoramic Lake Dunstan views and private spa.
                </p>
                <p className="text-burgundy font-semibold">$650/night &rarr;</p>
              </div>
            </Link>
            <Link
              href="/lakeside-cottage"
              className="block bg-white rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 transition-transform no-underline"
            >
              <div className="relative h-[200px]">
                <Image
                  src="/images/vineyardlakeview.jpeg"
                  alt="Lakeside Cottage — adults-only pet-friendly lakefront stay"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl text-burgundy mb-2">Lakeside Cottage</h3>
                <p className="text-muted text-sm mb-3">
                  Adults-only lakefront cottage with wood-fired hot tub. Sleeps up to 3.
                </p>
                <p className="text-burgundy font-semibold">$350/night &rarr;</p>
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
                <h3 className="text-burgundy font-semibold mb-2">{g.title}</h3>
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
            The vines are waiting.
          </h2>
          <p className="text-lg text-muted mb-8">
            Forty-five minutes from Queenstown. A world away from it.  Gift vouchers are available. Book
            direct &mdash; breakfast is on us.
          </p>
          <Button
            href="/book?a=dome-rose"
            ariaLabel="Book Dome Rosé now — $599 per night"
          >
            Book Dome Rosé Now
          </Button>
        </div>
      </section>
    </>
  );
}
