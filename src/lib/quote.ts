import { getById } from "./accommodations";
import { fetchNightlyRates } from "./uplisting";
import { buildStayQuote, type StayQuote } from "./pricing";

/**
 * Server-side quoting: live Uplisting rates in, a StayQuote out.
 *
 * This is the single place the booking page, the checkout API and the
 * Stripe session agree on a price. Nothing here is hard-coded: when
 * Uplisting is unreachable the last successfully fetched rates (kept in
 * Postgres) are used, and when there are none the answer is "unavailable",
 * never a guess.
 */

export interface QuoteRequest {
  accommodation: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  pets?: number;
}

export interface QuoteResult {
  quote: StayQuote;
  /** "live" from Uplisting; "cached" when the API was down and the stored copy was used. */
  source: "live" | "cached";
  /** ISO timestamp of when the rates were fetched from Uplisting. */
  ratesFetchedAt: string;
}

export async function getStayQuote(req: QuoteRequest): Promise<QuoteResult | null> {
  const accommodation = getById(req.accommodation);
  if (!accommodation) return null;

  const nightly = await fetchNightlyRates(req.accommodation);
  if (!nightly) return null;

  const quote = buildStayQuote({
    accommodation,
    checkIn: req.checkIn,
    checkOut: req.checkOut,
    guests: req.guests,
    pets: req.pets ?? 0,
    rates: nightly.rates,
  });
  if (!quote) return null;

  return {
    quote,
    source: nightly.source,
    ratesFetchedAt: nightly.fetchedAt.toISOString(),
  };
}

/**
 * Lowest nightly rate per accommodation over the coming `days` NZ calendar
 * days, in NZD dollars, for "from $X/night" copy. Null where no rates are
 * known — the UI shows nothing rather than a stale number.
 */
export async function getFromRates(
  accommodationIds: string[],
  fromDate: string,
  days = 90
): Promise<Record<string, number | null>> {
  const out: Record<string, number | null> = {};
  await Promise.all(
    accommodationIds.map(async (id) => {
      const nightly = await fetchNightlyRates(id);
      if (!nightly) {
        out[id] = null;
        return;
      }
      const dates = Object.keys(nightly.rates).filter((d) => d >= fromDate).sort().slice(0, days);
      const min = dates.reduce<number | null>((acc, d) => {
        const r = nightly.rates[d];
        return acc === null || r < acc ? r : acc;
      }, null);
      out[id] = min;
    })
  );
  return out;
}
