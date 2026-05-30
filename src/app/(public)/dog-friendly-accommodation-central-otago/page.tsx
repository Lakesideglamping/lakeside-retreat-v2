import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createArticleSchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Dog-Friendly Accommodation Central Otago | Lakeside Cottage, Cromwell",
  description:
    "Pet-friendly accommodation on Lake Dunstan, Central Otago. The Lakeside Cottage welcomes dogs with direct lake access, a secure outdoor area, and a BBQ deck. $365/night.",

  alternates: { canonical: "/dog-friendly-accommodation-central-otago" },
  openGraph: {
    title: "Dog-Friendly Accommodation Central Otago | Lakeside Cottage, Cromwell",
    description: "Pet-friendly accommodation on Lake Dunstan, Central Otago. The Lakeside Cottage welcomes dogs with direct lake access, a secure outdoor area, and a BBQ deck. $365/night.",
    url: "https://lakesideretreat.co.nz/dog-friendly-accommodation-central-otago",
    images: [
      {
        url: "/images/lakeside-cottage-exterior.jpeg",
        width: 1200,
        height: 800,
        alt: "Dog-friendly Lakeside Cottage on Lake Dunstan, Central Otago",
      },
    ],
    type: "article",
  },
};

const features = [
  { title: "Direct Lake Access", desc: "Walk from your cottage door straight to Lake Dunstan for a swim. Dogs love the calm, clear water." },
  { title: "Secure Outdoor Area", desc: "Fenced outdoor space so your dog can roam safely while you relax on the deck." },
  { title: "Flat Pet Fee", desc: "A single flat $25 pet fee per stay — not per night. No hidden charges." },
  { title: "Deck by the Water", desc: "Your own deck overlooking the lake — a safe spot to sit with your dog as the sun sets." },
  { title: "Wood-Fired Hot Tub", desc: "Chemical-free cedar tub by the lake — no chlorine, no fumes. Safe to have the dog nearby while you soak." },
  { title: "Kitchenette & BBQ", desc: "Cook at home with a hotplate, microwave, dishwasher, and a gas BBQ on the deck. No worries about restaurants." },
  { title: "Dog-Friendly Trails", desc: "The Otago Rail Trail is 300m away and dog-friendly. Lake Dunstan Cycle Trail too." },
];

const nearbyWalks = [
  { name: "Otago Rail Trail (Cromwell–Clyde)", distance: "300m from cottage", details: "Flat, graded trail. Dogs welcome on lead." },
  { name: "Lake Dunstan shoreline walk", distance: "On-site", details: "Follow the lake edge for kilometres in either direction." },
  { name: "Cromwell Heritage Precinct", distance: "12 min drive", details: "Dog-friendly outdoor area around the historic precinct." },
  { name: "Bannockburn Sluicings Walk", distance: "15 min drive", details: "Historic gold mining landscape, dogs on lead." },
];

