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
  // If we can't reach /api/blocked-dates we used to silently render a fully
  // green calendar, which could let guests "book" a blocked night and only
  // hit the error at the availability check. Surface the failure so they
  // know why dates may look wrong and can retry.
  const [blockedError, setBlockedError] = useState<string | null>(null);
  const [availability, setAvailability] =
    useState<AvailabilityStatus>("idle");
  const [dateError, setDateError] = useState("");
  const [seasonalMultiplier, setSeasonalMultiplier] = useState(1.0);

  const acc: Accommodation | null = accommodation ? (getById(accommodation) ?? null) : null;

  // Fetch blocked dates when accommodation changes
  const fetchBlocked = useCallback(async (accId: string) => {
    setLoadingDates(true);
    setBlockedError(null);
    try {
      const res = await fetch(
        `/api/blocked-dates?accommodation=${encodeURIComponent(accId)}`
      );
      if (!res.ok) {
        setBlockedDates([]);
        setBlockedError(
          "We couldn't load live availability. Your dates will be verified before payment — please continue or try again."
        );
        return;
      }
      const data = await res.json();
      if (data.success) {
        setBlockedDates(data.blockedDates || []);
      } else {
        setBlockedDates([]);
        setBlockedError(
          "We couldn't load live availability. Your dates will be verified before payment — please continue or try again."
        );
      }
    } catch {
      setBlockedDates([]);
      setBlockedError(
        "Network error loading availability. Check your connection and retry."
      );
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
      setSeasonalMultiplier(1.0);
    }
  }, [accommodation, fetchBlocked]);

  // Fetch seasonal multiplier whenever accommodation + dates are both set
  useEffect(() => {
    if (!accommodation || !checkIn || !checkOut) return;
    fetch(
      `/api/pricing?accommodation=${accommodation}&checkIn=${checkIn}&checkOut=${checkOut}`
    )
      .then((r) => r.json())
      .then((d) => setSeasonalMultiplier(d.seasonalMultiplier ?? 1.0))
      .catch(() => setSeasonalMultiplier(1.0));
  }, [accommodation, checkIn, checkOut]);

  // Reset guests/pets when accommodation changes
  useEffect(() => {
    if (acc) {
      setGuests(Math.min(guests, acc.maxGuests));
      // Reset pets only for properties that don't allow them (no petFee).
      // "Adults only" (no children) is independent of "pet friendly" — the
      // cottage is both, so switching to it must NOT wipe the pet count.
      if (!acc.petFee) setPets(0);
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

    // Validate: no blocked dates in range.
    // Parse YYYY-MM-DD into a local-midnight Date (not UTC) so the string
    // we re-derive below stays in the same timezone as the calendar buttons.
    const blockedSet = new Set(blockedDates);
    const [ciY, ciM, ciD] = checkIn.split("-").map(Number);
    const [coY, coM, coD] = date.split("-").map(Number);
    const current = new Date(ciY, ciM - 1, ciD);
    const end = new Date(coY, coM - 1, coD);
    current.setDate(current.getDate() + 1);
    while (current < end) {
      const dateStr = `${current.getFullYear()}-${String(
        current.getMonth() + 1
      ).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
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
            <h3 className="font-display text-xl text-burgundy mb-4">
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
              <h3 className="font-display text-xl text-burgundy mb-4">
                Select Your Dates
              </h3>
              {blockedError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-3 flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-lg p-3 text-sm"
                >
                  <span className="text-amber-700 flex-1">{blockedError}</span>
                  <button
                    type="button"
                    onClick={() => fetchBlocked(accommodation)}
                    className="text-amber-800 font-semibold underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              <BookingCalendar
                blockedDates={blockedDates}
                checkIn={checkIn}
                checkOut={checkOut}
                onDateSelect={handleDateSelect}
                minStay={acc?.minStay || 1}
                loading={loadingDates}
              />
              {dateError && (
                <p
                  role="alert"
                  aria-live="assertive"
                  className="text-red-600 text-sm text-center mt-3"
                >
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
                <div
                  className="flex items-center gap-3"
                  role="group"
                  aria-label="Guest count"
                >
                  <button
                    type="button"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-11 h-11 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:border-burgundy transition-colors"
                    disabled={guests <= 1}
                    aria-label="Decrease guests"
                  >
                    &minus;
                  </button>
                  <span
                    className="text-lg font-semibold w-8 text-center"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {guests}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setGuests(Math.min(acc.maxGuests, guests + 1))
                    }
                    className="w-11 h-11 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:border-burgundy transition-colors"
                    disabled={guests >= acc.maxGuests}
                    aria-label="Increase guests"
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

              {acc.petFee && (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Pets
                  </label>
                  <div
                    className="flex items-center gap-3"
                    role="group"
                    aria-label="Pet count"
                  >
                    <button
                      type="button"
                      onClick={() => setPets(Math.max(0, pets - 1))}
                      className="w-11 h-11 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:border-burgundy transition-colors"
                      disabled={pets <= 0}
                      aria-label="Decrease pets"
                    >
                      &minus;
                    </button>
                    <span
                      className="text-lg font-semibold w-8 text-center"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {pets}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPets(Math.min(2, pets + 1))}
                      className="w-11 h-11 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:border-burgundy transition-colors"
                      disabled={pets >= 2}
                      aria-label="Increase pets"
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
              seasonalMultiplier={seasonalMultiplier}
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
          seasonalMultiplier={seasonalMultiplier}
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
            ? "bg-burgundy text-white"
            : "bg-gray-200 text-muted"
        }`}
      >
        {num}
      </div>
      <span
        className={`text-sm hidden sm:inline ${
          active ? "text-burgundy font-semibold" : "text-muted"
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
          ? "border-burgundy bg-burgundy/5 shadow-md"
          : "border-gray-200 bg-white hover:border-burgundy/50"
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
      <h4 className="font-display text-base text-burgundy">{accommodation.name}</h4>
      <p className="text-sm text-muted mt-0.5">{accommodation.description}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-burgundy font-semibold text-sm">
          ${accommodation.basePrice}/night
          <span className="block text-xs text-muted font-normal">Cleaning included</span>
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
