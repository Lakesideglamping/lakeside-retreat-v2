interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; direction: "up" | "down" };
  icon?: React.ReactNode;
  className?: string;
}

export function Card({
  title,
  value,
  subtitle,
  trend,
  icon,
  className = "",
}: CardProps) {
  return (
    <div
      className={`rounded-xl bg-white p-6 shadow-sm border border-gray-100 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-400">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2d5a5a]/10 text-[#2d5a5a]">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          {trend.direction === "up" ? (
            <svg
              className="h-4 w-4 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25"
              />
            </svg>
          )}
          <span
            className={`text-sm font-medium ${
              trend.direction === "up" ? "text-green-500" : "text-red-500"
            }`}
          >
            {trend.value}%
          </span>
        </div>
      )}
    </div>
  );
}
