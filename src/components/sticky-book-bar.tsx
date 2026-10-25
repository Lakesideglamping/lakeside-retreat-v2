"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Shown on every public page (mounted in (public)/layout.tsx). Nightly
// prices are live from Uplisting and change by date, so this bar carries no
// number — a hard-coded "from $X" here drifted from the booking page.

export function StickyBookBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-sm border-t border-white/10 py-3 px-5 transition-all">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
        <p className="text-white text-sm leading-tight">
          <span className="font-display text-base">Best price when you book direct</span>
          <span className="block text-xs text-white/70 mt-0.5">Cleaning included</span>
        </p>
        <Link
          href="/book"
          className="bg-burgundy text-white no-underline px-5 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Check Availability
        </Link>
      </div>
    </div>
  );
}
