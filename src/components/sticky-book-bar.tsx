"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function StickyBookBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-sm border-t border-white/10 py-3 px-5 transition-all">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between">
        <p className="text-white text-sm">
          <span className="font-display text-lg">From $295</span>
          <span className="text-white/70">/night</span>
        </p>
        <Link
          href="/book"
          className="bg-burgundy text-white no-underline px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
