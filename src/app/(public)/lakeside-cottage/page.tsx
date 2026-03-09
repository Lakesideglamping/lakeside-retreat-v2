import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createPropertySchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Lakeside Cottage | Pet Friendly Accommodation Cromwell | $295/night",
  description:
    "Lakeside Cottage — pet-friendly, self-contained holiday home on Lake Dunstan, Cromwell. 2 bedrooms, full kitchen, direct lake access. Family accommodation in Central Otago from $295/night.",
};

const features = [
  { title: "Direct Lake Access", desc: "Step straight from your deck into Lake Dunstan" },
  { title: "Sleeps 3 Guests", desc: "2 bedrooms with flexible sleeping arrangements" },
  { title: "Pet Friendly", desc: "Bring your furry family members along" },
  { title: "Full Kitchen", desc: "Everything you need for family meals" },
  { title: "Eco-Powered", desc: "100% renewable energy with backup power" },
  { title: "Kayaks Included", desc: "Complimentary kayaks for lake adventures" },
];

const amenities = [
  { title: "Sleeping", desc: "Queen bed + sofa bed" },
  { title: "BBQ Facilities", desc: "Gas BBQ on the deck for family cookouts" },
  { title: "Climate Control", desc: "Underfloor heating and air conditioning" },
  { title: "Free WiFi", desc: "High-speed internet throughout" },
  { title: "Free Parking", desc: "Space for multiple vehicles" },
  { title: "Cycle Trail Access", desc: "300m to Otago Rail Trail" },
];

const galleryImages = [
  { src: "/images/lakeside-cottage-exterior.jpeg", alt: "Lakeside Cottage exterior with lake views" },
  { src: "/images/lakeview.jpeg", alt: "Lake Dunstan views from Lakeside Cottage" },
  { src: "/images/vineyard.jpeg", alt: "Surrounding vineyard landscape" },
];

const pricingFeatures = [
  "Nightly rate: $295/night",
  "Extra guests: $100/person/night (max 3)",
  "Pets: $50 flat fee per stay",
  "Minimum 2 nights (3 nights peak season)",
  "Kayaks and BBQ included",
  "Security Bond: $300 (refundable, released 48 hours after checkout)",
  "Children welcome",
];

const guides = [
  { href: "/central-otago-wine-trail", title: "Wine Trail Guide", desc: "Discover 30+ cellar doors in Bannockburn, Cromwell Basin & beyond." },
  { href: "/couples-retreat-central-otago", title: "Romantic Getaway Guide", desc: "Two-night itinerary for the perfect couples retreat in wine country." },
  { href: "/cromwell-activities", title: "Cromwell Activities", desc: "Cycling, kayaking, heritage walks and seasonal events near Lake Dunstan." },
  { href: "/weekend-getaway-queenstown", title: "Weekend from Queenstown", desc: "45 minutes away — a peaceful lakeside alternative to Queenstown." },
];

export default function LakesideCottagePage() {
  return (
    <>
      <JsonLd data={[
        createPropertySchema({
          id: "lakeside-cottage",
          name: "Lakeside Cottage",
          description: "Family-friendly lakefront cottage with direct Lake Dunstan access, 2 bedrooms, full kitchen, and pet-friendly accommodation.",
          price: 295,
          floorSize: 65,
          maxOccupancy: 3,
          bedType: "Queen",
          images: ["lakeside-cottage-exterior.jpeg", "lakeside-cottage-interior.jpeg"],
          amenities: ["Direct Lake Access", "Pet Friendly", "Full Kitchen", "2 Bedrooms", "Kayaks Included", "Free WiFi", "Free Parking", "BBQ"],
          reviewCount: "191",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Stay", path: "/stay" },
          { name: "Lakeside Cottage", path: "/lakeside-cottage" },
        ]),
        createFaqSchema([
          { question: "Can I bring my dog to Lakeside Cottage?", answer: "Yes! The Lakeside Cottage is pet-friendly. Well-behaved dogs are welcome with a $50 flat pet fee per stay. Maximum 2 dogs." },
          { question: "How many people can stay at Lakeside Cottage?", answer: "The cottage accommodates up to 3 guests (2 base, extra guest $100/night)." },
          { question: "Is there lake access from the cottage?", answer: "Yes, the Lakeside Cottage has direct access to Lake Dunstan for swimming, kayaking, and fishing. Kayaks are included." },
        ]),
      ]} />
      {/* Hero */}
      <section
        className="relative min-h-[70vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('/images/lakeside-cottage-exterior.jpeg')",
        }}
      >
        <div className="pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4 drop-shadow-lg">
            Lakeside Cottage
          </h1>
          <p className="text-xl mb-8 opacity-95">
            Spacious family accommodation with direct Lake Dunstan access
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/#booking" ariaLabel="Book Lakeside Cottage now from $295 per night">
              Book Now - From $295/night
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
          <li className="text-muted">Lakeside Cottage</li>
        </ol>
      </nav>

      {/* Overview */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-semibold">
              Pet Friendly
            </span>
          </div>
          <h2 className="font-display text-4xl text-center mb-8">
            Your Family Lakeside Escape
          </h2>
          <p className="max-w-[800px] mx-auto text-center text-lg leading-8 text-muted mb-12">
            Lakeside Cottage offers the perfect family getaway with direct access to Lake
            Dunstan&apos;s crystal-clear waters. This spacious cottage sleeps up to 3 guests across
            two bedrooms, making it ideal for families. Enjoy morning swims, kayaking adventures,
            and evening BBQs on your private deck overlooking the lake. As our only pet-friendly
            accommodation, your furry family members are welcome too!
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
            <div className="text-5xl font-bold text-teal mb-1">From $295</div>
            <p className="text-muted mb-6">per night (2 guests base)</p>
            <ul className="text-left space-y-3 mb-6">
              {pricingFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-burgundy font-bold mt-0.5">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
            <Button
              href="/#booking"
              className="w-full text-center"
              ariaLabel="Check availability for Lakeside Cottage"
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
                  src="/images/dome-pinot-hero.jpeg"
                  alt="Dome Pinot luxury glamping"
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
              href="/dome-rose"
              className="block bg-white rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 transition-transform no-underline"
            >
              <div className="relative h-[200px]">
                <Image
                  src="/images/dome-rose-spa1.jpeg"
                  alt="Dome Ros&eacute; romantic glamping"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl text-teal mb-2">Dome Ros&eacute;</h3>
                <p className="text-muted text-sm mb-3">
                  40sqm romantic dome with outdoor spa and vineyard views. Perfect for couples.
                </p>
                <p className="text-burgundy font-semibold">From $510/night &rarr;</p>
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
            Ready for a Family Lake Adventure?
          </h2>
          <p className="text-lg text-muted mb-8">
            Book direct for the best rates. Kayaks, BBQ, and lake access included. Just 45 minutes
            from Queenstown, 30 minutes from Wanaka.
          </p>
          <Button
            href="/#booking"
            ariaLabel="Book Lakeside Cottage now from $295 per night"
          >
            Book Lakeside Cottage Now
          </Button>
        </div>
      </section>
    </>
  );
}
