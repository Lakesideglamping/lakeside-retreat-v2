import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { JsonLd, createOrganizationSchema, createBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Guest Reviews",
  description:
    "Read verified guest reviews of Lakeside Retreat Central Otago. Rated 4.9 stars across Airbnb, Booking.com and direct bookings.",
};

const PLATFORM_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  direct: "Direct Booking",
  google: "Google",
};

function formatStayDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-NZ", {
    month: "long",
    year: "numeric",
    timeZone: "Pacific/Auckland",
  });
}

function renderStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default async function ReviewsPage() {
  const [reviews, summary] = await Promise.all([
    prisma.reviews.findMany({
      where: { status: "approved" },
      orderBy: { stay_date: "desc" },
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
    { label: "Overall Rating", value: avgRating, sub: "out of 5 stars" },
    { label: "Verified Reviews", value: String(totalReviews), sub: "across all platforms" },
    { label: "Return Guests", value: "45%", sub: "come back again" },
    { label: "Would Recommend", value: "98%", sub: "to friends & family" },
  ];

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
      <section
        className="relative min-h-[50vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/images/domesmountainview.jpeg')",
        }}
      >
        <div className="pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4">Guest Reviews</h1>
          <p className="text-xl opacity-95">
            See what our guests say about their Lakeside Retreat experience
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-bold text-teal mb-1">{s.value}</div>
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
          <p className="text-center text-muted text-lg mb-12">
            Authentic reviews from Airbnb, Booking.com, and direct bookings
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-8 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-burgundy to-teal-dark flex items-center justify-center text-white font-bold text-lg">
                    {r.guest_name[0]}
                  </div>
                  <div>
                    <div className="font-semibold">{r.guest_name}</div>
                    <div className="text-muted text-xs">{formatStayDate(r.stay_date)}</div>
                  </div>
                </div>
                <div className="text-yellow-500 text-sm mb-3">
                  {renderStars(r.rating ?? 5)}
                </div>
                <p className="text-muted text-sm leading-7 mb-4 italic">
                  &ldquo;{r.review_text}&rdquo;
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="bg-cream px-3 py-1 rounded-full text-teal font-medium">
                    {r.property ?? "Lakeside Retreat"}
                  </span>
                  <span className="text-muted">
                    {PLATFORM_LABELS[r.platform ?? "direct"] ?? r.platform}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 bg-white text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">
            Ready to Create Your Own Memories?
          </h2>
          <p className="text-lg text-muted mb-8">
            Join our community of happy guests and experience Central Otago&apos;s finest
            accommodation.
          </p>
          <Button href="/book">Book Your Stay</Button>
        </div>
      </section>
    </>
  );
}
