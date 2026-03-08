"use client";

interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "number" | "date" | "select" | "textarea";
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const baseInputClasses =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-[#2d5a5a] focus:outline-none focus:ring-1 focus:ring-[#2d5a5a] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  options = [],
  required = false,
  placeholder,
  disabled = false,
}: FormFieldProps) {
  const borderClass = error ? "border-red-400" : "border-gray-300";

  const sharedProps = {
    id: name,
    name,
    disabled,
    className: `${baseInputClasses} ${borderClass}`,
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      {type === "select" ? (
        <select
          {...sharedProps}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder ?? "Select..."}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          {...sharedProps}
          rows={4}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          {...sharedProps}
          type={type}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
