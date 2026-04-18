import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createArticleSchema, createBreadcrumbSchema, createFaqSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Autumn in Central Otago | Golden Vineyards & Harvest Season Accommodation",
  description:
    "Central Otago in autumn (March–May) is breathtaking — golden vineyards, pinot noir harvest, crisp spa evenings, and the best cycling of the year. Stay at Lakeside Retreat from $295/night.",
};

const autumnHighlights = [
  {
    title: "Golden Vineyards at Harvest",
    desc: "March and April bring Central Otago's pinot noir harvest — the vines turn gold and amber, cellar doors buzz with activity, and the landscape looks like a painting. With 30+ wineries within 15 minutes, you're perfectly placed to experience it.",
    image: "/images/vineyard-path.jpg",
    alt: "Golden autumn vineyards in Central Otago during pinot noir harvest season",
  },
  {
    title: "Outdoor Spa in Crisp Autumn Air",
    desc: "There is something especially magical about soaking in a hot saltwater spa as the air turns cool and the leaves change colour around you. Autumn evenings at Lakeside Retreat — when the mountains glow gold and the sky is perfectly clear — are simply unforgettable.",
    image: "/images/pinotspa.jpeg",
    alt: "Private outdoor spa at Lakeside Retreat with autumn mountain views, Central Otago",
  },
  {
    title: "Best Cycling Conditions of the Year",
    desc: "The Otago Rail Trail is at its finest in autumn. Cooler temperatures make for comfortable riding, the trees along the trail turn brilliant gold, and the crowds of summer have gone. The Cromwell to Clyde section starts just 300m from the retreat.",
    image: "/images/windowview.jpeg",
    alt: "Autumn cycling conditions on the Otago Rail Trail near Cromwell",
  },
];

const autumnActivities = [
  {
    title: "Pinot Noir Harvest Season",
    distance: "5–15 min",
    desc: "March–April is harvest time in Central Otago wine country. Visit Felton Road, Carrick, Mt Difficulty, and Bannockburn cellar doors for harvest tastings and behind-the-scenes winery experiences.",
  },
  {
    title: "Otago Rail Trail",
    distance: "300m",
    desc: "Autumn is the best season for the trail — golden poplars and willows line the route, temperatures are perfect for riding, and you'll have the path largely to yourself.",
  },
  {
    title: "Lake Dunstan Swimming",
    distance: "On-site",
    desc: "Early autumn (March–April) the lake is still warm from summer. The water is glassy calm in the mornings — perfect for a swim straight off the cottage deck.",
  },
  {
    title: "Bannockburn Heritage Walk",
    distance: "15 min",
    desc: "The historic gold mining landscape of Bannockburn Sluicings glows in autumn light. A dramatic walk through carved schist rock formations with sweeping views across the valley.",
  },
  {
    title: "Cromwell Farmers Market",
    distance: "12 min",
    desc: "The Cromwell Heritage Precinct hosts regular markets during the harvest season. Local produce, artisan food, wine, and crafts in a charming historic setting.",
  },
  {
    title: "Clyde & Alexandra Villages",
    distance: "25–35 min",
    desc: "Historic Central Otago towns with excellent cafes, art galleries, and restaurants. Autumn brings a relaxed, unhurried atmosphere — far better than the summer crowds.",
  },
];

const seasons = [
  { season: "March–May", label: "Autumn", temp: "5°C to 20°C", conditions: "Golden vineyards, harvest season, crisp evenings — many say the most beautiful time to visit." },
  { season: "June–August", label: "Winter", temp: "–2°C to 12°C", conditions: "Snow on mountains, frost mornings, crystal-clear nights — the most dramatic season." },
  { season: "September–November", label: "Spring", temp: "8°C to 18°C", conditions: "Blossom on the orchards, migratory birds return, the first warm days of the year." },
  { season: "December–February", label: "Summer", temp: "18°C to 30°C", conditions: "Long sunny days, lake swimming, cycling, vineyard lunches — peak season." },
];

