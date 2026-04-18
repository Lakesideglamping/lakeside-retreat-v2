"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminPost } from "@/lib/admin-api";
import { FormField } from "@/components/admin/ui/form-field";
import { Alert } from "@/components/admin/ui/alert";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";

const ACCOMMODATION_OPTIONS = [
  { value: "dome-pinot", label: "Dome Pinot" },
  { value: "dome-rose", label: "Dome Rosé" },
  { value: "lakeside-cottage", label: "Lakeside Cottage" },
];

export function BookingForm() {
  const router = useRouter();

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [totalPrice, setTotalPrice] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!guestName.trim()) errors.guest_name = "Name is required";
    if (!guestEmail.trim()) errors.guest_email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      errors.guest_email = "Invalid email address";
    }
    if (!accommodation) errors.accommodation = "Accommodation is required";
    if (!checkIn) errors.check_in = "Check-in date is required";
    if (!checkOut) errors.check_out = "Check-out date is required";
    if (checkIn && checkOut && checkOut <= checkIn) {
      errors.check_out = "Check-out must be after check-in";
    }

    const guestCount = parseInt(guests, 10);
    if (isNaN(guestCount) || guestCount < 1 || guestCount > 10) {
      errors.guests = "Guests must be between 1 and 10";
    }

    if (totalPrice && (isNaN(parseFloat(totalPrice)) || parseFloat(totalPrice) < 0)) {
      errors.total_price = "Invalid price";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        accommodation,
        check_in: checkIn,
        check_out: checkOut,
        guests: parseInt(guests, 10),
        booking_source: "manual",
      };

      if (guestPhone.trim()) payload.guest_phone = guestPhone.trim();
      if (totalPrice) payload.total_price = parseFloat(totalPrice);
      if (notes.trim()) payload.notes = notes.trim();

      const result = await adminPost<{ id: string }>("/api/admin/bookings", payload);
      router.push(`/admin/bookings/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push("/admin/bookings")}
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to bookings
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Booking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a manual booking
        </p>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Information */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Guest Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Guest Name"
              name="guest_name"
              value={guestName}
              onChange={setGuestName}
              required
              placeholder="Full name"
              error={fieldErrors.guest_name}
            />
            <FormField
              label="Email"
              name="guest_email"
              type="email"
              value={guestEmail}
              onChange={setGuestEmail}
              required
              placeholder="guest@example.com"
              error={fieldErrors.guest_email}
            />
            <FormField
              label="Phone"
              name="guest_phone"
              value={guestPhone}
              onChange={setGuestPhone}
              placeholder="+64 21 xxx xxxx"
            />
          </div>
        </div>

        {/* Booking Details */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Booking Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Accommodation"
              name="accommodation"
              type="select"
              value={accommodation}
              onChange={setAccommodation}
              options={ACCOMMODATION_OPTIONS}
              required
              placeholder="Select accommodation..."
              error={fieldErrors.accommodation}
            />
            <FormField
              label="Number of Guests"
              name="guests"
              type="number"
              value={guests}
              onChange={setGuests}
              required
              error={fieldErrors.guests}
            />
            <FormField
              label="Check-in Date"
              name="check_in"
              type="date"
              value={checkIn}
              onChange={setCheckIn}
              required
              error={fieldErrors.check_in}
            />
            <FormField
              label="Check-out Date"
              name="check_out"
              type="date"
              value={checkOut}
              onChange={setCheckOut}
              required
              error={fieldErrors.check_out}
            />
            <FormField
              label="Total Price"
              name="total_price"
              type="number"
              value={totalPrice}
              onChange={setTotalPrice}
              placeholder="e.g. 635"
              error={fieldErrors.total_price}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Notes</h2>
          <FormField
            label="Notes"
            name="notes"
            type="textarea"
            value={notes}
            onChange={setNotes}
            placeholder="Any additional notes about this booking..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/bookings")}
            disabled={submitting}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a5a] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#234848] disabled:bg-[#2d5a5a]/60"
          >
            {submitting && <LoadingSpinner size="sm" className="text-white" />}
            Create Booking
          </button>
        </div>
      </form>
    </div>
  );
}
