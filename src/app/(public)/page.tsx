import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd, createLodgingBusinessSchema, createOrganizationSchema, createWebSiteSchema, createFaqSchema, createBreadcrumbSchema, fetchReviewStats } from "@/lib/structured-data";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const reviewStats = await fetchReviewStats();
  return (
    <>
      <JsonLd data={[
        createLodgingBusinessSchema(reviewStats),
        createOrganizationSchema(),
        createWebSiteSchema(),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Accommodation", path: "/stay" },
          { name: "Things to Do", path: "/explore" },
        ]),
        createFaqSchema([
          { question: "Where is Lakeside Retreat located in Central Otago?", answer: "Lakeside Retreat is located at 96 Smiths Way, Mount Pisa, just 12km from Cromwell town centre. We're positioned directly on Lake Dunstan in the heart of Central Otago wine country, with the Otago Rail Trail cycle trail just 300m from our accommodation." },
          { question: "What type of accommodation do you offer?", answer: "We offer luxury glamping domes and a family cottage, all with Lake Dunstan and mountain views. Dome Pinot (50sqm) and Dome Ros\u00e9 (40sqm) are adults-only geodesic domes perfect for couples with private outdoor spas, while our Lakeside Cottage accommodates families with direct lake access and is pet-friendly." },
          { question: "Is Lakeside Retreat good for glamping in Central Otago?", answer: "Yes — Lakeside Retreat is Central Otago's premier glamping destination. Our two luxury geodesic domes feature private outdoor spas, stargazing skylights, panoramic Lake Dunstan and mountain views, and continental breakfast included. It's a unique alternative to traditional hotels in the region." },
          { question: "How close are you to Central Otago wineries?", answer: "We're in the heart of Central Otago wine country with 30+ wineries within 15 minutes, including Felton Road, Carrick, Mt Difficulty, Wooing Tree, and Bannockburn's award-winning cellar doors." },
          { question: "How far is Lakeside Retreat from Queenstown?", answer: "Approximately 45 minutes' drive from Queenstown via the scenic Kawarau Gorge. Wanaka is just 30 minutes in the other direction. We're perfectly positioned as a quieter, more affordable alternative to Queenstown accommodation." },
          { question: "Can I bring my dog to Lakeside Retreat?", answer: "Yes! The Lakeside Cottage is pet-friendly and welcomes well-behaved dogs with prior approval. A flat $50 pet fee applies. The cottage has direct lake access and a secure outdoor area. The glamping domes are adults-only and not suitable for pets." },
          { question: "Is Lakeside Retreat close to the Otago Rail Trail?", answer: "The Otago Rail Trail (New Zealand's original Great Ride) is just 300 metres from Lakeside Retreat. You can walk from your accommodation to the trail start. The Cromwell to Clyde section is flat and spectacular — ideal for cyclists of all fitness levels." },
          { question: "What is the minimum stay at Lakeside Retreat?", answer: "Our luxury domes (Dome Pinot and Dome Ros\u00e9) have a 1-night minimum stay, though 2+ nights is recommended to fully experience the retreat. The Lakeside Cottage has a 2-night minimum stay." },
          { question: "What's the cancellation policy?", answer: "Full refund if cancelled 7+ days before check-in. 50% refund for 3-6 days. No refund within 3 days." },
          { question: "Why book direct instead of Airbnb?", answer: "Booking direct saves you 12-18% in service fees that platforms charge. You get the same luxury stay at a lower price with direct host communication and the ability to discuss special requests with Stephen and Sandy." },
        ]),
      ]} />
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="/images/domes-vineyard-sunset.jpg"
          alt="Lakeside Retreat glamping domes overlooking Lake Dunstan at sunset"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/55" />
        <div className="relative max-w-[700px] px-5 pt-20">
          <h1 className="font-display text-5xl md:text-6xl text-white mb-4 drop-shadow-lg">
            Luxury Glamping on Lake Dunstan, Central Otago
          </h1>
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-yellow-400 text-lg" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
            <span className="text-white font-semibold text-sm">4.9/5</span>
            <span className="text-white/90 text-sm">&bull; 416 verified reviews</span>
          </div>
          <p className="text-xl md:text-2xl mb-8 opacity-95 font-light tracking-wide">
            Wake to the lake. Dine in the vines. Sleep beneath the stars.
          </p>
          <Button href="/book">Book Your Escape</Button>
        </div>
      </section>

      {/* A place apart */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl mb-6">A place that feels like a secret.</h2>
            <p className="text-lg leading-8 text-muted mb-4">
              Two domes and a cottage, set among the vines above Lake Dunstan.
              No crowds. No traffic. Just the wind through the poplars and a
              horizon full of mountains.
            </p>
            <p className="text-lg leading-8 text-muted mb-8">
              Run entirely on sunlight — we make more power than we use, so
              every stay gives a little back.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button href="/stay">View Accommodations</Button>
              <Button href="/our-story" variant="outline-dark">
                Meet Your Hosts
              </Button>
            </div>
          </div>
          <Image
            src="/images/gallerydecksitting.jpeg"
            alt="View from the dome deck across the golden vineyard and Lake Dunstan"
            width={1000}
            height={750}
            className="rounded-2xl w-full h-auto object-cover"
          />
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-cream border-y border-gray-100">
        <div className="max-w-[1100px] mx-auto px-5 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 text-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="w-8 h-8 text-burgundy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
            <div>
              <p className="font-display text-lg text-body">100% Renewable Power</p>
              <p className="text-sm text-muted mt-1">We generate more than we use</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <svg className="w-8 h-8 text-burgundy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <div>
              <p className="font-display text-lg text-body">Direct Lake Access</p>
              <p className="text-sm text-muted mt-1">300m to Lake Dunstan</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <svg className="w-8 h-8 text-burgundy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
            </svg>
            <div>
              <p className="font-display text-lg text-body">Wine Country</p>
              <p className="text-sm text-muted mt-1">Surrounded by world-class wineries</p>
            </div>
          </div>
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
              image="/images/Pinotfront.jpeg"
              title="Dome Pinot"
              badge="Adults Only"
              description="50sqm luxury dome with panoramic Lake Dunstan views, private spa, and stargazing skylight."
              features={["Lake Views", "Private Spa", "Breakfast Included", "Super King Bed"]}
              price="From $530/night"
            />
            <AccommodationCard
              href="/dome-rose"
              image="/images/dome-rose-spa1.jpeg"
              title="Dome Rosé"
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
                <p className="text-xs text-burgundy mt-4 bg-cream inline-block px-3 py-1 rounded-full">{review.accommodation}</p>
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
            src="/images/galleryrainbow.jpeg"
            alt="Double rainbow arcing over Lake Dunstan and the vineyards at Lakeside Retreat"
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
                <h3 className="font-display text-xl text-burgundy mb-1">{s.season}</h3>
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
        <h3 className="font-display text-xl text-burgundy mb-1">
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
