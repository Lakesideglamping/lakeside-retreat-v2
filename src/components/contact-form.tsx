"use client";

import { useState } from "react";
import { contactFormSchema, type ContactFormData } from "@/lib/validations";
import { SubmitButton } from "@/components/ui/submit-button";

type Status = "idle" | "submitting" | "success" | "error";

const subjectOptions = [
  { value: "", label: "Select a subject..." },
  { value: "booking", label: "Booking Enquiry" },
  { value: "availability", label: "Availability Check" },
  { value: "special", label: "Special Request" },
  { value: "feedback", label: "Feedback" },
  { value: "other", label: "Other" },
];

const initialForm: ContactFormData = {
  name: "",
  email: "",
  subject: "other",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<ContactFormData>(initialForm);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ContactFormData, string>>
  >({});

  function updateField(field: keyof ContactFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setErrorMessage("");

    // Client-side validation
    const result = contactFormSchema.safeParse(form);
    if (!result.success) {
      const errors: Partial<Record<keyof ContactFormData, string>> = {};
      for (const [key, messages] of Object.entries(
        result.error.flatten().fieldErrors
      )) {
        errors[key as keyof ContactFormData] = messages?.[0];
      }
      setFieldErrors(errors);
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong.");
        return;
      }

      setStatus("success");
      setForm(initialForm);
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-burgundy focus:ring-1 focus:ring-burgundy outline-none transition-colors";
  const errorClass = "text-red-600 text-sm mt-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {status === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
          Thank you for your message! We&apos;ll be in touch soon.
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          {errorMessage}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-semibold mb-1">
          Name *
        </label>
        <input
          id="name"
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          className={inputClass}
          placeholder="Your full name"
        />
        {fieldErrors.name && <p className={errorClass}>{fieldErrors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold mb-1">
          Email *
        </label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          className={inputClass}
          placeholder="your@email.com"
        />
        {fieldErrors.email && (
          <p className={errorClass}>{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-semibold mb-1">
          Subject *
        </label>
        <select
          id="subject"
          value={form.subject}
          onChange={(e) => updateField("subject", e.target.value)}
          className={inputClass}
        >
          {subjectOptions.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={!opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {fieldErrors.subject && (
          <p className={errorClass}>{fieldErrors.subject}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold mb-1">
          Message *
        </label>
        <textarea
          id="message"
          rows={5}
          value={form.message}
          onChange={(e) => updateField("message", e.target.value)}
          className={inputClass}
          placeholder="How can we help?"
        />
        {fieldErrors.message && (
          <p className={errorClass}>{fieldErrors.message}</p>
        )}
      </div>

      <SubmitButton loading={status === "submitting"}>
        Send Message
      </SubmitButton>
    </form>
  );
}
