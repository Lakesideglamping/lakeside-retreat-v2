import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createLodgingBusinessSchema, createOrganizationSchema, createWebSiteSchema, createFaqSchema, createBreadcrumbSchema } from "@/lib/structured-data";

export default function HomePage() {
  return (
    <>
      <JsonLd data={[
        createLodgingBusinessSchema(),
        createOrganizationSchema(),
        createWebSiteSchema(),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Accommodation", path: "/stay" },
          { name: "Things to Do", path: "/explore" },
        ]),
        createFaqSchema([
          { question: "Where is Lakeside Retreat located in Central Otago?", answer: "Lakeside Retreat is located at 96 Smiths Way, Mount Pisa, just 12km from Cromwell town centre. We're positioned directly on Lake Dunstan in the heart of Central Otago wine country, with the cycle trail just 300m from our accommodation." },
          { question: "What type of accommodation do you offer?", answer: "We offer luxury glamping domes and a family cottage, all with Lake Dunstan and mountain views. Dome Pinot (50sqm) and Dome Ros\u00e9 (40sqm) are perfect for couples with private spas, while our Lakeside Cottage accommodates families with direct lake access." },
          { question: "How close are you to Central Otago wineries?", answer: "We're in the heart of Central Otago wine country with 15+ wineries within 15km, including Felton Road, Carrick, and Mt Difficulty." },
          { question: "How far is Lakeside Retreat from Queenstown?", answer: "Approximately 45 minutes' drive from Queenstown via the Kawarau Gorge. Also 35 minutes from Wanaka." },
          { question: "Can I bring my pet?", answer: "The Lakeside Cottage is pet-friendly with prior approval ($50 flat fee). The domes are not suitable for pets." },
          { question: "What's the cancellation policy?", answer: "Full refund if cancelled 7+ days before check-in. 50% refund for 3-6 days. No refund within 3 days." },
          { question: "Why book direct instead of Airbnb?", answer: "Booking direct saves you 12-18% in service fees that platforms add. Same stay, better price, direct host communication." },
        ]),
      ]} />
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
          <Button href="/book">Book Your Escape</Button>
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

      {/* Reviews Teaser */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl mb-4">What Our Guests Say</h2>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-8">
              <div className="text-center">
                <p className="text-4xl font-display text-burgundy">4.9/5</p>
                <p className="text-sm text-muted">Overall Rating</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-display text-burgundy">416</p>
                <p className="text-sm text-muted">Verified Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-display text-burgundy">45%</p>
                <p className="text-sm text-muted">Return Guests</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-display text-burgundy">98%</p>
                <p className="text-sm text-muted">Would Recommend</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { author: "Sarah", accommodation: "Dome Pinot", date: "January 2026", text: "Outstanding experience. The continental breakfast, vineyard walks, and lake swimming made this the perfect Central Otago getaway. The stargazing skylight was magical." },
              { author: "Ryan", accommodation: "Lakeside Cottage", date: "February 2026", text: "Such a lovely place. The lake views from the deck, morning kayaks with the kids, and the attentive hosts made our family holiday unforgettable." },
              { author: "Emma", accommodation: "Dome Ros\u00e9", date: "December 2025", text: "A hidden gem in wine country. The private spa overlooking the vineyards was heavenly. Stephen and Sandy are wonderful hosts who think of everything." },
            ].map((review) => (
              <div key={review.author} className="bg-white rounded-2xl p-8 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-burgundy to-teal flex items-center justify-center text-white font-semibold text-sm">
                    {review.author[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{review.author}</p>
                    <p className="text-xs text-muted">{review.date}</p>
                  </div>
                </div>
                <p className="text-yellow-500 mb-3">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
                <p className="text-sm text-muted italic leading-relaxed">&ldquo;{review.text}&rdquo;</p>
                <p className="text-xs text-teal mt-4 bg-cream inline-block px-3 py-1 rounded-full">{review.accommodation}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button href="/reviews">Read All 416 Reviews</Button>
          </div>
        </div>
      </section>

      {/* Our Story Teaser */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center">
          <Image
            src="/images/vineyarddomes.jpeg"
            alt="Lakeside Retreat domes nestled among Central Otago vineyards"
            width={800}
            height={600}
            className="rounded-2xl w-full h-auto object-cover"
          />
          <div>
            <h2 className="font-display text-4xl mb-4">From Wrong Turn to Dream Come True</h2>
            <p className="text-lg leading-8 text-muted mb-4">
              In April 2019, a wrong turn down a dusty Central Otago road led us to a piece of paradise on Lake Dunstan. Four years later, we&apos;ve welcomed guests from 20+ countries to share the magic of this place.
            </p>
            <p className="text-lg leading-8 text-muted mb-8">
              We&apos;re Stephen &amp; Sandy — your hosts, neighbours, and local guides. Come and be part of our story.
            </p>
            <Button href="/our-story">Read Our Story</Button>
          </div>
        </div>
      </section>

      {/* Seasonal Highlights */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl mb-4">Beautiful in Every Season</h2>
            <p className="text-lg text-muted">Central Otago delivers year-round magic</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { season: "Summer", months: "Dec \u2013 Feb", icon: "\u2600\uFE0F", description: "Swim in Lake Dunstan, cycle the trail, and enjoy long evenings on the deck.", highlight: "Peak season \u2014 book early" },
              { season: "Autumn", months: "Mar \u2013 May", icon: "\uD83C\uDF42", description: "Our favourite season. Vineyards turn gold, harvest brings winery events and festivals.", highlight: "Best for wine lovers" },
              { season: "Winter", months: "Jun \u2013 Aug", icon: "\u2744\uFE0F", description: "Five ski fields within reach. Hot tub under the stars with snow-capped mountain views.", highlight: "Ski & spa season" },
              { season: "Spring", months: "Sep \u2013 Nov", icon: "\uD83C\uDF38", description: "Fewer crowds, wildflowers everywhere, and the best weather for hiking and cycling.", highlight: "Best value season" },
            ].map((s) => (
              <div key={s.season} className="bg-cream rounded-2xl p-6 text-center">
                <p className="text-3xl mb-2">{s.icon}</p>
                <h3 className="font-display text-xl text-teal mb-1">{s.season}</h3>
                <p className="text-xs text-muted mb-3">{s.months}</p>
                <p className="text-sm text-body leading-relaxed mb-3">{s.description}</p>
                <p className="text-xs text-burgundy font-semibold">{s.highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Where is Lakeside Retreat located?", a: "We\u2019re at 96 Smiths Way, Mount Pisa, just 12km from Cromwell. Directly on Lake Dunstan in Central Otago wine country, with the cycle trail 300m away." },
              { q: "What accommodation do you offer?", a: "Two luxury geodesic domes (Dome Pinot 50sqm and Dome Ros\u00e9 40sqm) for couples, plus a family-friendly Lakeside Cottage with direct lake access. All have private spas." },
              { q: "How far from Queenstown and Wanaka?", a: "45 minutes from Queenstown via the Kawarau Gorge, and 30\u201335 minutes from Wanaka." },
              { q: "Can I bring my pet?", a: "The Lakeside Cottage is pet-friendly ($50 flat fee, max 2 dogs). The domes are adults-only and not suitable for pets." },
              { q: "What\u2019s the cancellation policy?", a: "Full refund if cancelled 7+ days before check-in. 50% refund for 3\u20136 days. No refund within 3 days." },
              { q: "Why book direct instead of Airbnb?", a: "Save 12\u201318% in service fees. Same stay, better price, and direct communication with your hosts." },
            ].map((faq) => (
              <details key={faq.q} className="group bg-cream rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-body hover:text-burgundy transition-colors list-none">
                  {faq.q}
                  <span className="text-burgundy transition-transform group-open:rotate-45 text-xl ml-4 shrink-0">+</span>
                </summary>
                <div className="px-5 pb-5 text-muted leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
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
