import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createArticleSchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Luxury Accommodation Cromwell | Lake Dunstan Domes & Cottage",
  description:
    "Cromwell's most luxurious accommodation on Lake Dunstan. Geodesic glamping domes with private spas and an adults-only lakefront cottage. 4.9★ rated. $350/night.",

  alternates: { canonical: "/luxury-accommodation-cromwell" },
  openGraph: {
    title: "Luxury Accommodation Cromwell | Lake Dunstan Domes & Cottage",
    description: "Cromwell's most luxurious accommodation on Lake Dunstan. Geodesic glamping domes with private spas and an adults-only lakefront cottage. 4.9★ rated. $350/night.",
    url: "https://lakesideretreat.co.nz/luxury-accommodation-cromwell",
    images: [
      {
        url: "/images/Pinotfront.jpeg",
        width: 1200,
        height: 800,
        alt: "Luxury glamping domes and lakefront cottage in Cromwell, Central Otago",
      },
    ],
    type: "article",
  },
};

const luxuryAmenities = [
  { category: "Sleep", items: ["Super king bed with premium hotel-quality linens", "Blackout curtains and temperature control", "Heated bathroom floors", "Plush bathrobes and premium toiletries"] },
  { category: "Spa & Relaxation", items: ["Private saltwater outdoor spa (domes)", "Wood-fired cedar hot tub, no chemicals (cottage)", "Panoramic stargazing skylight (Dome Pinot)", "Outdoor lounging deck"] },
  { category: "Dining & Kitchen", items: ["Continental breakfast stocked and included (domes)", "Self-catering kitchenette in every property", "Gas BBQ on the deck (cottage)", "Locally sourced welcome provisions"] },
  { category: "Location & Views", items: ["Panoramic Lake Dunstan and Pisa Range views", "300m from Otago Rail Trail", "15 min to 30+ Central Otago wineries", "45 min to Queenstown"] },
];

const awards = [
  { stat: "4.9 / 5", label: "Average guest rating" },
  { stat: "416+", label: "Verified reviews" },
  { stat: "#1", label: "Cromwell on Airbnb" },
  { stat: "45%", label: "Return guest rate" },
];

