import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/hero-background";
import { JsonLd, createOrganizationSchema, createBreadcrumbSchema, fetchReviewStats } from "@/lib/structured-data";
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
    images: [{ url: "/images/20210618_084416.jpg", width: 1200, height: 800, alt: "Lakeside Retreat reviews" }],
    type: "website",
  },
};

export default async function ReviewsPage() {
  // Canonical cross-platform figures (4.9 / 416) — the same source the hero,
  // structured data, and site-wide copy use, so every number agrees.
  const { ratingValue, reviewCount } = await fetchReviewStats();

  const reviews = await prisma.reviews.findMany({
    // Only 5-star reviews are showcased on the site.
    where: { status: "approved", rating: 5 },
    orderBy: [{ is_featured: "desc" }, { stay_date: "desc" }],
    // Only the columns actually rendered. is_featured is deliberately not
    // selected — SQL can ORDER BY a column without returning it.
    select: {
      id: true,
      guest_name: true,
      platform: true,
      rating: true,
      review_text: true,
      stay_date: true,
      property: true,
    },
    // Fixed single page: ship exactly the 12 shown (featured first, then
    // newest). No "Show More", so there's nothing to fetch beyond these.
    take: 12,
  });

  const stats = [
    { label: "Overall Rating", value: ratingValue, sub: "out of 5 stars" },
    { label: "Verified Reviews", value: reviewCount, sub: "across all platforms" },
    { label: "Return Guests", value: "33%", sub: "come back again" },
    { label: "Would Recommend", value: "98%", sub: "to friends" },
  ];

  // stay_date is a Date object; convert to a plain string for the list.
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
        src="/images/20210618_084416.jpg"
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
          <ReviewsList reviews={serializedReviews} total={reviewCount} />
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
