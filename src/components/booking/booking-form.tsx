"use client";

import { useState } from "react";
import type { Accommodation } from "@/lib/accommodations";
import { calculatePrice, formatNZD } from "@/lib/pricing";
import { SubmitButton } from "@/components/ui/submit-button";

interface BookingFormProps {
  accommodation: Accommodation;
  checkIn: string;
  checkOut: string;
  guests: number;
  pets: number;
  onBack: () => void;
  seasonalMultiplier?: number;
}

interface FormFields {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string;
  adultsOnlyConfirmed: boolean;
}

type Status = "idle" | "submitting" | "error";

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-burgundy focus:ring-1 focus:ring-burgundy outline-none transition-colors";
const errorClass = "text-red-600 text-sm mt-1";

export function BookingForm({
  accommodation,
  checkIn,
  checkOut,
  guests,
  pets,
  onBack,
  seasonalMultiplier = 1.0,
}: BookingFormProps) {
  const [form, setForm] = useState<FormFields>({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    specialRequests: "",
    adultsOnlyConfirmed: false,
  });
  const [promoCode, setPromoCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormFields, string>>
  >({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const { totalAmount } = calculatePrice(
    accommodation,
    checkIn,
    checkOut,
    guests,
    pets,
    seasonalMultiplier
  );

  const nights = Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  function updateField<K extends keyof FormFields>(field: K, value: FormFields[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormFields, string>> = {};

    if (!form.guestName || form.guestName.trim().length < 2) {
      errors.guestName = "Please enter your full name (at least 2 characters)";
    }
    if (!form.guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guestEmail)) {
      errors.guestEmail = "Please enter a valid email address";
    }
    const phone = form.guestPhone.trim();
    if (!phone || phone.replace(/[^0-9]/g, "").length < 6) {
      errors.guestPhone = "Please enter a contact phone number";
    }
    if (form.specialRequests && form.specialRequests.length > 500) {
      errors.specialRequests = "Special requests must be under 500 characters";
    }
    if (!form.adultsOnlyConfirmed) {
      errors.adultsOnlyConfirmed =
        "Please confirm every guest in your party is 18 years or older";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!validate()) return;

    setStatus("submitting");

    try {
      const res = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accommodation: accommodation.id,
          checkIn,
          checkOut,
          guests,
          pets,
          guestName: form.guestName.trim(),
          guestEmail: form.guestEmail.trim(),
          guestPhone: form.guestPhone.trim(),
          specialRequests: form.specialRequests.trim() || undefined,
          adultsOnlyConfirmed: form.adultsOnlyConfirmed,
          ...(promoCode.trim() ? { promoCode: promoCode.trim().toUpperCase() } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        if (res.status === 409) {
          setErrorMessage(
            "These dates are no longer available. Please go back and select different dates."
          );
        } else if (res.status === 429) {
          setErrorMessage("Too many requests. Please wait a moment and try again.");
        } else {
          setErrorMessage(data.error || "Something went wrong. Please try again.");
        }
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStatus("error");
        setErrorMessage("Unable to create payment session. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage(
        "Network error. Please check your connection and try again."
      );
    }
  }

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-NZ", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div>
      {/* Booking summary */}
      <div className="bg-cream rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-burgundy">Booking Summary</h3>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-burgundy hover:underline px-3 py-2 -my-2 -mx-3 rounded min-h-[44px] min-w-[44px]"
          >
            Change dates
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted">Accommodation</p>
            <p className="font-semibold">{accommodation.name}</p>
          </div>
          <div>
            <p className="text-muted">Guests</p>
            <p className="font-semibold">
              {guests} guest{guests > 1 ? "s" : ""}
              {pets > 0 && ` + ${pets} pet${pets > 1 ? "s" : ""}`}
            </p>
          </div>
          <div>
            <p className="text-muted">Check-in</p>
            <p className="font-semibold">{formatDate(checkIn)}</p>
          </div>
          <div>
            <p className="text-muted">Check-out</p>
            <p className="font-semibold">{formatDate(checkOut)}</p>
          </div>
          <div>
            <p className="text-muted">Duration</p>
            <p className="font-semibold">
              {nights} night{nights > 1 ? "s" : ""}
            </p>
          </div>
          <div>
            <p className="text-muted">Total</p>
            <p className="font-semibold text-burgundy">{formatNZD(totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Guest details form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <h3 className="font-display text-xl text-burgundy">Your Details</h3>

        {status === "error" && errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm"
          >
            {errorMessage}
          </div>
        )}

        <div>
          <label htmlFor="guestName" className="block text-sm font-semibold mb-1">
            Full Name *
          </label>
          <input
            id="guestName"
            type="text"
            value={form.guestName}
            onChange={(e) => updateField("guestName", e.target.value)}
            className={inputClass}
            placeholder="Your full name"
            autoComplete="name"
            aria-invalid={!!fieldErrors.guestName}
            aria-describedby={fieldErrors.guestName ? "guestName-error" : undefined}
          />
          {fieldErrors.guestName && (
            <p id="guestName-error" role="alert" className={errorClass}>
              {fieldErrors.guestName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="guestEmail" className="block text-sm font-semibold mb-1">
            Email *
          </label>
          <input
            id="guestEmail"
            type="email"
            value={form.guestEmail}
            onChange={(e) => updateField("guestEmail", e.target.value)}
            className={inputClass}
            placeholder="your@email.com"
            autoComplete="email"
            aria-invalid={!!fieldErrors.guestEmail}
            aria-describedby={fieldErrors.guestEmail ? "guestEmail-error" : undefined}
          />
          {fieldErrors.guestEmail && (
            <p id="guestEmail-error" role="alert" className={errorClass}>
              {fieldErrors.guestEmail}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="guestPhone" className="block text-sm font-semibold mb-1">
            Phone <span className="text-burgundy">*</span>
          </label>
          <input
            id="guestPhone"
            type="tel"
            value={form.guestPhone}
            onChange={(e) => updateField("guestPhone", e.target.value)}
            className={inputClass}
            placeholder="+64 21 123 4567"
            autoComplete="tel"
            required
            aria-invalid={!!fieldErrors.guestPhone}
            aria-describedby={fieldErrors.guestPhone ? "guestPhone-error" : undefined}
          />
          {fieldErrors.guestPhone && (
            <p id="guestPhone-error" role="alert" className={errorClass}>
              {fieldErrors.guestPhone}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="specialRequests"
            className="block text-sm font-semibold mb-1"
          >
            Special Requests{" "}
            <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea
            id="specialRequests"
            rows={3}
            value={form.specialRequests}
            onChange={(e) => updateField("specialRequests", e.target.value)}
            className={inputClass}
            placeholder="Early check-in, dietary requirements, celebrations..."
          />
          {fieldErrors.specialRequests && (
            <p className={errorClass}>{fieldErrors.specialRequests}</p>
          )}
        </div>

        <div>
          {/* Direct-booking incentive: one tap applies the standing 5% code,
              making the direct site cheaper than Airbnb/Booking.com. */}
          {promoCode.trim().toUpperCase() !== "BOOKDIRECT" && (
            <button
              type="button"
              onClick={() => setPromoCode("BOOKDIRECT")}
              className="mb-3 flex w-full items-center justify-between gap-3 rounded-lg border border-burgundy/30 bg-burgundy/5 px-4 py-3 text-left transition-colors hover:bg-burgundy/10"
            >
              <span className="text-sm text-body">
                <span className="font-semibold text-burgundy">Book direct &amp; save 5%</span>
                <span className="block text-xs text-muted">
                  Cheaper than Airbnb &amp; Booking.com — tap to apply code BOOKDIRECT
                </span>
              </span>
              <span className="shrink-0 rounded-md bg-burgundy px-3 py-1.5 text-xs font-semibold text-white">
                Apply
              </span>
            </button>
          )}
          <label htmlFor="promoCode" className="block text-sm font-semibold mb-1">
            Promo / partner code{" "}
            <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            id="promoCode"
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className={inputClass}
            placeholder="Enter code"
            autoComplete="off"
            spellCheck={false}
          />
          {promoCode.trim().toUpperCase() === "BOOKDIRECT" && (
            <p className="mt-1.5 text-xs font-medium text-green-700">
              &#10003; 5% direct-booking discount will be applied at checkout
            </p>
          )}
        </div>

        <div className="rounded-lg border border-gray-300 bg-cream/40 p-4">
          <label
            htmlFor="adultsOnlyConfirmed"
            className="flex items-start gap-3 cursor-pointer"
          >
            <input
              id="adultsOnlyConfirmed"
              type="checkbox"
              checked={form.adultsOnlyConfirmed}
              onChange={(e) => updateField("adultsOnlyConfirmed", e.target.checked)}
              className="mt-1 h-5 w-5 accent-burgundy"
            />
            <span className="text-sm leading-relaxed">
              I confirm every guest in my party is <strong>18 years or older</strong>.
              Lakeside Retreat is strictly adults-only &mdash; parties arriving with
              anyone under 18 will be refused check-in with no refund.
            </span>
          </label>
          {fieldErrors.adultsOnlyConfirmed && (
            <p className={errorClass}>{fieldErrors.adultsOnlyConfirmed}</p>
          )}
        </div>

        <div className="pt-2">
          <SubmitButton loading={status === "submitting"}>
            {status === "submitting"
              ? "Redirecting to payment..."
              : `Proceed to Payment \u2014 ${formatNZD(totalAmount)}`}
          </SubmitButton>
        </div>

        <p className="text-xs text-muted text-center">
          You&apos;ll be redirected to Stripe&apos;s secure checkout.
          No charge is made until you confirm payment.
        </p>
      </form>
    </div>
  );
}
