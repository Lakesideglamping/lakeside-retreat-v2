"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getAll, getById, type Accommodation } from "@/lib/accommodations";
import { BookingCalendar } from "./calendar";
import { PriceSummary } from "./price-summary";
import { BookingForm } from "./booking-form";
import { SubmitButton } from "@/components/ui/submit-button";
import Image from "next/image";

type Step = 1 | 2;
type AvailabilityStatus =
  | "idle"
  | "checking"
  | "available"
  | "unavailable"
  | "error";

const accommodations = getAll();

export function BookingWidget() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("a") || "";

  const [accommodation, setAccommodation] = useState<string>(
    accommodations.find((a) => a.id === preselected)?.id || ""
  );
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [pets, setPets] = useState(0);
  const [step, setStep] = useState<Step>(1);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [availability, setAvailability] =
    useState<AvailabilityStatus>("idle");
  const [dateError, setDateError] = useState("");

  const acc: Accommodation | null = accommodation ? (getById(accommodation) ?? null) : null;

  // Fetch blocked dates when accommodation changes
  const fetchBlocked = useCallback(async (accId: string) => {
    setLoadingDates(true);
    try {
      const res = await fetch(
        `/api/blocked-dates?accommodation=${encodeURIComponent(accId)}`
      );
      const data = await res.json();
      if (data.success) {
        setBlockedDates(data.blockedDates || []);
      } else {
        setBlockedDates([]);
      }
    } catch {
      setBlockedDates([]);
    } finally {
      setLoadingDates(false);
    }
  }, []);

  useEffect(() => {
    if (accommodation) {
      fetchBlocked(accommodation);
      // Reset dates when accommodation changes
      setCheckIn(null);
      setCheckOut(null);
      setAvailability("idle");
      setDateError("");
    }
  }, [accommodation, fetchBlocked]);

  // Reset guests/pets when accommodation changes
  useEffect(() => {
    if (acc) {
      setGuests(Math.min(guests, acc.maxGuests));
      if (acc.adultsOnly) setPets(0);
    }
  }, [acc]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDateSelect(date: string) {
    setAvailability("idle");
    setDateError("");

    if (!checkIn || (checkIn && checkOut)) {
      // Start new selection
      setCheckIn(date);
      setCheckOut(null);
      return;
    }

    // Second click = check-out
    if (date <= checkIn) {
      // Clicked before check-in, restart
      setCheckIn(date);
      setCheckOut(null);
      return;
    }

    // Validate: no blocked dates in range
    const blockedSet = new Set(blockedDates);
    const current = new Date(checkIn);
    const end = new Date(date);
    current.setDate(current.getDate() + 1);
    while (current < end) {
      const dateStr = current.toISOString().split("T")[0];
      if (blockedSet.has(dateStr)) {
        setDateError(
          "Your selected range includes unavailable dates. Please choose different dates."
        );
        setCheckIn(date);
        setCheckOut(null);
        return;
      }
      current.setDate(current.getDate() + 1);
    }

    // Validate min stay
    const nights = Math.round(
      (end.getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (acc && nights < acc.minStay) {
      setDateError(
        `Minimum stay is ${acc.minStay} night${acc.minStay > 1 ? "s" : ""}. Please select a later check-out date.`
      );
      return;
    }

    setCheckOut(date);
  }

  async function checkAvailabilityAndContinue() {
    if (!accommodation || !checkIn || !checkOut) return;

    setAvailability("checking");
    setDateError("");

    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accommodation, checkIn, checkOut }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAvailability("error");
        setDateError(data.error || "Failed to check availability.");
        return;
      }

      if (data.available) {
        setAvailability("available");
        setStep(2);
      } else {
        setAvailability("unavailable");
        setDateError(
          "These dates are not available. Please select different dates."
        );
      }
    } catch {
      setAvailability("error");
      setDateError(
        "Network error. Please check your connection and try again."
      );
    }
  }

  function handleBack() {
    setStep(1);
    setAvailability("idle");
  }

  const canContinue =
    accommodation && checkIn && checkOut && availability !== "checking";

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <StepIndicator num={1} label="Select Dates" active={step === 1} />
        <div className="w-12 h-px bg-gray-300" />
        <StepIndicator num={2} label="Your Details" active={step === 2} />
        <div className="w-12 h-px bg-gray-300" />
        <StepIndicator num={3} label="Payment" active={false} />
      </div>

      {step === 1 && (
        <div className="space-y-8">
          {/* Accommodation selector */}
          <div>
            <h3 className="font-display text-xl text-teal mb-4">
              Choose Your Accommodation
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {accommodations.map((a) => (
                <AccommodationOption
                  key={a.id}
                  accommodation={a}
                  selected={accommodation === a.id}
                  onSelect={() => setAccommodation(a.id)}
                />
              ))}
            </div>
          </div>

          {/* Calendar */}
          {accommodation && (
            <div>
              <h3 className="font-display text-xl text-teal mb-4">
                Select Your Dates
              </h3>
              <BookingCalendar
                blockedDates={blockedDates}
                checkIn={checkIn}
                checkOut={checkOut}
                onDateSelect={handleDateSelect}
                minStay={acc?.minStay || 1}
                loading={loadingDates}
              />
              {dateError && (
                <p className="text-red-600 text-sm text-center mt-3">
                  {dateError}
                </p>
              )}
            </div>
          )}

          {/* Guests & pets */}
          {accommodation && checkIn && checkOut && acc && (
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Guests
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:border-teal transition-colors"
                    disabled={guests <= 1}
                  >
                    &minus;
                  </button>
                  <span className="text-lg font-semibold w-8 text-center">
                    {guests}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setGuests(Math.min(acc.maxGuests, guests + 1))
                    }
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:border-teal transition-colors"
                    disabled={guests >= acc.maxGuests}
                  >
                    +
                  </button>
                  <span className="text-sm text-muted">
                    (max {acc.maxGuests})
                  </span>
                </div>
                {acc.adultsOnly && (
                  <p className="text-xs text-burgundy mt-2 font-semibold">
                    Adults only &mdash; no children permitted
                  </p>
                )}
              </div>

              {!acc.adultsOnly && acc.petFee && (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Pets
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPets(Math.max(0, pets - 1))}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:border-teal transition-colors"
                      disabled={pets <= 0}
                    >
                      &minus;
                    </button>
                    <span className="text-lg font-semibold w-8 text-center">
                      {pets}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPets(Math.min(2, pets + 1))}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:border-teal transition-colors"
                      disabled={pets >= 2}
                    >
                      +
                    </button>
                    <span className="text-sm text-muted">
                      (${acc.petFee}/pet)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Price summary */}
          {accommodation && checkIn && checkOut && (
            <PriceSummary
              accommodation={acc}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              pets={pets}
            />
          )}

          {/* Continue button */}
          {accommodation && checkIn && checkOut && (
            <div className="pt-2">
              <SubmitButton
                loading={availability === "checking"}
                onClick={checkAvailabilityAndContinue}
                disabled={!canContinue}
              >
                {availability === "checking"
                  ? "Checking availability..."
                  : "Check Availability & Continue"}
              </SubmitButton>
            </div>
          )}
        </div>
      )}

      {step === 2 && acc && checkIn && checkOut && (
        <BookingForm
          accommodation={acc}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          pets={pets}
          onBack={handleBack}
        />
      )}
    </div>
  );
}

