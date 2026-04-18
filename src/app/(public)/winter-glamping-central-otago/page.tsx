import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createArticleSchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Winter Glamping Central Otago | Cosy Domes, Outdoor Spas & Snow Views",
  description:
    "Winter glamping on Lake Dunstan — soak in your private outdoor spa with snow-capped Pisa Range views. Heated geodesic domes from $615/night. Central Otago's best winter escape.",
};

const winterHighlights = [
  {
    title: "Private Outdoor Spa in the Snow",
    desc: "There is nothing quite like soaking in a hot saltwater spa while snow sits on the mountain peaks above you. Each dome has its own private outdoor spa — warm water, cold air, extraordinary views.",
    image: "/images/pinotspa.jpeg",
    alt: "Private outdoor spa at Lakeside Retreat with snow-capped mountain views, Central Otago winter",
  },
  {
    title: "Cosy Dome Interiors",
    desc: "Our geodesic domes are engineered for exceptional insulation. An efficient heat pump, insulated twin-wall panels, and a warm interior make them a perfect winter cocoon.",
    image: "/images/windowview.jpeg",
    alt: "Warm cosy interior of Dome Pinot with views over winter Lake Dunstan",
  },
  {
    title: "Stargazing at Its Best",
    desc: "Winter nights in Central Otago are among the clearest in New Zealand. The Milky Way, Southern Cross, and Magellanic Clouds are spectacular. Dome Pinot's skylight puts the galaxy directly above your bed.",
    image: "/images/pinotinternal.jpeg",
    alt: "Dome Pinot interior with stargazing skylight — winter glamping Central Otago",
  },
];

const winterActivities = [
  {
    title: "Ski Cardrona",
    distance: "55 min",
    desc: "One of New Zealand's best ski resorts. Cardrona offers excellent groomed runs, a terrain park, and a beginner-friendly learner area. Day passes available, ski hire on-site.",
  },
  {
    title: "Ski Treble Cone",
    distance: "75 min",
    desc: "New Zealand's largest skiable terrain with challenging off-piste runs. Stunning views over Lake Wanaka. Best suited to intermediate and advanced skiers.",
  },
  {
    title: "Central Otago Wine Tasting",
    distance: "5–15 min",
    desc: "Winter is the best time for intimate cellar door visits — no crowds. Felton Road, Carrick, and Mt Difficulty are open year-round with cosy tasting rooms.",
  },
  {
    title: "Otago Rail Trail",
    distance: "300m",
    desc: "The trail is open year-round. Winter riding offers dramatic frost landscapes, crisp air, and zero other cyclists. The flat Cromwell–Clyde section is manageable in most winter conditions.",
  },
  {
    title: "Cromwell Heritage Precinct",
    distance: "12 min",
    desc: "Explore Cromwell's charming historic precinct, boutique stores, and the best coffee in town at The Stone Cottage. A perfect base for a winter morning out.",
  },
  {
    title: "Clyde & Alexandra",
    distance: "25–35 min",
    desc: "Historic Central Otago towns with art galleries, cafes, and excellent restaurants. Particularly peaceful in winter months with a cosy small-town atmosphere.",
  },
];

const seasons = [
  { season: "June–August", label: "Winter", temp: "–2°C to 12°C", conditions: "Snow on mountains, frost mornings, crystal-clear nights — the most dramatic season." },
  { season: "September–November", label: "Spring", temp: "8°C to 18°C", conditions: "Blossom on the orchards, migratory birds return, the first warm days of the year." },
  { season: "December–February", label: "Summer", temp: "18°C to 30°C", conditions: "Long sunny days, lake swimming, cycling, vineyard lunches — peak season." },
  { season: "March–May", label: "Autumn", temp: "5°C to 20°C", conditions: "Golden vineyards, harvest season, cooler evenings — many say the most beautiful time to visit." },
];

