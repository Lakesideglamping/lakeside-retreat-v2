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
 * The homepage is the only page whose hero carries the burgundy wordmark.
 *
 * Everywhere else the logo is white from the top, because those heroes are
 * darker or more heavily overlaid and burgundy disappears into them — most
 * visibly on the cottage's sunset, where it is barely readable today. The
 * homepage hero is bright enough that burgundy still reads, and it is the
 * page most people arrive on, so it keeps the full-colour mark.
 */
const BURGUNDY_LOGO_ROUTES = ["/"];

/** Past this many pixels the bar may hide. Below it, always shown. */
const HIDE_AFTER_PX = 140;

/** Ignore scroll jitter smaller than this, so the bar does not flicker. */
const DIRECTION_THRESHOLD_PX = 8;

/**
 * The wordmark.
 *
 * White on every page except the homepage hero, which keeps the burgundy mark
 * until the dark bar slides in under it.
 *
 * logormbg-white.png is the same 441x178 canvas as the burgundy original with
 * its RGB painted white and alpha untouched — same artwork, same framing — so
 * the two sit exactly on top of each other with nothing shifting. It is not
 * the email's logo-white.png, which is cropped tight to the mark.
 *
 * Only the homepage needs both files; every other page renders one image and
 * never requests the other.
 */
function NavLogo({
  heightClass,
  showWhite,
  crossfade,
}: {
  heightClass: string;
  showWhite: boolean;
  /**
   * True only where the colour actually changes — the homepage, burgundy over
   * the hero and white once the bar is out. Elsewhere the logo is white the
   * whole way down, so a single image is rendered and the other file is never
   * requested.
   */
  crossfade: boolean;
}) {
  const shared = `${heightClass} w-auto`;

  if (!crossfade) {
    return (
      <Image
        src={showWhite ? "/images/logormbg-white.png" : "/images/logormbg.png"}
        alt="Lakeside Retreat"
        width={441}
        height={178}
        className={shared}
        priority
      />
    );
  }

  const fading = `${shared} transition-opacity duration-300 motion-reduce:transition-none`;

  return (
    <span className="relative inline-flex">
      <Image
        src="/images/logormbg.png"
        alt="Lakeside Retreat"
        width={441}
        height={178}
        className={`${fading} ${showWhite ? "opacity-0" : "opacity-100"}`}
        priority
      />
      {/* Stacked and cross-faded rather than swapping one src: a swap shows
          nothing while the new file is fetched, which mid-scroll on a phone
          reads as the logo blinking out. aria-hidden so the name is announced
          once, by the burgundy copy above. */}
      <Image
        src="/images/logormbg-white.png"
        alt=""
        aria-hidden="true"
        width={441}
        height={178}
        className={`${fading} absolute left-0 top-0 ${
          showWhite ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // The bar now follows you on every page. Only the hero logo colour differs.
  const burgundyHero = BURGUNDY_LOGO_ROUTES.includes(pathname);

  // "scrolled" drives the background; "hidden" slides the bar out of view.
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
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
  }, []);

  // An open menu pins the bar, so the hamburger cannot scroll away mid-gesture.
  const barHidden = hidden && !mobileOpen;

  // White everywhere except the homepage hero, and white there too once the
  // dark bar is out from under it.
  const showWhiteLogo = !burgundyHero || scrolled;

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
        Fixed, sliding out on the way down and back in on the way up.

        It was absolute, which meant it scrolled away for good: on
        /lakeside-cottage — 11,700px on a phone, some fourteen screens — the
        menu could only be reached by scrolling all the way back to the top.

        The background appears only once scrolled past HIDE_AFTER_PX, so at the
        top of a hero the bar still looks like the transparent one it has
        always been. Fixed and absolute are both out of flow, so nothing in the
        page shifted when this changed.

        Translucent dark rather than cream, because the nav text is white and
        the top strip of the hero photos is sky: four of the six measure over
        150/255 there, one as high as 223. A dark scrim is what makes white
        text legible over bright sky — cream would need the text to flip, and
        would vanish into the cream page background further down.
      */}
      <nav
        className={[
          "fixed top-0 left-0 right-0 z-40 px-8 py-4",
          "transition-transform duration-300 motion-reduce:transition-none",
          barHidden ? "-translate-y-full" : "translate-y-0",
          scrolled ? "bg-navy/80 backdrop-blur-md shadow-lg shadow-black/10" : "",
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
              <NavLogo heightClass="h-12" showWhite={showWhiteLogo} crossfade={burgundyHero} />
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
              <NavLogo heightClass="h-10" showWhite={showWhiteLogo} crossfade={burgundyHero} />
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
