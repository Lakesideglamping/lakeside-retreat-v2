"use client";

import { useState } from "react";

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

const PROPERTY_FILTERS = [
  { label: "All Properties", value: "all" },
  { label: "Dome Pinot", value: "Dome Pinot" },
  { label: "Dome Rosé", value: "Dome Rose" },
  { label: "Lakeside Cottage", value: "Lakeside Cottage" },
];

const PROPERTY_DISPLAY: Record<string, string> = {
  "Dome Rose": "Dome Rosé",
};

const PAGE_SIZE = 12;

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

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = filter === "all"
    ? reviews
    : reviews.filter((r) => r.property === filter);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function handleFilterChange(value: string) {
    setFilter(value);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {PROPERTY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-burgundy text-white"
                : "bg-cream text-body hover:bg-burgundy/10"
            }`}
          >
            {f.label}
            {f.value !== "all" && (
              <span className="ml-1.5 opacity-70">
                ({reviews.filter((r) => r.property === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Review grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visible.map((r) => (
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

      {/* Show more / count */}
      <div className="text-center mt-12">
        {hasMore ? (
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="inline-block px-8 py-3 bg-burgundy text-white rounded-full font-medium hover:bg-burgundy-dark transition-colors"
          >
            Show More Reviews ({filtered.length - visibleCount} remaining)
          </button>
        ) : (
          <p className="text-muted text-sm">
            Showing all {filtered.length} reviews
          </p>
        )}
      </div>
    </>
  );
}