export default function DogFriendlyAccommodationPage() {
  return (
    <>
      <JsonLd data={[
        createArticleSchema({
          title: "Dog-Friendly Accommodation Central Otago | Lakeside Cottage, Cromwell",
          description: "Pet-friendly lakeside cottage on Lake Dunstan, Central Otago — direct lake access, secure outdoor area, dog-friendly trails.",
          path: "/dog-friendly-accommodation-central-otago",
          image: "lakeside-cottage-exterior.jpeg",
          datePublished: "2025-04-01",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Dog-Friendly Accommodation", path: "/dog-friendly-accommodation-central-otago" },
        ]),
        createFaqSchema([
          { question: "Is there dog-friendly accommodation in Central Otago?", answer: "Yes — Lakeside Retreat's Lakeside Cottage on Lake Dunstan is dog-friendly and welcomes well-behaved dogs with prior approval. The cottage has direct lake access, a secure outdoor area, and is 300 metres from the dog-friendly Otago Rail Trail. A flat $25 pet fee applies per stay." },
          { question: "Can I bring my dog to Cromwell?", answer: "Cromwell is a great destination for dogs. Lakeside Retreat's Lakeside Cottage accommodates dogs and puts you close to dog-friendly walks including the Otago Rail Trail, Lake Dunstan shoreline, and Bannockburn Sluicings. The Cromwell Heritage Precinct also has outdoor areas suitable for dogs." },
          { question: "What is the pet fee at Lakeside Retreat?", answer: "A flat $25 pet fee applies per stay (not per night). This covers additional cleaning and any wear and tear from your pet. Please notify us when booking that you're bringing a dog." },
          { question: "Are the glamping domes dog-friendly?", answer: "No — Dome Pinot and Dome Rosé are adults-only and strictly no pets. Our adults-only Lakeside Cottage is the one property that welcomes dogs." },
        ]),
      ]} />

      {/* Hero */}
      <section className="relative min-h-[65vh] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/images/lakeside-cottage-exterior.jpeg"
          alt="Dog-friendly Lakeside Cottage on Lake Dunstan, Central Otago"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative max-w-[750px] px-5 pt-20">
          <h1 className="font-display text-5xl md:text-6xl text-white mb-4 drop-shadow-lg">
            Dog-Friendly Accommodation<br />Central Otago
          </h1>
          <p className="text-xl mb-8 opacity-95">
            Adults-only lakefront cottage that welcomes your dog too.
            Step off the deck into Lake Dunstan.
          </p>
          <Button href="/book?a=lakeside-cottage">Book the Cottage</Button>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200">
        <ol className="flex items-center gap-2 px-5 py-3 text-sm max-w-[1200px] mx-auto">
          <li><Link href="/" className="text-burgundy no-underline hover:underline">Home</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li className="text-muted">Dog-Friendly Accommodation Central Otago</li>
        </ol>
      </nav>

      {/* Intro */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="bg-burgundy text-white px-4 py-2 rounded-full text-sm font-semibold inline-block mb-4">
              Pet Friendly &#128054;
            </span>
            <h2 className="font-display text-4xl mb-6">
              Lakeside Cottage Welcomes Your Dog
            </h2>
            <p className="text-lg leading-8 text-muted mb-4">
              Finding quality dog-friendly accommodation in Central Otago can be difficult. The
              Lakeside Cottage at Lakeside Retreat is genuinely pet-welcoming — not just
              tolerating your dog, but set up to make your stay as easy as possible.
            </p>
            <p className="text-lg leading-8 text-muted mb-6">
              Direct lake access means your dog can swim to their heart&apos;s content. A secure
              outdoor area gives them space to explore safely. And the{" "}
              <Link href="/otago-rail-trail-accommodation" className="text-burgundy no-underline hover:underline">Otago Rail Trail</Link>
              {" "}is just 300 metres away for epic walks.
            </p>
            <div className="bg-cream rounded-xl p-5">
              <p className="font-semibold text-body mb-1">Lakeside Cottage — Quick Facts</p>
              <ul className="text-sm text-muted space-y-1">
                <li>&#10003; Queen bed + sofa pullout, sleeps 3</li>
                <li>&#10003; Direct Lake Dunstan access</li>
                <li>&#10003; Dogs welcome (prior approval, $25 flat fee)</li>
                <li>&#10003; Wood-fired cedar hot tub (no chemicals)</li>
                <li>&#10003; Kitchenette &amp; outdoor BBQ</li>
                <li>&#10003; Heat pump (heating &amp; AC)</li>
                <li>&#10003; $365/night</li>
              </ul>
            </div>
          </div>
          <div className="relative h-[450px] rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/images/cottagebedroom.jpeg"
              alt="Lakeside Cottage interior — dog-friendly accommodation Central Otago"
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">
            Why Dogs (and Their Owners) Love It Here
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-cream rounded-2xl p-6">
                <h3 className="font-display text-xl text-burgundy mb-2">{f.title}</h3>
                <p className="text-muted text-sm leading-6">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby walks */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-10">
            Dog-Friendly Walks Near Cromwell
          </h2>
          <div className="space-y-4">
            {nearbyWalks.map((walk) => (
              <div key={walk.name} className="bg-white rounded-xl p-6 shadow-sm flex gap-5 items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-body">{walk.name}</h3>
                  <p className="text-muted text-sm">{walk.details}</p>
                </div>
                <span className="text-burgundy font-semibold text-sm whitespace-nowrap">{walk.distance}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-8">Pet Policy</h2>
          <div className="bg-cream rounded-2xl p-8">
            <ul className="space-y-4 text-body">
              <li className="flex items-start gap-3">
                <span className="text-burgundy font-bold mt-1">&#10003;</span>
                <span>Well-behaved dogs welcome with prior approval — please let us know when booking</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-burgundy font-bold mt-1">&#10003;</span>
                <span>Flat $25 pet fee per stay (not per night)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-burgundy font-bold mt-1">&#10003;</span>
                <span>Dogs must not be left unattended inside the cottage</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-burgundy font-bold mt-1">&#10003;</span>
                <span>Dogs must be kept on lead around the lake edge and on all walking trails</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-burgundy font-bold mt-1">&#10003;</span>
                <span>Maximum 2 dogs per booking</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Related Guides */}
      <section className="py-16 px-5 bg-cream">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-2xl text-center mb-8">Also Explore</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { href: "/otago-rail-trail-accommodation", title: "Otago Rail Trail Guide", desc: "300m away — walk to the Cromwell trailhead" },
              { href: "/glamping-central-otago", title: "Glamping Domes", desc: "For couples (strictly 18+ adults only, no pets)" },
              { href: "/luxury-accommodation-cromwell", title: "All Our Accommodation", desc: "Compare all three properties at Lakeside Retreat" },
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
          <h2 className="font-display text-4xl mb-4">Book Your Dog-Friendly Stay</h2>
          <p className="text-lg text-muted mb-8">
            Lakeside Cottage $365/night. Direct lake access. Otago Rail Trail 300m away.
            Dogs welcome with prior approval.
          </p>
          <Button href="/book?a=lakeside-cottage">Check Availability</Button>
          <p className="text-sm text-muted mt-6">
            Have questions about bringing your pet? <Link href="/contact" className="text-burgundy no-underline hover:underline">Contact us</Link> and we&apos;ll help.
          </p>
        </div>
      </section>
    </>
  );
}
