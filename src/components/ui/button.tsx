import Link from "next/link";

type ButtonVariant = "primary" | "outline" | "outline-dark";

interface ButtonProps {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-burgundy to-teal-dark text-white hover:opacity-90 hover:-translate-y-0.5",
  outline:
    "bg-transparent border-2 border-white text-white hover:bg-white hover:text-teal",
  "outline-dark":
    "bg-transparent border-2 border-burgundy text-burgundy hover:bg-burgundy hover:text-white",
};

export function Button({
  href,
  variant = "primary",
  className = "",
  ariaLabel,
  children,
}: ButtonProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`inline-block px-10 py-4 rounded-full no-underline font-semibold transition-all duration-300 ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
