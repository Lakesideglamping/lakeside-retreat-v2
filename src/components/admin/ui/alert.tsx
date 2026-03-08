"use client";

interface AlertProps {
  variant: "success" | "warning" | "error" | "info";
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const variantStyles: Record<
  AlertProps["variant"],
  { border: string; bg: string; icon: string; title: string }
> = {
  success: {
    border: "border-l-green-500",
    bg: "bg-green-50",
    icon: "text-green-500",
    title: "text-green-800",
  },
  warning: {
    border: "border-l-yellow-500",
    bg: "bg-yellow-50",
    icon: "text-yellow-500",
    title: "text-yellow-800",
  },
  error: {
    border: "border-l-red-500",
    bg: "bg-red-50",
    icon: "text-red-500",
    title: "text-red-800",
  },
  info: {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    icon: "text-blue-500",
    title: "text-blue-800",
  },
};

const icons: Record<AlertProps["variant"], React.ReactNode> = {
  success: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
};

export function Alert({
  variant,
  title,
  children,
  dismissible = false,
  onDismiss,
}: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`flex w-full gap-3 rounded-lg border-l-4 ${styles.border} ${styles.bg} p-4`}
      role="alert"
    >
      <div className={`shrink-0 ${styles.icon}`}>{icons[variant]}</div>
      <div className="flex-1">
        {title && (
          <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
        )}
        <div className="text-sm text-gray-700">{children}</div>
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="shrink-0 text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Dismiss"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
