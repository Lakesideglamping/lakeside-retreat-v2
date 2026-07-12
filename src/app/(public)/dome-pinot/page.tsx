import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createPropertySchema, createBreadcrumbSchema, createFaqSchema, fetchReviewStats } from "@/lib/structured-data";
import { PropertyAvailability } from "@/components/booking/property-availability";

export const metadata: Metadata = {
  title: "Dome Pinot | Geodesic Dome Accommodation NZ | $650/night",
  description:
    "Dome Pinot — our flagship 50sqm luxury glamping dome in Cromwell, Central Otago. Private spa, stargazing roof, panoramic Lake Dunstan views. The ultimate romantic getaway. Book direct — $650/night.",
  alternates: { canonical: '/dome-pinot' },
  openGraph: {
    title: "Dome Pinot | Luxury Geodesic Dome — Lake Dunstan, Central Otago",
    description:
      "50sqm luxury glamping dome with private outdoor spa, stargazing skylight, and panoramic Lake Dunstan views. Adults-only escape — $650/night.",
    url: "https://lakesideretreat.co.nz/dome-pinot",
    images: [
      {
        url: "/images/20220125_091449.jpg",
        width: 1200,
        height: 630,
        alt: "Dome Pinot luxury geodesic dome with panoramic Lake Dunstan views",
      },
    ],
    type: "website",
  },
};

const features = [
  { title: "50sqm Living Space", desc: "Our largest dome with spacious open-plan design" },
  { title: "Private Saltwater Spa", desc: "Relax under the stars in your own saltwater spa" },
  { title: "Stargazing Skylight", desc: "Fall asleep watching the Milky Way" },
  { title: "Luxury Super King Bed", desc: "Premium bedding with lake views from your pillow" },
  { title: "Eco-Powered", desc: "100% renewable energy with backup power" },
  { title: "Lake-facing window", desc: "A wide view of Lake Dunstan right from the bed" },
];

const amenities = [
  { title: "Kitchenette", desc: "Induction cooktop, fridge, microwave, coffee machine" },
  { title: "Ensuite Bathroom", desc: "Rainfall shower with premium toiletries" },
  { title: "Climate Control", desc: "Heat pump for heating and air conditioning year-round" },
  { title: "Free WiFi", desc: "High-speed internet throughout" },
  { title: "Free Parking", desc: "Private parking right at your dome" },
  { title: "Cycle Trail Access", desc: "300m to Otago Rail Trail" },
];

const galleryImages = [
  { src: "/images/Pinotfront.jpeg", alt: "Dome Pinot exterior with snow-capped mountain views" },
  { src: "/images/IMG_0097.jpg", alt: "Dome Pinot private deck overlooking the spring vineyard and lake" },
  { src: "/images/pinotinternal.jpeg", alt: "Dome Pinot interior luxury living space" },
  { src: "/images/windowview.jpeg", alt: "View from inside Dome Pinot over the vineyard and Lake Dunstan" },
  { src: "/images/GallerySwingChair.jpeg", alt: "View from swing chair over the vineyard and Lake Dunstan" },
  { src: "/images/pinotexternal2.JPEG", alt: "Dome Pinot from the driveway over looking vineyard and Lake Dunstan" },
];

