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

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

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
      <nav className="absolute top-0 left-0 right-0 z-10 px-8 py-4">
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
