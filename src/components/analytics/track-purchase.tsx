"use client";

import { useEffect } from "react";
import { trackPurchase, type BookingEventDetails } from "@/lib/analytics";

/**
 * Fires the purchase conversion once per Stripe session. The sessionStorage
 * guard stops a reload from re-sending it; GA4 and Meta also deduplicate on
 * the transaction id, so a missing guard (private mode) is not double-counted.
 */
export function TrackPurchase(
  props: BookingEventDetails & { transactionId: string }
) {
  useEffect(() => {
    const key = `purchase-tracked:${props.transactionId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked — rely on the trackers' own deduplication.
    }
    trackPurchase(props);
    // Fire once on mount; the props come from one server render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
