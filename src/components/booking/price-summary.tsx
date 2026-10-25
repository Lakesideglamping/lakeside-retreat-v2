"use client";

import type { Accommodation } from "@/lib/accommodations";
import { formatNZDCents, type StayQuote } from "@/lib/pricing";

export type QuoteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; quote: StayQuote; source: "live" | "cached" }
  | { status: "unavailable" };

interface PriceSummaryProps {
  accommodation: Accommodation | null;
  checkIn: string | null;
  checkOut: string | null;
  quoteState: QuoteState;
  onRetry: () => void;
}

function formatNight(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * The price the guest will pay, from live Uplisting rates.
 *
 * Reads as a confident direct price, not a spreadsheet: the nightly rate up
 * front, the second-night offer named plainly, one total. When no price can
 * be had it says so and offers a retry — it never shows a number it is not
 * sure of.
 */
export function PriceSummary({
  accommodation,
  checkIn,
  checkOut,
  quoteState,
  onRetry,
}: PriceSummaryProps) {
  if (!accommodation || !checkIn || !checkOut) return null;

  return (
    <div className="bg-cream rounded-2xl p-6 shadow-md" aria-live="polite">
      <h3 className="font-display text-lg text-burgundy mb-4">Your Price</h3>

      {quoteState.status === "loading" || quoteState.status === "idle" ? (
        <div className="flex items-center gap-3 text-sm text-muted py-2" role="status">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-burgundy border-t-transparent" />
          Checking tonight&apos;s rates&hellip;
        </div>
      ) : quoteState.status === "unavailable" ? (
        <div className="text-sm">
          <p className="text-body mb-3">
            We can&apos;t show prices right now. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="text-burgundy font-semibold underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <QuoteBreakdown quote={quoteState.quote} />
      )}
    </div>
  );
}

function QuoteBreakdown({ quote }: { quote: StayQuote }) {
  const [stayLine, ...extras] = quote.lineItems;
  const uniformRate = quote.nightly.every(
    (n) => n.rateCents === quote.nightly[0].rateCents
  );

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between gap-4">
        <span className="text-body">
          {stayLine.label}
          {uniformRate && (
            <span className="block text-xs text-muted">
              {formatNZDCents(quote.nightly[0].rateCents)} per night
            </span>
          )}
        </span>
        <span className="font-semibold">{formatNZDCents(stayLine.totalCents)}</span>
      </div>

      {!uniformRate && (
        <ul className="pl-3 space-y-0.5 text-xs text-muted">
          {quote.nightly.map((n) => (
            <li key={n.date} className="flex justify-between gap-4">
              <span>{formatNight(n.date)}</span>
              <span>{formatNZDCents(n.rateCents)}</span>
            </li>
          ))}
        </ul>
      )}

      {extras.map((item) => (
        <div key={item.label} className="flex justify-between gap-4">
          <span className="text-body">{item.label}</span>
          <span className="font-semibold">{formatNZDCents(item.totalCents)}</span>
        </div>
      ))}

      {quote.discount && (
        <div className="flex justify-between gap-4 text-green-800">
          <span className="font-semibold">{quote.discount.label}</span>
          <span className="font-semibold">&minus;{formatNZDCents(quote.discount.amountCents)}</span>
        </div>
      )}

      <div className="border-t-2 border-burgundy pt-3 mt-3">
        <div className="flex justify-between text-base font-semibold text-burgundy">
          <span>Total charged</span>
          <span>{formatNZDCents(quote.totalCents)}</span>
        </div>
        <p className="text-xs text-muted mt-1">
          Direct price in NZD, GST included. Cleaning included.
        </p>
      </div>
    </div>
  );
}
