import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative min-h-[85vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/images/domesmountainview.jpeg')",
        }}
      >
        <div className="max-w-[700px] px-5 pt-20">
          <h1 className="font-display text-5xl md:text-6xl text-white mb-4 drop-shadow-lg">
            Luxury Glamping on Lake Dunstan, Central Otago
          </h1>
          <p className="text-xl mb-8 opacity-95">
            Luxury glamping domes and lakefront cottage in the heart of Central
            Otago&apos;s wine country
          </p>
          <Button href="/#booking">Book Your Escape</Button>
        </div>
      </section>

      {/* Welcome */}
      <section className="py-20 px-5">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-display text-4xl mb-4">
            Welcome to Lakeside Retreat!
          </h2>
          <p className="text-lg leading-8 text-muted">
            Experience pure luxury on the shores of Lake Dunstan, surrounded by
            vineyards and mountain views. Soak in your private salt water spa,
            explore world-class wineries, or simply unwind in Central Otago&apos;s
            most stunning setting.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button href="/our-story">About Us</Button>
            <Button href="/gallery" variant="outline" className="border-burgundy text-burgundy hover:bg-burgundy hover:text-white">
              View Gallery
            </Button>
          </div>
        </div>
      </section>

      {/* About with image */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl mb-4">About Lakeside Retreat</h2>
            <p className="text-lg leading-8 text-muted mb-4">
              Discover luxury at Lakeside Retreat, where vineyard living meets the
              timeless beauty of Lake Dunstan. Our three unique accommodations —
              two geodesic domes and one lakeside cottage — offer an unparalleled
              escape in the heart of Central Otago&apos;s renowned wine region.
            </p>
            <p className="text-lg leading-8 text-muted mb-8">
              We&apos;re proudly sustainable too — our renewable energy system
              generates more power than we use, so you can enjoy five-star comfort
              knowing your stay gives back to the environment.
            </p>
            <div className="flex gap-4">
              <Button href="/stay">View Accommodations</Button>
              <Button href="/our-story" variant="outline" className="border-burgundy text-burgundy hover:bg-burgundy hover:text-white">
                Meet Your Hosts
              </Button>
            </div>
          </div>
          <Image
            src="/images/ViewfromVineyard.jpeg"
            alt="Vineyard views at Lakeside Retreat Central Otago"
            width={1000}
            height={750}
            className="rounded-2xl w-full h-auto object-cover"
          />
        </div>
      </section>

      {/* Location */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl mb-4">
              Perfect Central Otago Location
            </h2>
            <ul className="space-y-3 mb-8">
              {[
                "300m direct access to Lake Dunstan Trail",
                "45 minutes from Queenstown Airport",
                "30 minutes from Wanaka township",
                "Surrounded by world-class wineries",
                "Five ski fields within range",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-body">
                  <span className="text-burgundy">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
            <Button href="/explore">Explore Local Area</Button>
          </div>
          <Image
            src="/images/lake-mountains-perfect.jpg"
            alt="Lake Dunstan location and surrounding Central Otago wine country"
            width={1920}
            height={1440}
            className="rounded-2xl w-full h-auto object-cover"
          />
        </div>
      </section>

      {/* Accommodations */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl mb-4">
              Three Unique Experiences
            </h2>
            <p className="text-lg text-muted">
              Luxury domes for couples and a family cottage — all with lake access
              and sustainably powered.
            </p>
            <p className="text-sm text-muted mt-2">
              Only 3 properties — book early for peak season
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <AccommodationCard
              href="/dome-pinot"
              image="/images/dome-pinot-hero.jpeg"
              title="Dome Pinot"
              badge="Adults Only"
              description="50sqm luxury dome with panoramic Lake Dunstan views, private spa, and stargazing skylight."
              features={["Lake Views", "Private Spa", "Breakfast Included", "Super King Bed"]}
              price="From $530/night"
            />
            <AccommodationCard
              href="/dome-rose"
              image="/images/dome-rose-spa1.jpeg"
              title="Dome Ros&eacute;"
              badge="Adults Only"
              description="40sqm romantic retreat with vineyard views, private spa, and complete cooking facilities."
              features={["Vineyard Views", "Private Spa", "Breakfast Included", "Super King Bed"]}
              price="From $510/night"
            />
            <AccommodationCard
              href="/lakeside-cottage"
              image="/images/lakeside-cottage-exterior.jpeg"
              title="Lakeside Cottage"
              description="Spacious family cottage with direct Lake Dunstan access, full kitchen, and pet-friendly."
              features={["Lake Access", "Pet Friendly", "2 Bedrooms", "Kayaks Included"]}
              price="From $295/night"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function AccommodationCard({
  href,
  image,
  title,
  badge,
  description,
  features,
  price,
}: {
  href: string;
  image: string;
  title: string;
  badge?: string;
  description: string;
  features: string[];
  price: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-cream rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 transition-transform no-underline group"
    >
      <div className="relative h-[250px]">
        <Image
          src={image}
          alt={`${title} accommodation`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-6">
        <h3 className="font-display text-xl text-teal mb-1">
          {title}{" "}
          {badge && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-body font-semibold">
              {badge}
            </span>
          )}
        </h3>
        <p className="text-sm text-muted mb-4">{description}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-body mb-4">
          {features.map((f) => (
            <span key={f}>&bull; {f}</span>
          ))}
        </div>
        <p className="text-burgundy font-semibold">{price} &rarr;</p>
      </div>
    </Link>
  );
}
