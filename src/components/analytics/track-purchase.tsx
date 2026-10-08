"use client";

import { useEffect } from "react";
import { trackPurchase, type BookingEventDetails } from "@/lib/analytics";

/**
 * Fires the purchase conversion once per Stripe session. The sessionStorage
 * guard stops a reload from re-sending it. Meta also deduplicates on the
 * transaction id; Umami does not, so where storage is blocked a reload can
 * count one booking twice there.
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
