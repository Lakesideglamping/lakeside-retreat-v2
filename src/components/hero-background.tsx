import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Hero section with a priority-loaded background image.
 *
 * Historically, public pages used a CSS `background-image` with an inline
 * `<style backgroundImage: ...>`. That:
 *   - Bypasses next/image → no AVIF/WebP, no responsive srcset, no LCP priority
 *   - Forces a blocking CSS paint before the image downloads
 *   - Kills Core Web Vitals / LCP on every landing page
 *
 * Using this component everywhere instead guarantees the hero image is
 * served through next/image with `priority`, `fill`, and a `sizes="100vw"`
 * hint — measurable LCP improvement on mobile. Guarded by hero-background
 * test which fails if `backgroundImage:` reappears in any public page.
 *
 * Usage:
 *   <HeroBackground src="/images/foo.jpeg" alt="Foo" minHeight="50vh">
 *     <h1>Title</h1>
 *   </HeroBackground>
 */
export function HeroBackground({
  src,
  alt,
  minHeight = "50vh",
  overlayOpacity = 0.5,
  priority = true,
  children,
  className = "",
}: {
  src: string;
  alt: string;
  minHeight?: string;
  overlayOpacity?: number;
  priority?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative flex items-center justify-center text-center text-white overflow-hidden ${className}`}
      style={{ minHeight }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover -z-10"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
        aria-hidden="true"
      />
      <div className="relative z-10 pt-20 px-5 w-full">{children}</div>
    </section>
  );
}
