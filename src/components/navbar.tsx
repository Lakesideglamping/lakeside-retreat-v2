"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const leftLinks = [
  { href: "/", label: "Home" },
  { href: "/stay", label: "Stay" },
  { href: "/gallery", label: "Gallery" },
  { href: "/guides", label: "Guides" },
];

const rightLinks = [
  { href: "/reviews", label: "Reviews" },
  { href: "/our-story", label: "Story" },
  { href: "/contact", label: "Contact" },
];

const allLinks = [
  { href: "/", label: "Home" },
  { href: "/stay", label: "Stay" },
  { href: "/gallery", label: "Gallery" },
  { href: "/guides", label: "Guides" },
  { href: "/reviews", label: "Reviews" },
  { href: "/our-story", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

/**
 * Routes where the bar follows you down the page.
 *
 * Elsewhere the nav stays as it was: absolute at the top, scrolling away for
 * good. That is the problem this solves — /lakeside-cottage is 11,700px on a
 * phone, so reaching the menu mid-page means scrolling back roughly fourteen
 * screens — but it is enabled on the homepage alone for now, to be looked at
 * before it reaches the rest of the site. Widening it is adding paths here.
 */
const REVEAL_ON_SCROLL_ROUTES = ["/"];

/** Past this many pixels the bar may hide. Below it, always shown. */
const HIDE_AFTER_PX = 140;

/** Ignore scroll jitter smaller than this, so the bar does not flicker. */
const DIRECTION_THRESHOLD_PX = 8;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const revealOnScroll = REVEAL_ON_SCROLL_ROUTES.includes(pathname);

  // "scrolled" drives the background; "hidden" slides the bar out of view.
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!revealOnScroll) return;

    let lastY = window.scrollY;
    let frame = 0;

    const onScroll = () => {
      // Coalesce to one update per frame: scroll fires far faster than the
      // browser paints, and setState per event is wasted work on a phone.
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const delta = y - lastY;

        setScrolled(y > HIDE_AFTER_PX);

        if (Math.abs(delta) >= DIRECTION_THRESHOLD_PX) {
          // Near the top there is nothing to hide from, and an open menu must
          // never have the bar slide out from under its close button.
          setHidden(y > HIDE_AFTER_PX && delta > 0);
          lastY = y;
        }
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [revealOnScroll]);

  // An open menu pins the bar, so the hamburger cannot scroll away mid-gesture.
  const barHidden = hidden && !mobileOpen;

  // Lock the page behind the overlay. Without this the body scrolls under
  // the open menu, which on iOS leaves you somewhere unexpected after the
  // menu closes.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/*
        Two layouts from one element.

        Without reveal-on-scroll it is absolute, exactly as before — no layout
        shift, no behaviour change on any page but the homepage.

        With it, the bar is fixed and slides out on the way down, back in on
        the way up. The background only appears once scrolled, so at the top of
        the hero it still looks like the transparent bar it has always been.

        Translucent dark rather than cream, because the nav text is white and
        the top strip of the hero photos is sky: four of the six measure over
        150/255 there, one as high as 223. A dark scrim is what makes white
        text legible over bright sky — cream would need the text to flip, and
        would vanish into the cream page background further down.
      */}
      <nav
        className={[
          "top-0 left-0 right-0 px-8 py-4",
          // z-index belongs to each branch, not the base: two z- classes on one
          // element leaves the winner to stylesheet order rather than intent.
          revealOnScroll
            ? "fixed z-40 transition-transform duration-300 motion-reduce:transition-none"
            : "absolute z-10",
          revealOnScroll && barHidden ? "-translate-y-full" : "translate-y-0",
          revealOnScroll && scrolled
            ? "bg-navy/80 backdrop-blur-md shadow-lg shadow-black/10"
            : "",
        ].join(" ")}
      >
        <div className="max-w-[1200px] mx-auto flex justify-center items-center">
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {leftLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-white/90 no-underline font-medium transition-colors text-[0.95rem] hover:text-white ${
                  isActive(link.href) ? "text-white" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}

            <Link href="/" className="mx-4 inline-flex">
              <Image
                src="/images/logormbg.png"
                alt="Lakeside Retreat"
                width={441}
                height={178}
                className="h-12 w-auto"
                priority
              />
            </Link>

            {rightLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-white/90 no-underline font-medium transition-colors text-[0.95rem] hover:text-white ${
                  isActive(link.href) ? "text-white" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile header */}
          <div className="flex md:hidden justify-between items-center w-full">
            <Link href="/" className="inline-flex">
              <Image
                src="/images/logormbg.png"
                alt="Lakeside Retreat"
                width={441}
                height={178}
                className="h-10 w-auto"
                priority
              />
            </Link>
            {/* -mr-2 pulls the enlarged hit area back so the glyph stays
                optically aligned with the edge it had at 22px wide. */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              className="-mr-2 flex min-h-11 min-w-11 items-center justify-center bg-transparent border-none text-white text-2xl cursor-pointer"
            >
              &#9776;
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        /* The overlay scrolls rather than clipping. Centring with plain
           `justify-center` pushed the first and last links past both edges
           in landscape, where they became unreachable; `min-h-full` on the
           inner column keeps them centred when they fit and lets the
           container scroll when they don't. */
        <div
          id="mobile-menu"
          className="fixed inset-0 z-[1001] bg-white/[0.98] backdrop-blur-xl"
        >
          {/* Outside the scroll container on purpose. `backdrop-blur` makes
              this overlay a containing block, so a `fixed` button inside the
              scrolling div would scroll away with the links. */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="absolute top-4 right-4 z-10 flex min-h-11 min-w-11 items-center justify-center bg-transparent border-none text-2xl cursor-pointer text-body"
          >
            &#10005;
          </button>
          <div className="h-full overflow-y-auto overscroll-contain">
            <div className="flex min-h-full flex-col items-center justify-center gap-1 px-6 py-20">
              {allLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-11 items-center px-6 text-body no-underline text-xl font-medium hover:text-burgundy"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