export default function LuxuryAccommodationCromwellPage() {
  return (
    <>
      <JsonLd data={[
        createArticleSchema({
          title: "Luxury Accommodation Cromwell | Lake Dunstan Domes & Cottage",
          description: "Cromwell's most luxurious accommodation on Lake Dunstan — geodesic glamping domes with private spas and an adults-only lakefront cottage. 4.9★ rated.",
          path: "/luxury-accommodation-cromwell",
          image: "PinotLakeView.jpeg",
          datePublished: "2025-05-01",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Luxury Accommodation Cromwell", path: "/luxury-accommodation-cromwell" },
        ]),
        createFaqSchema([
          { question: "What is the most luxurious accommodation in Cromwell?", answer: "Lakeside Retreat at Mount Pisa is widely regarded as Cromwell's most luxurious accommodation. With a 4.9/5 rating from 416+ guests, the property features two adults-only geodesic domes with private outdoor spas and a lakeside cottage — all with panoramic Lake Dunstan views and positioned in the heart of Central Otago wine country." },
          { question: "Is there luxury accommodation near Queenstown?", answer: "Lakeside Retreat is 45 minutes from Queenstown and offers a genuine luxury escape from the crowds. Luxury geodesic domes with private spas, stargazing skylights, and vineyard views — at better value than equivalent Queenstown properties." },
          { question: "What makes Lakeside Retreat a luxury property?", answer: "Every detail at Lakeside Retreat is curated for luxury: premium hotel-quality linens, private saltwater outdoor spas, continental breakfast included, panoramic mountain and lake views, self-catering kitchenettes, heated bathrooms, and personal service from hosts Stephen and Sandy. The geodesic domes are architecturally unique and unlike anything else in Central Otago." },
        ]),
      ]} />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/images/alpenglow-mountains.jpeg"
          alt="Luxury glamping dome with panoramic Lake Dunstan views, Cromwell"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative max-w-[750px] px-5 pt-20">
          <p className="text-white/90 text-sm font-semibold tracking-wider uppercase mb-3">
            &#9733; &#9733; &#9733; &#9733; &#9733; &nbsp; 4.9/5 &nbsp;&middot;&nbsp; 416+ Reviews
          </p>
          <h1 className="font-display text-5xl md:text-6xl text-white mb-4 drop-shadow-lg">
            Luxury Accommodation<br />Cromwell, Central Otago
          </h1>
          <p className="text-xl mb-8 opacity-95">
            Geodesic glamping domes and a lakeside cottage on Lake Dunstan.
            The finest accommodation in Central Otago wine country.
          </p>
          <Button href="/book">Book Direct — Best Rate</Button>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200">
        <ol className="flex items-center gap-2 px-5 py-3 text-sm max-w-[1200px] mx-auto">
          <li><Link href="/" className="text-burgundy no-underline hover:underline">Home</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li className="text-muted">Luxury Accommodation Cromwell</li>
        </ol>
      </nav>

      {/* Stats */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-[900px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {awards.map((a) => (
              <div key={a.label} className="text-center">
                <div className="font-display text-4xl text-burgundy mb-1">{a.stat}</div>
                <div className="text-muted text-sm">{a.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl mb-6">
              Where Luxury Meets the Landscape
            </h2>
            <p className="text-lg leading-8 text-muted mb-4">
              There is no other accommodation in Cromwell like Lakeside Retreat. Our three
              properties — two architecturally designed geodesic domes and a lakeside cottage —
              sit on the shores of Lake Dunstan with views that stretch across the water to the
              Pisa Range.
            </p>
            <p className="text-lg leading-8 text-muted mb-6">
              Every stay includes premium hotel-quality linens, self-catering kitchenettes,
              heated bathrooms, and personal host service from Stephen and Sandy. The domes
              also include continental breakfast and private outdoor saltwater spas.
            </p>
            <p className="text-muted text-sm italic">
              &ldquo;We&apos;ve stayed in luxury lodges and five-star hotels across New Zealand. This was
              the most special stay of our lives.&rdquo; — Rachel &amp; Tom, Wellington
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative h-[250px] rounded-2xl overflow-hidden">
              <Image src="/images/Pinotfront.jpeg" alt="Dome Pinot luxury geodesic dome" fill className="object-cover" sizes="25vw" />
            </div>
            <div className="relative h-[250px] rounded-2xl overflow-hidden">
              <Image src="/images/dome-rose-spa1.jpeg" alt="Dome Rosé private outdoor spa" fill className="object-cover" sizes="25vw" />
            </div>
            <div className="relative h-[250px] rounded-2xl overflow-hidden col-span-2">
              <Image src="/images/lakeside-cottage-exterior.jpeg" alt="Lakeside Cottage on Lake Dunstan" fill className="object-cover" sizes="50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">Luxury Amenities</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {luxuryAmenities.map((cat) => (
              <div key={cat.category} className="bg-cream rounded-2xl p-6">
                <h3 className="font-display text-xl text-burgundy mb-4">{cat.category}</h3>
                <ul className="space-y-2">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-body">
                      <span className="text-burgundy font-bold mt-0.5">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Properties */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">Our Three Properties</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                href: "/dome-pinot",
                bookHref: "/book?a=dome-pinot",
                image: "/images/Pinotfront.jpeg",
                title: "Dome Pinot",
                badge: "Adults Only",
                price: "$650/night",
                size: "50sqm",
                desc: "Larger dome with stargazing skylight, panoramic lake views, private saltwater spa, and continental breakfast.",
              },
              {
                href: "/dome-rose",
                bookHref: "/book?a=dome-rose",
                image: "/images/dome-rose-spa1.jpeg",
                title: "Dome Ros\u00e9",
                badge: "Adults Only",
                price: "$599/night",
                size: "40sqm",
                desc: "Intimate retreat with vineyard and mountain views, private outdoor spa, luxury super king bed.",
              },
              {
                href: "/lakeside-cottage",
                bookHref: "/book?a=lakeside-cottage",
                image: "/images/lakeside-cottage-exterior.jpeg",
                title: "Lakeside Cottage",
                badge: "Adults-Only · Pet Friendly",
                price: "$350/night",
                size: "Sleeps 3",
                desc: "Self-contained cottage with direct lake access, wood-fired hot tub, BBQ, kitchenette, and dog-friendly.",
              },
            ].map((acc) => (
              <div key={acc.href} className="bg-white rounded-2xl overflow-hidden shadow-lg">
                <Link href={acc.href} className="block relative h-[220px]">
                  <Image src={acc.image} alt={acc.title} fill className="object-cover" sizes="33vw" />
                </Link>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-xl text-burgundy">{acc.title}</h3>
                    <span className="text-xs text-muted">({acc.size})</span>
                  </div>
                  <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-semibold">{acc.badge}</span>
                  <p className="text-burgundy font-semibold mt-2 mb-3">{acc.price}</p>
                  <p className="text-muted text-sm mb-4">{acc.desc}</p>
                  <Button href={acc.bookHref} className="w-full text-center text-sm">
                    Book Now &rarr;
                  </Button>
                </div>
              </div>
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
              { href: "/glamping-central-otago", title: "Glamping Central Otago", desc: "Luxury geodesic domes with private outdoor spas" },
              { href: "/dog-friendly-accommodation-central-otago", title: "Dog-Friendly Stays", desc: "The Lakeside Cottage welcomes well-behaved dogs" },
              { href: "/otago-rail-trail-accommodation", title: "Rail Trail Accommodation", desc: "300m from the Cromwell trailhead" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="block bg-white rounded-xl p-5 no-underline hover:-translate-y-1 transition-transform shadow-sm">
                <p className="font-semibold text-burgundy mb-1">{link.title}</p>
                <p className="text-muted text-sm">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Book Direct */}
      <section className="py-20 px-5 bg-white text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">Book Direct &amp; Save</h2>
          <p className="text-lg text-muted mb-6">
            Booking directly with us saves you 12–18% compared to Airbnb and Booking.com fees.
            Same luxury stay, best price, direct host communication.
          </p>
          <Button href="/book">Book Direct — Best Rate Guaranteed</Button>
          <p className="text-sm text-muted mt-6">
            <Link href="/contact" className="text-burgundy no-underline hover:underline">Contact Stephen &amp; Sandy</Link> with any questions
          </p>
        </div>
      </section>
    </>
  );
}
