"use client";

import type { Accommodation } from "@/lib/accommodations";
import { calculatePrice, formatNZD } from "@/lib/pricing";

interface PriceSummaryProps {
  accommodation: Accommodation | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  pets: number;
  seasonalMultiplier?: number;
}

export function PriceSummary({
  accommodation,
  checkIn,
  checkOut,
  guests,
  pets,
  seasonalMultiplier = 1.0,
}: PriceSummaryProps) {
  if (!accommodation || !checkIn || !checkOut) return null;

  const { lineItems, totalAmount, securityDeposit } = calculatePrice(
    accommodation,
    checkIn,
    checkOut,
    guests,
    pets,
    seasonalMultiplier
  );

  return (
    <div className="bg-cream rounded-2xl p-6 shadow-md">
      <h3 className="font-display text-lg text-burgundy mb-4">Price Summary</h3>
      <div className="space-y-2 text-sm">
        {lineItems.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-body">{item.label}</span>
            <span className="font-semibold">{formatNZD(item.total)}</span>
          </div>
        ))}

        <div className="border-t-2 border-burgundy pt-3 mt-3">
          <div className="flex justify-between text-base font-semibold text-burgundy">
            <span>Total charged</span>
            <span>{formatNZD(totalAmount)}</span>
          </div>
        </div>

        {securityDeposit > 0 && (
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between text-muted">
              <span>Security bond (pre-authorisation only)</span>
              <span>{formatNZD(securityDeposit)}</span>
            </div>
            <p className="text-xs text-muted mt-1 italic">
              Held on your card as a separate pre-authorisation and released
              after checkout. Not charged unless a claim is made.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
