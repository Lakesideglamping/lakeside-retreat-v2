import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/hero-background";
import { JsonLd, createOrganizationSchema, createBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "About Lakeside Retreat | Sustainable Luxury Accommodation, Central Otago",
  description:
    "Meet Stephen and Sandy, hosts of Central Otago's premier sustainably powered retreat on Lake Dunstan. Our story of building luxury glamping domes and a lakeside cottage.",
  alternates: { canonical: "/our-story" },
  openGraph: {
    title: "About Lakeside Retreat | Our Story",
    description:
      "Meet Stephen and Sandy, hosts of Central Otago's premier sustainably powered retreat on Lake Dunstan.",
    url: "https://lakesideretreat.co.nz/our-story",
    images: [{ url: "/images/galleryrainbow.jpeg", width: 1200, height: 800, alt: "Lakeside Retreat \u2014 solar powered" }],
    type: "website",
  },
};

const timeline = [
  { year: "2021", event: "Purchased the lakeside property in Mount Pisa and began planning the sustainable retreat" },
  { year: "2022", event: "Opened the Lakeside Cottage and welcomed our first guests" },
  { year: "2023", event: "Added Dome Rosé and Dome Pinot — bringing our unique geodesic domes to life" },
  { year: "2024", event: "Celebrated 127 five-star reviews and a 45% return guest rate" },
  { year: "2025", event: "Installed a new commercial-grade solar system with advanced battery storage" },
  { year: "2026", event: "Something new is coming — watch this space \uD83D\uDC40" },
];

const values = [
  { title: "Quiet", desc: "The kind you drive a long way to find." },
  { title: "Care", desc: "Your bed made, your spa ready." },
  { title: "Place", desc: "What the lake gives, we give back." },
  { title: "Detail", desc: "Down to the last tea bag." },
];

export default function OurStoryPage() {
  return (
    <>
      <JsonLd data={[
        createOrganizationSchema(),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Our Story", path: "/our-story" },
        ]),
      ]} />
      {/* Hero */}
      <HeroBackground
        src="/images/galleryrainbow.jpeg"
        alt="Dome Rose with private spa at Lakeside Retreat"
        minHeight="60vh"
        overlayOpacity={0.35}
      >
        <h1 className="font-display text-5xl text-white mb-4">Our Story</h1>
        <p className="text-xl opacity-95">
          How two people, a lake, and a lot of solar panels became Lakeside Retreat.
        </p>
      </HeroBackground>

      {/* Welcome */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl mb-6">The day we found it</h2>
            <p className="text-lg leading-8 text-muted mb-4">
              We&apos;re Stephen and Sandy. In 2021 we stood on a dusty paddock
              above Lake Dunstan, watched the light move across the Pisa Range,
              and knew we&apos;d be staying. Everything you see here &mdash;
              the domes, the vines, the solar array humming quietly in the sun
              &mdash; grew out of that first evening.
            </p>
            <p className="text-lg leading-8 text-muted">
              The domes came next, chosen for the way they sit quietly in the
              landscape and let the view do the talking. The solar came after
              that &mdash; enough now that we put more back into the grid than
              we take out.
            </p>
          </div>
          <Image
            src="/images/solarpanel.jpeg"
            alt="View of Lake Dunstan and vineyards from Lakeside Retreat"
            width={800}
            height={600}
            className="rounded-2xl w-full h-auto object-cover"
          />
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">Our Journey</h2>
          <div className="space-y-6">
            {timeline.map((item) => (
              <div key={item.year} className="flex gap-6 items-start">
                <div className="text-2xl font-bold text-burgundy min-w-[80px]">{item.year}</div>
                <div className="bg-cream rounded-xl p-5 flex-1">
                  <p className="text-body m-0">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">What we care about</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white p-8 rounded-2xl text-center shadow-md"
              >
                <h3 className="font-display text-xl mb-3">{v.title}</h3>
                <p className="text-muted text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-6">What we promise</h2>
          <p className="text-lg leading-8 text-muted mb-6">
            A bed made with real care. Coffee already waiting. The kind of
            quiet you drive a long way to find. When you leave, we want the
            lake to still be in your head a week later.
          </p>
          <p className="text-lg text-muted italic">
            Stephen &amp; Sandy
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">
            Come find it for yourself.
          </h2>
          <p className="text-lg text-muted mb-8">
            The wrong turn that changed everything &mdash; take it.
          </p>
          <Button href="/book">Book Your Stay</Button>
        </div>
      </section>
    </>
  );
}
