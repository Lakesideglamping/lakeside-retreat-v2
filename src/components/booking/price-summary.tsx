"use client";

import type { Accommodation } from "@/lib/accommodations";
import { calculatePrice, formatNZD } from "@/lib/pricing";

interface PriceSummaryProps {
  accommodation: Accommodation | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  pets: number;
}

export function PriceSummary({
  accommodation,
  checkIn,
  checkOut,
  guests,
  pets,
}: PriceSummaryProps) {
  if (!accommodation || !checkIn || !checkOut) return null;

  const { lineItems, totalAmount } = calculatePrice(
    accommodation,
    checkIn,
    checkOut,
    guests,
    pets
  );

  // Separate deposit from other items for display
  const bookingItems = lineItems.filter(
    (item) => !item.label.startsWith("Security bond")
  );
  const depositItem = lineItems.find((item) =>
    item.label.startsWith("Security bond")
  );
  const bookingTotal = totalAmount - (depositItem?.total || 0);

  return (
    <div className="bg-cream rounded-2xl p-6 shadow-md">
      <h3 className="font-display text-lg text-teal mb-4">Price Summary</h3>
      <div className="space-y-2 text-sm">
        {bookingItems.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-body">{item.label}</span>
            <span className="font-semibold">{formatNZD(item.total)}</span>
          </div>
        ))}

        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between font-semibold text-body">
            <span>Booking total</span>
            <span>{formatNZD(bookingTotal)}</span>
          </div>
        </div>

        {depositItem && (
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between text-muted">
              <span>{depositItem.label}</span>
              <span>{formatNZD(depositItem.total)}</span>
            </div>
            <p className="text-xs text-muted mt-1 italic">
              Pre-authorised on your card and released after checkout.
              Not charged unless a claim is made.
            </p>
          </div>
        )}

        <div className="border-t-2 border-teal pt-3 mt-3">
          <div className="flex justify-between text-base font-semibold text-teal">
            <span>Total authorised</span>
            <span>{formatNZD(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