export default function AutumnCentralOtagoPage() {
  return (
    <>
      <JsonLd data={[
        createArticleSchema({
          title: "Autumn in Central Otago | Golden Vineyards & Harvest Season Accommodation",
          description: "Central Otago in autumn — golden vineyards, pinot noir harvest, crisp spa evenings, and world-class cycling on the Otago Rail Trail.",
          path: "/autumn-central-otago",
          image: "vineyard-path.jpg",
          datePublished: "2025-03-01",
          dateModified: "2026-03-14",
        }),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: "Autumn in Central Otago", path: "/autumn-central-otago" },
        ]),
        createFaqSchema([
          { question: "When is autumn in Central Otago?", answer: "Autumn in Central Otago runs from March through May. March and April are the peak harvest months with the most dramatic colour in the vineyards. May brings cooler temperatures and the first frosts, which create spectacular conditions for the spa and stargazing." },
          { question: "What is Central Otago like in autumn?", answer: "Autumn is arguably the most beautiful season in Central Otago. The vineyards turn gold and amber during pinot noir harvest (March–April), the Otago Rail Trail is at its best with autumn foliage, the lake is still warm enough for swimming, and the evenings are perfect for soaking in a private outdoor spa under clear skies." },
          { question: "Is the Otago Rail Trail good in autumn?", answer: "Autumn is the best season for the Otago Rail Trail. Temperatures are comfortable for cycling (typically 10–20°C during the day), the poplars and willows along the trail turn brilliant gold in April, and the crowds are far smaller than summer. The Cromwell to Clyde section starts just 300m from Lakeside Retreat." },
          { question: "Can I swim in Lake Dunstan in autumn?", answer: "Yes — Lake Dunstan stays warm well into autumn. March and April are ideal for swimming, with water temperatures typically around 18–20°C following the summer. The Lakeside Cottage has direct lake access for swimming straight off the deck." },
          { question: "What is the pinot noir harvest season in Central Otago?", answer: "The Central Otago pinot noir harvest typically runs from late March through April. It's a wonderful time to visit the region — cellar doors are busy, many wineries offer harvest experiences and special tastings, and the vineyard landscapes are at their most spectacular with golden and amber tones." },
        ]),
      ]} />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/images/vineyard-path.jpg"
          alt="Golden autumn vineyards in Central Otago during harvest season"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative max-w-[750px] px-5 pt-20">
          <h1 className="font-display text-5xl md:text-6xl text-white mb-4 drop-shadow-lg">
            Autumn in Central Otago
          </h1>
          <p className="text-xl mb-8 opacity-95">
            Golden vineyards, pinot noir harvest, crisp spa evenings,
            and the best cycling of the year. March–May is magical.
          </p>
          <Button href="/book">Book an Autumn Stay</Button>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200">
        <ol className="flex items-center gap-2 px-5 py-3 text-sm max-w-[1200px] mx-auto">
          <li><Link href="/" className="text-burgundy no-underline hover:underline">Home</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li><Link href="/guides" className="text-burgundy no-underline hover:underline">Guides</Link></li>
          <li className="text-gray-400">&rsaquo;</li>
          <li className="text-muted">Autumn in Central Otago</li>
        </ol>
      </nav>

      {/* Intro */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-6">
            Why Autumn Is Central Otago at Its Most Beautiful
          </h2>
          <p className="text-lg leading-8 text-muted mb-6">
            Ask any local which season they love most and many will say autumn. From
            March to May, Central Otago undergoes a transformation — the vineyards
            turn from green to blazing gold and amber, the pinot noir harvest fills the
            air with the smell of fermenting grapes, and the crowds of summer have gone.
          </p>
          <p className="text-lg leading-8 text-muted">
            Lakeside Retreat sits in the heart of it all — surrounded by 30+ wineries,
            300 metres from the{" "}
            <Link href="/otago-rail-trail-accommodation" className="text-burgundy no-underline hover:underline">Otago Rail Trail</Link>
            , and on the shores of Lake Dunstan. The outdoor spas feel perfect in the
            crisp autumn air, and the night skies become increasingly spectacular as
            the evenings cool.
          </p>
        </div>
      </section>

      {/* Autumn highlights */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">
            What Makes Autumn Special Here
          </h2>
          <div className="space-y-16">
            {autumnHighlights.map((h, i) => (
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

      {/* Harvest callout */}
      <section className="py-16 px-5 bg-burgundy text-white text-center">
        <div className="max-w-[800px] mx-auto">
          <p className="font-display text-3xl mb-3">
            &#127815; Harvest Season. Golden Vines. Crisp Spa Evenings.
          </p>
          <p className="text-white/90 text-lg">
            30+ wineries within 15 minutes. Pinot noir harvest runs March–April.
          </p>
        </div>
      </section>

      {/* Autumn activities */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">
            Autumn Activities Near Lakeside Retreat
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {autumnActivities.map((a) => (
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
                className={`rounded-2xl p-6 ${s.label === "Autumn" ? "bg-burgundy text-white ring-2 ring-teal" : "bg-cream"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-display text-xl ${s.label === "Autumn" ? "text-white" : "text-burgundy"}`}>
                    {s.label} {s.label === "Autumn" && "★"}
                  </h3>
                  <span className={`text-sm font-semibold ${s.label === "Autumn" ? "text-white/80" : "text-burgundy"}`}>{s.temp}</span>
                </div>
                <p className={`text-xs font-semibold mb-2 ${s.label === "Autumn" ? "text-white/90" : "text-muted"}`}>{s.season}</p>
                <p className={`text-sm leading-6 ${s.label === "Autumn" ? "text-white/90" : "text-muted"}`}>{s.conditions}</p>
                {s.label === "Winter" && (
                  <Link href="/winter-glamping-central-otago" className="text-xs text-burgundy no-underline hover:underline mt-2 block">
                    See our winter glamping guide &rarr;
                  </Link>
                )}
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
            &ldquo;Came in April for harvest season. The vines were extraordinary — gold and red as far
            as you could see. Soaking in the spa at sunset was one of the best moments of our trip.&rdquo;
          </blockquote>
          <p className="text-muted text-sm">Emma &amp; Will — Christchurch &bull; Dome Ros&eacute; &bull; April 2025</p>
        </div>
      </section>

      {/* Properties */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">Book Your Autumn Stay</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                href: "/dome-pinot",
                bookHref: "/book?a=dome-pinot",
                image: "/images/Pinotfront.jpeg",
                title: "Dome Pinot",
                price: "From $530/night",
                autumn: ["Private outdoor spa for cool evenings", "Stargazing skylight — clear autumn skies", "Panoramic vineyard & lake views", "Continental breakfast included"],
              },
              {
                href: "/dome-rose",
                bookHref: "/book?a=dome-rose",
                image: "/images/dome-rose-spa1.jpeg",
                title: "Dome Ros\u00e9",
                price: "From $510/night",
                autumn: ["Private outdoor spa", "Vineyard & mountain views", "Luxury super king bed", "Outdoor dining deck — perfect in autumn"],
              },
            ].map((dome) => (
              <div key={dome.href} className="bg-cream rounded-2xl overflow-hidden shadow-lg">
                <Link href={dome.href} className="block relative h-[220px]">
                  <Image src={dome.image} alt={`${dome.title} autumn glamping dome`} fill className="object-cover" sizes="50vw" />
                </Link>
                <div className="p-6">
                  <h3 className="font-display text-2xl text-burgundy mb-1">{dome.title}</h3>
                  <p className="text-burgundy font-semibold mb-4">{dome.price}</p>
                  <ul className="space-y-2 mb-5">
                    {dome.autumn.map((w) => (
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
          <div className="mt-8 bg-cream rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl text-burgundy mb-1">Lakeside Cottage</h3>
              <p className="text-muted text-sm">From $295/night &bull; Sleeps 3 &bull; Wood-fired hot tub &bull; Dog-friendly &bull; Direct lake access</p>
            </div>
            <Button href="/book?a=lakeside-cottage">Book Cottage &rarr;</Button>
          </div>
          <p className="text-center text-muted text-sm mt-6">
            Strictly adults only (domes) &bull; Continental breakfast included &bull;{" "}
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
              { href: "/winter-glamping-central-otago", title: "Winter Glamping Guide", desc: "Snow views, ski fields & cosy dome evenings" },
              { href: "/glamping-central-otago", title: "Glamping Central Otago", desc: "Our full glamping guide for all seasons" },
              { href: "/otago-rail-trail-accommodation", title: "Otago Rail Trail Stays", desc: "300m from the Cromwell trailhead" },
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
          <h2 className="font-display text-4xl mb-4">Book Your Autumn Escape</h2>
          <p className="text-lg text-muted mb-8">
            Central Otago autumn stays available March through May. Book direct for
            the best rate — no Airbnb fees, direct host communication.
          </p>
          <Button href="/book">Check Autumn Availability</Button>
        </div>
      </section>
    </>
  );
}
