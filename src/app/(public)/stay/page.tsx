import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/hero-background";
import { JsonLd, createLodgingBusinessSchema, createBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Luxury Accommodation Central Otago | Glamping Domes & Lakeside Cottage",
  description:
    "Two adults-only luxury geodesic domes with private spas and a pet-friendly lakeside cottage on Lake Dunstan, Cromwell. Stargazing skylights, vineyard views. $365/night.",
  alternates: { canonical: "/stay" },
  openGraph: {
    title: "Luxury Accommodation Central Otago | Glamping Domes & Lakeside Cottage",
    description:
      "Two adults-only luxury geodesic domes with private spas and a pet-friendly lakeside cottage on Lake Dunstan, Cromwell.",
    url: "https://lakesideretreat.co.nz/stay",
    images: [{ url: "/images/domes-vineyard-sunset.jpg", width: 1200, height: 800, alt: "Lakeside Retreat accommodation" }],
    type: "website",
  },
};

const accommodations = [
  {
    slug: "dome-pinot",
    image: "/images/Pinotfront.jpeg",
    title: "Dome Pinot",
    adultsOnly: true,
    price: "$635",
    tagline: "50sqm luxury dome with panoramic Lake Dunstan views, private spa, and stargazing skylight.",
    features: [
      "Super King bed with premium linens",
      "Private outdoor salt-water spa",
      "Stargazing skylight",
      "Kitchenette (induction, fridge, microwave, coffee machine, dishwasher)",
      "Lake & Pisa Range views",
      "Continental breakfast included",
    ],
  },
  {
    slug: "dome-rose",
    image: "/images/dome-rose-spa1.jpeg",
    title: "Dome Ros\u00e9",
    adultsOnly: true,
    price: "$599",
    tagline: "40sqm romantic retreat with vineyard views, private spa, and a kitchenette for in-dome dining.",
    features: [
      "Super King bed with luxury bedding",
      "Private outdoor salt-water spa",
      "Vineyard & mountain views",
      "Kitchenette (induction, fridge, microwave, coffee machine, dishwasher)",
      "Outdoor dining deck",
      "Continental breakfast included",
    ],
  },
  {
    slug: "lakeside-cottage",
    image: "/images/lakeside-cottage-exterior.jpeg",
    title: "Lakeside Cottage",
    adultsOnly: false,
    price: "$350",
    tagline: "Right on the water. Wood-fired tub steaming under the stars. BBQ on the deck, dog at your feet.",
    features: [
      "Queen bed + sofa pullout, sleeps 3",
      "Direct lake access",
      "Wood-fired cedar hot tub (no chemicals)",
      "Pet friendly ($50 flat fee)",
      "Kitchenette (hotplate, fridge, microwave, coffee machine, dishwasher)",
      "Gas BBQ on the deck",
      "Heat pump (heating &amp; AC)",
    ],
  },
];

export default function StayPage() {
  return (
    <>
      <JsonLd data={[
        createLodgingBusinessSchema(),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Accommodation", path: "/stay" },
        ]),
      ]} />
      {/* Hero */}
      <HeroBackground
        src="/images/domesmountainview.jpeg"
        alt="Glamping domes with mountain views at Lakeside Retreat"
        minHeight="60vh"
        overlayOpacity={0.4}
      >
        <h1 className="font-display text-5xl text-white mb-4">
          Our Accommodations
        </h1>
        <p className="text-xl opacity-95">
          Choose your retreat. The lake takes care of the rest.
        </p>
      </HeroBackground>

      {/* Cards */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl mb-2">
              Choose Your Experience
            </h2>
            <p className="text-muted text-lg">
              Each property is unique — find your perfect Central Otago escape.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {accommodations.map((acc) => (
              <article
                key={acc.slug}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 transition-transform"
              >
                <Link href={`/${acc.slug}`} className="block relative h-[250px]">
                  <Image
                    src={acc.image}
                    alt={`${acc.title} accommodation`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </Link>
                <div className="p-6">
                  <h3 className="font-display text-2xl text-burgundy mb-1">
                    {acc.title}
                  </h3>
                  <p className="text-burgundy font-semibold text-xl mb-3">
                    From {acc.price}/night
                  </p>

                  {acc.adultsOnly && (
                    <div className="bg-red-50 border border-red-300 rounded-lg px-3 py-2 mb-4">
                      <p className="text-red-800 text-sm font-semibold m-0">
                        Adults Only — No children permitted.
                      </p>
                    </div>
                  )}

                  <p className="text-muted text-sm mb-4">{acc.tagline}</p>

                  <ul className="space-y-2 mb-6">
                    {acc.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm text-body border-b border-gray-100 pb-2"
                      >
                        <span className="text-burgundy font-bold">&#10003;</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    href={`/${acc.slug}`}
                    className="w-full text-center"
                    ariaLabel={`View ${acc.title} details`}
                  >
                    View Details &rarr;
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
