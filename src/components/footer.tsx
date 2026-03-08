import Link from "next/link";
import Image from "next/image";

const stayLinks = [
  { href: "/dome-pinot", label: "Dome Pinot" },
  { href: "/dome-rose", label: "Dome Ros\u00e9" },
  { href: "/lakeside-cottage", label: "Lakeside Cottage" },
  { href: "/#booking", label: "Check Availability" },
];

const exploreLinks = [
  { href: "/explore", label: "Things to Do" },
  { href: "/guides", label: "Local Guides" },
  { href: "/central-otago-wine-trail", label: "Wine Trail Guide" },
  { href: "/cromwell-activities", label: "Cromwell Activities" },
  { href: "/couples-retreat-central-otago", label: "Romantic Getaways" },
  { href: "/weekend-getaway-queenstown", label: "Weekend Escapes" },
  { href: "/gallery", label: "Photo Gallery" },
  { href: "/reviews", label: "Guest Reviews" },
];

const aboutLinks = [
  { href: "/our-story", label: "Our Story" },
  { href: "/contact", label: "Contact Us" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

export function Footer() {
  return (
    <footer className="bg-navy text-white pt-12 pb-8 px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Link grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          <FooterSection title="Stay With Us" links={stayLinks} />
          <FooterSection title="Explore" links={exploreLinks} />
          <FooterSection title="About" links={aboutLinks} />
        </div>

        {/* Social */}
        <div className="flex justify-center gap-6 py-6 border-t border-white/10">
          <a
            href="https://instagram.com/lakesideretreatnz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-transform hover:scale-110"
          >
            <Image
              src="/images/Newinstagram.png"
              alt="Instagram"
              width={30}
              height={30}
              className="object-contain"
            />
          </a>
          <a
            href="https://facebook.com/lakesideretreatnz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-transform hover:scale-110"
          >
            <Image
              src="/images/facebook-logo.png"
              alt="Facebook"
              width={30}
              height={30}
              className="object-contain"
            />
          </a>
          <a
            href="mailto:info@lakesideretreat.co.nz"
            className="inline-block transition-transform hover:scale-110"
          >
            <Image
              src="/images/email-icon.png"
              alt="Email"
              width={30}
              height={30}
              className="object-contain"
            />
          </a>
        </div>

        {/* Contact info */}
        <div className="text-center text-white/70 text-sm leading-7 mb-4">
          <p>info@lakesideretreat.co.nz</p>
          <p>96 Smiths Way, Mount Pisa, Cromwell 9383, New Zealand</p>
        </div>

        {/* Legal */}
        <div className="text-center mb-4">
          <Link
            href="/privacy-policy"
            className="text-white/60 no-underline text-sm mx-2 hover:text-white"
          >
            Privacy Policy
          </Link>
          <span className="text-white/30">|</span>
          <Link
            href="/terms"
            className="text-white/60 no-underline text-sm mx-2 hover:text-white"
          >
            Terms &amp; Conditions
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-center text-white/50 text-xs">
          <p>&copy; 2026 Lakeside Retreat Central Otago. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterSection({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="font-body text-lg mb-4 bg-gradient-to-r from-burgundy to-teal-dark bg-clip-text text-transparent">
        {title}
      </h3>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="block text-white/70 no-underline text-sm mb-2 transition-colors hover:text-white"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