function StepIndicator({
  num,
  label,
  active,
}: {
  num: number;
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
          active
            ? "bg-teal text-white"
            : "bg-gray-200 text-muted"
        }`}
      >
        {num}
      </div>
      <span
        className={`text-sm hidden sm:inline ${
          active ? "text-teal font-semibold" : "text-muted"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function AccommodationOption({
  accommodation,
  selected,
  onSelect,
}: {
  accommodation: Accommodation;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-2xl p-4 transition-all border-2 ${
        selected
          ? "border-teal bg-teal/5 shadow-md"
          : "border-gray-200 bg-white hover:border-teal/50"
      }`}
    >
      <div className="relative h-28 rounded-xl overflow-hidden mb-3">
        <Image
          src={`/images/${accommodation.images[0]}`}
          alt={accommodation.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 33vw"
        />
      </div>
      <h4 className="font-display text-base text-teal">{accommodation.name}</h4>
      <p className="text-sm text-muted mt-0.5">{accommodation.description}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-burgundy font-semibold text-sm">
          From ${accommodation.basePrice}/night
        </span>
        {accommodation.adultsOnly && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
            Adults Only
          </span>
        )}
        {accommodation.petFee && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
            Pet Friendly
          </span>
        )}
      </div>
      {accommodation.minStay > 1 && (
        <p className="text-xs text-muted mt-1">
          Min. {accommodation.minStay} nights
        </p>
      )}
    </button>
  );
}
