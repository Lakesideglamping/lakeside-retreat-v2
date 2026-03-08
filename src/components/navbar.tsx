"use client";

import { useState } from "react";
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
  { href: "/explore", label: "Explore" },
  { href: "/contact", label: "Contact" },
];

const allLinks = [
  { href: "/", label: "Home" },
  { href: "/stay", label: "Stay" },
  { href: "/gallery", label: "Gallery" },
  { href: "/guides", label: "Guides" },
  { href: "/reviews", label: "Reviews" },
  { href: "/our-story", label: "Our Story" },
  { href: "/explore", label: "Explore" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <a
        href="#main-content"
        className="absolute top-[-40px] left-0 bg-burgundy text-white px-4 py-2 z-[10000] transition-all duration-200 no-underline focus:top-0"
      >
        Skip to main content
      </a>

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
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="bg-transparent border-none text-white text-2xl cursor-pointer"
            >
              &#9776;
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-white/[0.98] backdrop-blur-xl z-[1001] flex flex-col items-center justify-center gap-6">
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="absolute top-6 right-6 bg-transparent border-none text-2xl cursor-pointer text-body"
          >
            &#10005;
          </button>
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-body no-underline text-xl font-medium hover:text-burgundy"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
