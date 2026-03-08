import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Local Guides & Tips",
  description:
    "Insider knowledge from your hosts to help you make the most of your Central Otago adventure. Guides to wine trails, cycling, water sports, and day trips.",
};

const guides = [
  {
    category: "Cycling",
    title: "Otago Rail Trail: A Complete Guide",
    image: "/images/vineyard-path.jpg",
    excerpt: "Everything you need to know about New Zealand's original Great Ride, just 300m from Lakeside Retreat.",
    href: "/explore",
  },
  {
    category: "Water Activities",
    title: "Lake Dunstan: Swimming, Kayaking & More",
    image: "/images/magical-sunset.jpg",
    excerpt: "Your guide to water activities on Lake Dunstan, from swimming spots to kayaking routes.",
    href: "/explore",
  },
  {
    category: "Day Trips",
    title: "Queenstown Day Trip: Adventure Awaits",
    image: "/images/lake-mountains-perfect.jpg",
    excerpt: "How to make the most of a day trip to Queenstown from Lakeside Retreat, just 45 minutes away.",
    href: "/explore",
  },
  {
    category: "Day Trips",
    title: "Wanaka: Lakes, Mountains & That Tree",
    image: "/images/lakeviewautumn.jpeg",
    excerpt: "Discover Wanaka's best attractions, cafes, and walks, just 30 minutes from your door.",
    href: "/explore",
  },
  {
    category: "Seasonal",
    title: "Best Time to Visit Central Otago",
    image: "/images/golden-vineyard-autumn.jpg",
    excerpt: "A season-by-season guide to Central Otago, from summer swimming to winter wine tasting.",
    href: "/explore",
  },
  {
    category: "Food & Dining",
    title: "Where to Eat in Cromwell & Beyond",
    image: "/images/ViewfromVineyard.jpeg",
    excerpt: "Our favourite restaurants, cafes, and winery eateries in the Cromwell Basin and beyond.",
    href: "/explore",
  },
];

export default function GuidesPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative min-h-[50vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/images/vineyard.jpeg')",
        }}
      >
        <div className="pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4">Local Guides &amp; Tips</h1>
          <p className="text-xl opacity-95 max-w-[700px] mx-auto">
            Insider knowledge from your hosts to help you make the most of your Central Otago
            adventure
          </p>
        </div>
      </section>

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
                visit Mt Difficulty for stunning views, and finish at Wooing Tree for their unique
                underground cellar.
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
                  <h3 className="font-display text-lg text-teal mb-2 mt-1">{g.title}</h3>
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
