import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { JsonLd, createOrganizationSchema, createBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "About Lakeside Retreat | Sustainable Luxury Accommodation, Central Otago",
  description:
    "Meet Stephen and Sandy, hosts of Central Otago's premier sustainably powered retreat on Lake Dunstan. Our story of building luxury glamping domes and a lakeside cottage.",
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
  { title: "Sustainability", desc: "Sustainable operations that give back to the environment" },
  { title: "Hospitality", desc: "Personal touches that make every guest feel special" },
  { title: "Connection", desc: "Helping guests connect with nature and local culture" },
  { title: "Excellence", desc: "Attention to detail in everything we do" },
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
      <section
        className="relative min-h-[60vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('/images/aerial-property.jpg')",
        }}
      >
        <div className="pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4">Our Story</h1>
          <p className="text-xl opacity-95">
            The journey behind Central Otago&apos;s premier sustainable luxury retreat
          </p>
        </div>
      </section>

      {/* Welcome */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl mb-6">Welcome to Our Dream</h2>
            <p className="text-lg leading-8 text-muted mb-4">
              We&apos;re Stephen and Sandy, and Lakeside Retreat is the culmination of our dream to
              create New Zealand&apos;s premier sustainably powered luxury accommodation. When we
              purchased this land on the shores of Lake Dunstan in 2021, we knew we&apos;d found
              something special &mdash; panoramic views, proximity to world-class wineries, and
              access to the famous Otago Rail Trail.
            </p>
            <p className="text-lg leading-8 text-muted">
              Our geodesic domes were chosen for their efficiency &mdash; offering exceptional
              insulation, structural integrity, and panoramic windows. In 2025 we took another step
              forward with a new commercial-grade solar system and advanced battery storage, feeding
              surplus energy back into the national grid.
            </p>
          </div>
          <Image
            src="/images/vineyard.jpeg"
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
          <h2 className="font-display text-4xl text-center mb-12">What We Value</h2>
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
          <h2 className="font-display text-4xl mb-6">Our Promise to You</h2>
          <p className="text-lg leading-8 text-muted mb-6">
            We&apos;re committed to combining luxury with sustainability, adventure with relaxation,
            world-class hospitality with Kiwi warmth. Every detail at Lakeside Retreat has been
            carefully considered to create unforgettable experiences for our guests.
          </p>
          <p className="text-lg text-muted italic">
            With warm regards,<br />
            Stephen &amp; Sandy
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">
            Come and Experience It Yourself
          </h2>
          <p className="text-lg text-muted mb-8">
            We&apos;d love to welcome you to Lakeside Retreat and share our corner of Central Otago
            with you.
          </p>
          <Button href="/book">Book Your Stay</Button>
        </div>
      </section>
    </>
  );
}
