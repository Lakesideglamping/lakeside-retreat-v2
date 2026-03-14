import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createArticleSchema, createBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Weekend Getaway from Queenstown | Luxury Glamping 45 Minutes Away",
  description:
    "Escape the crowds. Luxury glamping domes and lakeside cottage on Lake Dunstan, Cromwell — just 45 minutes from Queenstown. Private spas, wine country. From $295/night.",
};

const comparison = [
  {
    title: "Central Queenstown",
    items: ["Busy streets & tour groups", "Premium prices", "Difficult parking", "Late-night bar noise", "Hotel-style stays"],
    negative: true,
  },
  {
    title: "Lakeside Retreat, Cromwell",
    items: ["Peaceful lakeside, no crowds", "Luxury from $295/night", "Free parking", "Silent nights & stargazing", "Unique geodesic domes & cottage"],
    negative: false,
  },
];

const highlights = [
  { title: "Lake Dunstan", desc: "Swimming, kayaking, paddleboarding, fishing — direct lake access from the cottage" },
  { title: "Wine Country", desc: "30+ wineries within 15 min, some of the finest Pinot Noir in the world" },
  { title: "Cycle Trails", desc: "Otago Rail Trail 300m from your door, Lake Dunstan Cycle Trail nearby" },
  { title: "Mountain Views", desc: "Pisa Range panoramic views from your dome or cottage" },
  { title: "Stargazing", desc: "Minimal light pollution, Milky Way visible, dome skylights for viewing" },
  { title: "Private Spas", desc: "Both domes have private outdoor spas with mountain views" },
];

export default function WeekendGetawayPage() {
  return (
    <>
      <JsonLd data={[
        createArticleSchema({
          title: "The Perfect Weekend Escape from Queenstown",
          description: "Swap the crowds for calm lakeside luxury, just 45 minutes from Queenstown.",
          path: "/weekend-getaway-queenstown",
          image: "lake-mountains-perfect.jpg",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: "Weekend from Queenstown", path: "/weekend-getaway-queenstown" },
        ]),
      ]} />
      {/* Hero */}
      <section
        className="relative min-h-[60vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/images/lake-mountains-perfect.jpg')",
        }}
      >
        <div className="pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4">
            The Perfect Weekend Escape
          </h1>
          <p className="text-xl opacity-95 max-w-[700px] mx-auto">
            Swap the crowds for calm lakeside luxury, just 45 minutes from Queenstown
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200">
        <ol className="flex items-center gap-2 px-5 py-3 text-sm max-w-[1200px] mx-auto">
          <li><Link href="/" className="text-teal no-underline hover:underline">Home</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li><Link href="/guides" className="text-teal no-underline hover:underline">Guides</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li className="text-muted">Weekend from Queenstown</li>
        </ol>
      </nav>

      {/* Comparison */}
      <section className="py-20 px-5">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">
            Why Choose Cromwell Over Queenstown
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {comparison.map((col) => (
              <div
                key={col.title}
                className={`rounded-2xl p-8 ${col.negative ? "bg-gray-100" : "bg-cream border-2 border-teal"}`}
              >
                <h3 className="font-display text-xl mb-4">{col.title}</h3>
                <ul className="space-y-3">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <span className={`font-bold mt-0.5 ${col.negative ? "text-red-500" : "text-teal"}`}>
                        {col.negative ? "\u2717" : "\u2713"}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Here */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-6">
            Getting Here: A Scenic Drive You&apos;ll Enjoy
          </h2>
          <p className="text-lg leading-8 text-muted mb-8">
            The 45-minute drive from Queenstown passes through the stunning Kawarau Gorge, past
            the AJ Hackett Bungy bridge and the turquoise Kawarau River. It&apos;s one of the most
            scenic drives in New Zealand. Continue 30 minutes further and you&apos;re in Wanaka.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-cream rounded-xl px-6 py-3">
              <span className="font-bold text-teal">Queenstown</span>
              <span className="text-muted text-sm block">Start</span>
            </div>
            <span className="self-center text-muted">&rarr;</span>
            <div className="bg-cream rounded-xl px-6 py-3">
              <span className="font-bold text-teal">Kawarau Gorge</span>
              <span className="text-muted text-sm block">20 min scenic drive</span>
            </div>
            <span className="self-center text-muted">&rarr;</span>
            <div className="bg-teal text-white rounded-xl px-6 py-3">
              <span className="font-bold">Lakeside Retreat</span>
              <span className="text-white/80 text-sm block">45 min from Queenstown</span>
            </div>
            <span className="self-center text-muted">&rarr;</span>
            <div className="bg-cream rounded-xl px-6 py-3">
              <span className="font-bold text-teal">Wanaka</span>
              <span className="text-muted text-sm block">30 min further</span>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Love */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">
            What You&apos;ll Love About Staying Here
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((h) => (
              <div key={h.title} className="bg-white rounded-2xl p-6 shadow-md">
                <h3 className="font-display text-xl text-teal mb-2">{h.title}</h3>
                <p className="text-muted text-sm">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Better Value */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-6">Better Value, Better Experience</h2>
          <p className="text-lg leading-8 text-muted">
            Queenstown hotels charge $400+ per night in peak season. The Lakeside Cottage starts
            from $295/night, sleeps up to 3 guests, is pet-friendly, has a full kitchen, and
            direct lake access. Our domes offer a truly unique experience with private spas,
            panoramic skylights, and complete seclusion. Dining in Cromwell is more affordable
            with no parking fees or tourist markup.
          </p>
        </div>
      </section>

      {/* Where to Stay */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">Where to Stay</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { href: "/dome-pinot", image: "/images/Pinotfront.jpeg", title: "Dome Pinot", badge: "Adults Only", price: "From $530/night" },
              { href: "/dome-rose", image: "/images/dome-rose-spa1.jpeg", title: "Dome Ros\u00e9", badge: "Adults Only", price: "From $510/night" },
              { href: "/lakeside-cottage", image: "/images/lakeside-cottage-exterior.jpeg", title: "Lakeside Cottage", badge: "Pet Friendly", price: "From $295/night" },
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
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-lg text-teal">{acc.title}</h3>
                    <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                      {acc.badge}
                    </span>
                  </div>
                  <p className="text-burgundy font-semibold text-sm">{acc.price} &rarr;</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 bg-white text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">Book Your Weekend Getaway</h2>
          <Button href="/book">Book Your Stay</Button>
        </div>
      </section>
    </>
  );
}
