import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/hero-background";
import { JsonLd, createOrganizationSchema, createBreadcrumbSchema } from "@/lib/structured-data";
import { ReviewsList } from "@/components/reviews-list";

// Revalidate hourly instead of rendering on every request. Reviews change
// rarely (moderator approval), so hourly freshness is plenty and keeps the
// page on the CDN. Drop-in replacement for the previous `force-dynamic`.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Guest Reviews | 4.9★ Rated Accommodation, Central Otago",
  description:
    "Read 416 verified guest reviews of Lakeside Retreat, Cromwell. 4.9/5 stars across Airbnb, Booking.com, and direct bookings. Central Otago's top-rated glamping.",
  alternates: { canonical: "/reviews" },
  openGraph: {
    title: "Guest Reviews | Lakeside Retreat",
    description:
      "416 verified reviews, 4.9\u2605 average. Central Otago's top-rated glamping and lakeside cottage.",
    url: "https://lakesideretreat.co.nz/reviews",
    images: [{ url: "/images/domes-vineyard-sunset.jpg", width: 1200, height: 800, alt: "Lakeside Retreat reviews" }],
    type: "website",
  },
};

export default async function ReviewsPage() {
  const [reviews, summary] = await Promise.all([
    prisma.reviews.findMany({
      where: { status: "approved" },
      orderBy: [{ is_featured: "desc" }, { stay_date: "desc" }],
    }),
    prisma.reviews.aggregate({
      where: { status: "approved" },
      _count: true,
      _avg: { rating: true },
    }),
  ]);

  const totalReviews = summary._count;
  const avgRating = summary._avg.rating
    ? Number(summary._avg.rating).toFixed(1)
    : "0.0";

  const stats = [
    { label: "Overall Rating", value: avgRating !== "0.0" ? avgRating : "4.9", sub: "out of 5 stars" },
    { label: "Verified Reviews", value: String(totalReviews), sub: "across all platforms" },
    { label: "Return Guests", value: "45%", sub: "come back again" },
    { label: "Would Recommend", value: "98%", sub: "to friends" },
  ];

  // Serialize for client component
  const serializedReviews = reviews.map((r) => ({
    id: r.id,
    guest_name: r.guest_name,
    platform: r.platform,
    rating: r.rating,
    review_text: r.review_text,
    stay_date: r.stay_date ? r.stay_date.toISOString() : null,
    property: r.property,
  }));

  return (
    <>
      <JsonLd data={[
        createOrganizationSchema(),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Reviews", path: "/reviews" },
        ]),
      ]} />
      {/* Hero */}
      <HeroBackground
        src="/images/domesmountainview.jpeg"
        alt="Glamping domes with mountain views at Lakeside Retreat"
        minHeight="50vh"
      >
        <h1 className="font-display text-5xl text-white mb-4">Guest Reviews</h1>
        <p className="text-xl opacity-95">
          See what our guests say about their Lakeside Retreat experience
        </p>
      </HeroBackground>

      {/* Stats */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-bold text-burgundy mb-1">{s.value}</div>
              <div className="font-semibold text-body text-sm">{s.label}</div>
              <div className="text-muted text-xs">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">What Our Guests Say</h2>
          <p className="text-center text-muted text-lg mb-8">
            Authentic reviews from Airbnb, Booking.com, and direct bookings
          </p>
          <ReviewsList reviews={serializedReviews} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 bg-white text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">
            Be the next story.
          </h2>
          <p className="text-lg text-muted mb-8">
            Four hundred guests have come home with one. Book direct &mdash; lower rates,
            personal service, and the whole lake right there.
          </p>
          <Button href="/book">Book Your Stay</Button>
        </div>
      </section>
    </>
  );
}
