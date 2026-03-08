"use client";

interface SubmitButtonProps {
  type?: "submit" | "button";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function SubmitButton({
  type = "submit",
  disabled = false,
  loading = false,
  className = "",
  children,
  onClick,
}: SubmitButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-block px-10 py-4 rounded-full font-semibold transition-all duration-300 bg-gradient-to-br from-burgundy to-teal-dark text-white hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Sending...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