export default function WinterGlampingPage() {
  return (
    <>
      <JsonLd data={[
        createArticleSchema({
          title: "Winter Glamping Central Otago | Cosy Domes, Outdoor Spas & Snow Views",
          description: "Winter glamping on Lake Dunstan — soak in your private outdoor spa with snow-capped Pisa Range views. Heated geodesic domes, stargazing, and skiing nearby.",
          path: "/winter-glamping-central-otago",
          image: "domesmountainview.jpeg",
          datePublished: "2025-06-01",
          dateModified: "2026-03-01",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: "Winter Glamping", path: "/winter-glamping-central-otago" },
        ]),
        createFaqSchema([
          { question: "Is glamping in winter Central Otago worth it?", answer: "Absolutely. Winter is arguably the best time to glamp at Lakeside Retreat. The private outdoor spas feel incredible in the cold, the mountain views are dramatic with snow on the Pisa Range, and the night skies are at their clearest. Cardrona ski field is 55 minutes away, and Central Otago's 30+ wineries are open year-round." },
          { question: "Are the glamping domes warm enough in winter?", answer: "Yes — both domes are engineered for exceptional insulation. They feature a heat pump, insulated twin-wall panels, and a fully heated bathroom. Guests frequently stay in winter and comment on how cosy the domes are." },
          { question: "How cold does it get in Central Otago in winter?", answer: "Central Otago has a continental climate — cold, clear winters. Temperatures typically range from around -2°C overnight to 12°C during the day. Snow falls on surrounding mountains (including the Pisa Range directly behind Lakeside Retreat) and occasionally at property level, though this is less common." },
          { question: "Can I ski and glamp in Central Otago?", answer: "Yes — Cardrona Ski Resort is 55 minutes from Lakeside Retreat and Treble Cone is 75 minutes. Many guests ski during the day and return to their private spa and warm dome in the evening. It's one of the most popular winter itineraries at the retreat." },
          { question: "What is the best time to visit Central Otago?", answer: "Central Otago is spectacular year-round. Winter (June–August) offers snow views, ski access, and cosy spa evenings. Autumn (March–May) brings golden vineyards and harvest season. Summer (December–February) has long sunny days and lake swimming. Spring (September–November) has orchard blossoms and emerging greenery." },
        ]),
      ]} />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/images/domesmountainview.jpeg"
          alt="Luxury glamping domes at Lakeside Retreat with snow-capped mountain views, Central Otago winter"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative max-w-[750px] px-5 pt-20">
          <h1 className="font-display text-5xl md:text-6xl text-white mb-4 drop-shadow-lg">
            Winter Glamping<br />Central Otago
          </h1>
          <p className="text-xl mb-8 opacity-95">
            Soak in a private outdoor spa with snow on the mountains above you.
            Heated geodesic domes, stargazing skies, and ski fields nearby.
          </p>
          <Button href="/book">Book a Winter Stay</Button>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200">
        <ol className="flex items-center gap-2 px-5 py-3 text-sm max-w-[1200px] mx-auto">
          <li><Link href="/" className="text-burgundy no-underline hover:underline">Home</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li><Link href="/guides" className="text-burgundy no-underline hover:underline">Guides</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li className="text-muted">Winter Glamping</li>
        </ol>
      </nav>

      {/* Intro */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-6">
            Why Winter Is the Best Time to Glamp in Central Otago
          </h2>
          <p className="text-lg leading-8 text-muted mb-6">
            Most people think of glamping as a summer activity. They&apos;re missing out. Central
            Otago in winter is a completely different — and extraordinary — experience. Snow
            caps the Pisa Range directly behind the retreat. The nights are crystal clear with
            minimal light pollution. The private outdoor spas feel incredible in the cold air.
            And the whole region is quieter, more intimate, and more affordable.
          </p>
          <p className="text-lg leading-8 text-muted">
            Add Cardrona Ski Resort 55 minutes away, 30+ wineries open year-round in their
            cosiest season, and a warm geodesic dome to return to each evening — and
            you&apos;ve got one of New Zealand&apos;s best winter getaways.
          </p>
        </div>
      </section>

      {/* Winter highlights */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">
            What Makes Winter Glamping Special Here
          </h2>
          <div className="space-y-16">
            {winterHighlights.map((h, i) => (
              <div key={h.title} className={`grid md:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}>
                <div className={`relative h-[350px] rounded-2xl overflow-hidden shadow-lg ${i % 2 === 1 ? "md:[direction:ltr]" : ""}`}>
                  <Image src={h.image} alt={h.alt} fill className="object-cover" sizes="50vw" />
                </div>
                <div className={i % 2 === 1 ? "md:[direction:ltr]" : ""}>
                  <h3 className="font-display text-3xl mb-4">{h.title}</h3>
                  <p className="text-lg leading-8 text-muted">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ski callout */}
      <section className="py-16 px-5 bg-burgundy text-white text-center">
        <div className="max-w-[800px] mx-auto">
          <p className="font-display text-3xl mb-3">
            &#9969; Ski by Day. Soak by Night.
          </p>
          <p className="text-white/90 text-lg">
            Cardrona Ski Resort is 55 minutes away. Return to your private outdoor spa each evening.
          </p>
        </div>
      </section>

      {/* Winter activities */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">
            Winter Activities Near Lakeside Retreat
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {winterActivities.map((a) => (
              <div key={a.title} className="bg-white rounded-2xl p-6 shadow-md">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display text-xl text-burgundy">{a.title}</h3>
                  <span className="text-burgundy font-semibold text-sm whitespace-nowrap">{a.distance}</span>
                </div>
                <p className="text-muted text-sm leading-6">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seasons guide */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">
            Central Otago Season by Season
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {seasons.map((s) => (
              <div
                key={s.season}
                className={`rounded-2xl p-6 ${s.label === "Winter" ? "bg-burgundy text-white ring-2 ring-teal" : "bg-cream"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-display text-xl ${s.label === "Winter" ? "text-white" : "text-burgundy"}`}>
                    {s.label} {s.label === "Winter" && "★"}
                  </h3>
                  <span className={`text-sm font-semibold ${s.label === "Winter" ? "text-white/80" : "text-burgundy"}`}>{s.temp}</span>
                </div>
                <p className={`text-xs font-semibold mb-2 ${s.label === "Winter" ? "text-white/90" : "text-muted"}`}>{s.season}</p>
                <p className={`text-sm leading-6 ${s.label === "Winter" ? "text-white/90" : "text-muted"}`}>{s.conditions}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Review */}
      <section className="py-20 px-5">
        <div className="max-w-[700px] mx-auto text-center">
          <div className="text-yellow-500 text-3xl mb-4" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <blockquote className="font-display text-2xl text-burgundy italic mb-4">
            &ldquo;Came in July. Snow on the mountains, spa was incredible, the stars through the skylight
            were unforgettable. We&apos;re coming back every winter.&rdquo;
          </blockquote>
          <p className="text-muted text-sm">Mike &amp; Claire — Wellington &bull; Dome Pinot &bull; July 2025</p>
        </div>
      </section>

      {/* Domes */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">Book Your Winter Dome</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                href: "/dome-pinot",
                bookHref: "/book?a=dome-pinot",
                image: "/images/Pinotfront.jpeg",
                title: "Dome Pinot",
                price: "$635/night",
                winter: ["Heat pump climate control", "Stargazing skylight above bed", "Private outdoor saltwater spa", "Panoramic Pisa Range snow views"],
              },
              {
                href: "/dome-rose",
                bookHref: "/book?a=dome-rose",
                image: "/images/dome-rose-spa1.jpeg",
                title: "Dome Ros\u00e9",
                price: "$615/night",
                winter: ["Heat pump climate control", "Private outdoor saltwater spa", "Mountain & vineyard views", "Outdoor dining deck with heater"],
              },
            ].map((dome) => (
              <div key={dome.href} className="bg-cream rounded-2xl overflow-hidden shadow-lg">
                <Link href={dome.href} className="block relative h-[220px]">
                  <Image src={dome.image} alt={`${dome.title} winter glamping dome`} fill className="object-cover" sizes="50vw" />
                </Link>
                <div className="p-6">
                  <h3 className="font-display text-2xl text-burgundy mb-1">{dome.title}</h3>
                  <p className="text-burgundy font-semibold mb-4">{dome.price}</p>
                  <ul className="space-y-2 mb-5">
                    {dome.winter.map((w) => (
                      <li key={w} className="flex items-center gap-2 text-sm text-body">
                        <span className="text-burgundy font-bold">&#10003;</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                  <Button href={dome.bookHref} className="w-full text-center">
                    Book {dome.title} &rarr;
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-muted text-sm mt-6">
            Strictly adults only &bull; Continental breakfast included &bull;{" "}
            <Link href="/contact" className="text-burgundy no-underline hover:underline">Questions? Contact us</Link>
          </p>
        </div>
      </section>

      {/* Related Guides */}
      <section className="py-16 px-5 bg-cream">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-2xl text-center mb-8">Also Explore</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { href: "/glamping-central-otago", title: "Glamping Central Otago", desc: "Our full glamping guide — all seasons" },
              { href: "/otago-rail-trail-accommodation", title: "Otago Rail Trail Stays", desc: "Ride the trail in winter, return to your private spa" },
              { href: "/luxury-accommodation-cromwell", title: "Luxury Accommodation Cromwell", desc: "All three of our properties — domes & cottage" },
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
          <h2 className="font-display text-4xl mb-4">Book Your Winter Glamping Escape</h2>
          <p className="text-lg text-muted mb-8">
            Central Otago winter stays are available June through August. Book direct for the
            best rate — no Airbnb fees, direct host communication.
          </p>
          <Button href="/book">Check Winter Availability</Button>
        </div>
      </section>
    </>
  );
}
