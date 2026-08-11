// Server component by design: this list is a fixed single page of reviews
// with no filters and no "Show More", so it needs no client-side state and
// ships no JavaScript to the browser.

interface Review {
  id: number;
  guest_name: string;
  platform: string | null;
  rating: number | null;
  review_text: string | null;
  stay_date: string | null;
  property: string | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  direct: "Direct Booking",
  google: "Google",
};

const PROPERTY_DISPLAY: Record<string, string> = {
  "Dome Rose": "Dome Rosé",
};

function formatStayDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-NZ", {
    month: "long",
    year: "numeric",
    timeZone: "Pacific/Auckland",
  });
}

function renderStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export function ReviewsList({
  reviews,
  total,
}: {
  reviews: Review[];
  /** Canonical cross-platform review total (e.g. "416") for the footer line. */
  total: string;
}) {
  return (
    <>
      {/* Review grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl p-8 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-burgundy to-teal-dark flex items-center justify-center text-white font-bold text-lg">
                {r.guest_name[0]}
              </div>
              <div>
                <div className="font-semibold">{r.guest_name}</div>
                <div className="text-muted text-xs">
                  {formatStayDate(r.stay_date)}
                </div>
              </div>
            </div>
            <div className="text-yellow-500 text-sm mb-3">
              {renderStars(r.rating ?? 5)}
            </div>
            <p className="text-muted text-sm leading-7 mb-4 italic">
              &ldquo;{r.review_text}&rdquo;
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="bg-cream px-3 py-1 rounded-full text-burgundy font-medium">
                {PROPERTY_DISPLAY[r.property ?? ""] ?? r.property ?? "Lakeside Retreat"}
              </span>
              <span className="text-muted">
                {PLATFORM_LABELS[r.platform ?? "direct"] ?? r.platform}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Count line — shows how many are displayed out of the true total */}
      <div className="text-center mt-12">
        <p className="text-muted text-sm">
          Showing {reviews.length} of {total} verified reviews
        </p>
      </div>
    </>
  );
}
