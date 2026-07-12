import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeroBackground } from "@/components/hero-background";
import { JsonLd, createBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Central Otago Travel Guides | Insider Tips from Lakeside Retreat",
  description:
    "Expert guides for your Central Otago stay: Otago Rail Trail cycling, Lake Dunstan activities, Central Otago wine trails, and day trips to Queenstown and Wanaka.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Central Otago Travel Guides | Lakeside Retreat",
    description:
      "Otago Rail Trail, Lake Dunstan activities, wine trails, and day trips \u2014 local insider tips from your Cromwell hosts.",
    url: "https://lakesideretreat.co.nz/guides",
    images: [{ url: "/images/lakeview.jpeg", width: 1200, height: 800, alt: "Central Otago travel guides" }],
    type: "website",
  },
};

const guides = [
  {
    category: "Glamping",
    title: "Glamping in Central Otago: The Complete Guide",
    image: "/images/IMG_8536.jpg",
    excerpt: "Everything you need to know about luxury glamping on Lake Dunstan — domes, spas, stargazing, and wine country.",
    href: "/glamping-central-otago",
  },
  {
    category: "Seasonal",
    title: "Winter Glamping in Central Otago",
    image: "/images/IMG_1266-1920x1080.jpeg",
    excerpt: "Soak in a private outdoor spa with snow on the mountains. Ski Cardrona by day, stargaze by night.",
    href: "/winter-glamping-central-otago",
  },
  {
    category: "Seasonal",
    title: "Autumn in Central Otago: Harvest Season Guide",
    image: "/images/lakeviewautumn.jpeg",
    excerpt: "Golden vineyards, pinot noir harvest, and crisp spa evenings. March–May is Central Otago at its most beautiful.",
    href: "/autumn-central-otago",
  },
  {
    category: "Accommodation",
    title: "Dog-Friendly Accommodation in Central Otago",
    image: "/images/lakeside-cottage-exterior.jpeg",
    excerpt: "Adults-only lakefront cottage that welcomes your dog too. Direct Lake Dunstan access and a wood-fired hot tub.",
    href: "/dog-friendly-accommodation-central-otago",
  },
  {
    category: "Cycling",
    title: "Central Otago Cycle Trails: Accommodation & Guide",
    image: "/images/CycleTrailSpring.jpeg",
    excerpt: "Stay 300m from the trailhead. Everything you need to know about NZ's original Great Ride.",
    href: "/otago-rail-trail-accommodation",
  },
  {
    category: "Water Activities",
    title: "Lake Dunstan: Swimming, Fishing & More",
    image: "/images/OldTownCromwell.jpeg",
    excerpt: "Your guide to water activities on Lake Dunstan, from swimming spots to the best fishing coves.",
    href: "/cromwell-activities",
  },
  {
    category: "Day Trips",
    title: "Queenstown Day Trip: Adventure Awaits",
    image: "/images/Queenstown.jpeg",
    excerpt: "Bungy, gondola, jet boat, Arrowtown — then back to your spa or wood-fired hot tub. Queenstown is just 45 minutes away.",
    href: "/weekend-getaway-queenstown",
  },
  {
    category: "Day Trips",
    title: "Wanaka: Lakes, Mountains & That Tree",
    image: "/images/Wanaka.jpeg",
    excerpt: "That Tree, Roy's Peak, Rippon Vineyard, and great cafés — just 45 minutes from Lakeside Retreat.",
    href: "/wanaka-day-trip",
  },
  {
    category: "Seasonal",
    title: "Best Time to Visit Central Otago",
    image: "/images/LakeDunstanReflaction.jpeg",
    excerpt: "A season-by-season guide to Central Otago — autumn harvest, winter snow, spring blossom, and long summer days.",
    href: "/autumn-central-otago",
  },
  {
    category: "Food & Dining",
    title: "Food & Dining in Central Otago",
    image: "/images/Fruits.jpeg",
    excerpt: "Winery restaurants, Cromwell Heritage Precinct cafés, Wanaka dining, stone fruit stalls, and local produce guides.",
    href: "/food-dining-central-otago",
  },
];

export default function GuidesPage() {
  return (
    <>
      <JsonLd data={[
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ]),
      ]} />
      {/* Hero */}
      <HeroBackground
        src="/images/20260422155523_0057.JPG"
        alt="Central Otago vineyard near Lakeside Retreat"
        minHeight="50vh"
      >
        <h1 className="font-display text-5xl text-white mb-4">Local Guides &amp; Tips</h1>
        <p className="text-xl opacity-95 max-w-[700px] mx-auto">
          Insider knowledge from your hosts to help you make the most of your Central Otago
          adventure
        </p>
      </HeroBackground>

      {/* Featured Guide */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg grid md:grid-cols-2">
            <Image
              src="/images/vineyard.jpeg"
              alt="Central Otago vineyard with mountain backdrop"
              width={800}
              height={600}
              className="w-full h-full object-cover min-h-[300px]"
            />
            <div className="p-10 flex flex-col justify-center">
              <span className="text-burgundy text-sm font-semibold mb-2">Featured Guide</span>
              <h2 className="font-display text-3xl mb-4">
                The Ultimate Central Otago Wine Trail
              </h2>
              <p className="text-muted leading-7 mb-6">
                Central Otago is renowned for producing some of the world&apos;s finest Pinot Noir.
                With 30+ wineries within 15 minutes of Lakeside Retreat, you&apos;re perfectly
                positioned to explore. Start at Carrick Winery for organic wines and lunch, then
                visit Mt Difficulty for stunning views, and finish at Wooing Tree, experience their brand-new modern cellar door.
              </p>
              <div>
                <Link
                  href="/central-otago-wine-trail"
                  className="inline-block px-8 py-3 rounded-full bg-gradient-to-br from-burgundy to-teal-dark text-white no-underline font-semibold hover:opacity-90 transition-opacity"
                >
                  Explore Wine Country
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Cards */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">Travel Guides</h2>
          <p className="text-center text-muted text-lg mb-12">
            Expert tips and recommendations from Stephen &amp; Sandy
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map((g) => (
              <Link
                key={g.title}
                href={g.href}
                className="block bg-cream rounded-2xl overflow-hidden shadow-md hover:-translate-y-1 transition-transform no-underline group"
              >
                <div className="relative h-[200px]">
                  <Image
                    src={g.image}
                    alt={g.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <span className="text-burgundy text-xs font-semibold">{g.category}</span>
                  <h3 className="font-display text-lg text-burgundy mb-2 mt-1">{g.title}</h3>
                  <p className="text-muted text-sm mb-3">{g.excerpt}</p>
                  <span className="text-burgundy font-semibold text-sm group-hover:underline">
                    Read More &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