const pricingFeatures = [
  "Nightly rate: $650/night (GST incl.)",
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

export default async function DomePinotPage() {
  const reviewStats = await fetchReviewStats("dome-pinot");
  return (
    <>
      <JsonLd data={[
        createPropertySchema({
          id: "dome-pinot",
          name: "Dome Pinot",
          description: "Flagship 50sqm luxury geodesic dome with panoramic Lake Dunstan views, private outdoor spa, stargazing skylight, and eco-luxury comfort.",
          price: 650,
          floorSize: 50,
          maxOccupancy: 2,
          bedType: "Super King",
          images: ["20220125_091449.jpg", "gallerydecksitting.jpeg", "pinotinternal.jpeg"],
          amenities: ["Private Saltwater Spa", "Stargazing Skylight", "Super King Bed", "Panoramic Lake Views", "Sustainably Powered", "Heat Pump", "Kitchenette", "Free WiFi", "Free Parking"],
          ratingValue: reviewStats.ratingValue,
          reviewCount: reviewStats.reviewCount,
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Stay", path: "/stay" },
          { name: "Dome Pinot", path: "/dome-pinot" },
        ]),
        createFaqSchema([
          { question: "What makes Dome Pinot different from other glamping in Central Otago?", answer: "Dome Pinot is our flagship 50sqm luxury geodesic dome featuring panoramic Lake Dunstan views, a private outdoor spa, stargazing skylight, super king bed, and complimentary continental breakfast." },
          { question: "How far is Dome Pinot from Queenstown?", answer: "Approximately 45 minutes' drive from Queenstown and 30 minutes from Wanaka." },
          { question: "Is Dome Pinot suitable for children?", answer: "No. Dome Pinot — like every property at Lakeside Retreat — is strictly 18+. No children or guests under 18 are permitted on the property." },
          { question: "What is included in a stay at Dome Pinot?", answer: "Every stay includes a private outdoor spa, complimentary continental breakfast, premium bed linen, a heat pump for heating and cooling, a kitchenette (induction cooktop, fridge, microwave, coffee machine), and direct access to the Lake Dunstan Cycle Trail." },
        ]),
      ]} />
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/images/20220125_091449.jpg"
          alt="Dome Pinot luxury geodesic dome with panoramic Lake Dunstan views"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4 drop-shadow-lg">
            Dome Pinot
          </h1>
          <p className="text-xl mb-8 opacity-95">
            Our flagship. The lake from the bed. The Milky Way through the roof.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/book?a=dome-pinot" ariaLabel="Book Dome Pinot now — $650 per night">
              Book Now — $650/night
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
          <li className="text-muted">Dome Pinot</li>
        </ol>
      </nav>

      {/* Overview */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-8">
            The bed looks at the lake. The roof looks at the stars.
          </h2>
          <p className="max-w-[800px] mx-auto text-center text-lg leading-8 text-muted mb-12">
            Fifty square metres of calm. A super-king bed angled at the window,
            so the first thing you see each morning is Lake Dunstan and the
            mountains behind it. A stargazing skylight overhead. A private spa
            out back for when you want the stars closer. This is the one we
            built for couples who wanted to stop talking for a while.
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
          <PropertyAvailability accommodationId="dome-pinot" minStay={1} />
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-5 bg-cream/40">
        <div className="max-w-[500px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-8">Pricing</h2>
          <div className="bg-cream rounded-3xl p-10 text-center shadow-xl">
            <div className="text-5xl font-bold text-burgundy mb-1">$650</div>
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
              href="/book?a=dome-pinot"
              className="w-full text-center"
              ariaLabel="Check availability for Dome Pinot"
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
              href="/dome-rose"
              className="block bg-white rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 transition-transform no-underline"
            >
              <div className="relative h-[200px]">
                <Image
                  src="/images/dome-rose-spa1.jpeg"
                  alt="Dome Rosé luxury glamping"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl text-burgundy mb-2">Dome Rosé</h3>
                <p className="text-muted text-sm mb-3">
                  40sqm romantic dome with outdoor spa and vineyard views. Perfect for couples.
                </p>
                <p className="text-burgundy font-semibold">$599/night &rarr;</p>
              </div>
            </Link>
            <Link
              href="/lakeside-cottage"
              className="block bg-white rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 transition-transform no-underline"
            >
              <div className="relative h-[200px]">
                <Image
                  src="/images/lakeside-cottage-exterior.jpeg"
                  alt="Lakeside Cottage — adults-only pet-friendly lakefront stay"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl text-burgundy mb-2">Lakeside Cottage</h3>
                <p className="text-muted text-sm mb-3">
                  Adults-only lakefront cottage with wood-fired hot tub. Sleeps up to 3, pets friendly.
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
            The bed is made. The stars are out.
          </h2>
          <p className="text-lg text-muted mb-8">
            Forty-five minutes from Queenstown. A world away from it.
            Book direct — breakfast is on us.
          </p>
          <Button
            href="/book?a=dome-pinot"
            ariaLabel="Book Dome Pinot now — $650 per night"
          >
            Book Dome Pinot Now
          </Button>
        </div>
      </section>
    </>
  );
}
