import { describe, it, expect } from "vitest";
import { paymentSessionSchema, availabilityCheckSchema, contactFormSchema } from "../validations";
import { bookingCreateSchema, bookingUpdateSchema, contentUpdateSchema, loginSchema } from "../admin-validations";

const validPayload = {
  accommodation: "dome-pinot",
  checkIn: "2026-08-01",
  checkOut: "2026-08-03",
  guests: 2,
  guestName: "Jane Smith",
  guestEmail: "jane@example.com",
  adultsOnlyConfirmed: true as const,
};

describe("paymentSessionSchema", () => {
  it("accepts a valid booking payload", () => {
    expect(paymentSessionSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects an invalid accommodation id", () => {
    const result = paymentSessionSchema.safeParse({ ...validPayload, accommodation: "hacked-property" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed dates", () => {
    const result = paymentSessionSchema.safeParse({ ...validPayload, checkIn: "01/08/2026" });
    expect(result.success).toBe(false);
  });

  it("rejects guest count of 0", () => {
    const result = paymentSessionSchema.safeParse({ ...validPayload, guests: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects oversized special requests", () => {
    const result = paymentSessionSchema.safeParse({
      ...validPayload,
      specialRequests: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional promoCode up to 50 chars", () => {
    expect(paymentSessionSchema.safeParse({ ...validPayload, promoCode: "SUMMER20" }).success).toBe(true);
  });

  it("rejects promoCode over 50 chars", () => {
    const result = paymentSessionSchema.safeParse({
      ...validPayload,
      promoCode: "X".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a payload without adultsOnlyConfirmed", () => {
    const { adultsOnlyConfirmed: _omit, ...withoutFlag } = validPayload;
    void _omit;
    expect(paymentSessionSchema.safeParse(withoutFlag).success).toBe(false);
  });

  it("rejects adultsOnlyConfirmed: false", () => {
    expect(
      paymentSessionSchema.safeParse({ ...validPayload, adultsOnlyConfirmed: false }).success
    ).toBe(false);
  });

  it("accepts all three valid accommodation ids", () => {
    for (const id of ["dome-pinot", "dome-rose", "lakeside-cottage"]) {
      expect(paymentSessionSchema.safeParse({ ...validPayload, accommodation: id }).success).toBe(true);
    }
  });
});

describe("availabilityCheckSchema", () => {
  it("accepts valid input", () => {
    expect(
      availabilityCheckSchema.safeParse({
        accommodation: "lakeside-cottage",
        checkIn: "2026-09-01",
        checkOut: "2026-09-05",
      }).success
    ).toBe(true);
  });

  it("rejects unknown accommodation", () => {
    const result = availabilityCheckSchema.safeParse({
      accommodation: "unknown",
      checkIn: "2026-09-01",
      checkOut: "2026-09-05",
    });
    expect(result.success).toBe(false);
  });
});

describe("contactFormSchema", () => {
  it("accepts a valid contact submission", () => {
    expect(
      contactFormSchema.safeParse({
        name: "Jo",
        email: "jo@example.com",
        subject: "booking",
        message: "Hello, I have a question about booking.",
      }).success
    ).toBe(true);
  });

  it("rejects invalid subject", () => {
    const result = contactFormSchema.safeParse({
      name: "Jo",
      email: "jo@example.com",
      subject: "spam",
      message: "Hello there!!!!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects message under 10 chars", () => {
    const result = contactFormSchema.safeParse({
      name: "Jo",
      email: "jo@example.com",
      subject: "other",
      message: "Hi",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse({ username: "admin", password: "secret" }).success).toBe(true);
  });

  it("rejects empty username", () => {
    expect(loginSchema.safeParse({ username: "", password: "secret" }).success).toBe(false);
  });
});

describe("bookingCreateSchema", () => {
  it("rejects invalid accommodation id", () => {
    const result = bookingCreateSchema.safeParse({
      guest_name: "Jane Smith",
      guest_email: "jane@example.com",
      accommodation: "fake-property",
      check_in: "2026-08-01",
      check_out: "2026-08-03",
      guests: 2,
    });
    expect(result.success).toBe(false);
  });
});

describe("bookingUpdateSchema", () => {
  it("rejects invalid status value", () => {
    const result = bookingUpdateSchema.safeParse({ status: "maybe" });
    expect(result.success).toBe(false);
  });

  it("accepts valid status values", () => {
    for (const status of ["pending", "confirmed", "cancelled", "completed"]) {
      expect(bookingUpdateSchema.safeParse({ status }).success).toBe(true);
    }
  });
});

describe("contentUpdateSchema", () => {
  it("accepts valid sections", () => {
    expect(
      contentUpdateSchema.safeParse({ sections: { hero_title: "Welcome" } }).success
    ).toBe(true);
  });

  it("rejects a value over 5000 chars", () => {
    const result = contentUpdateSchema.safeParse({
      sections: { key: "x".repeat(5001) },
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 50 keys", () => {
    const sections = Object.fromEntries(
      Array.from({ length: 51 }, (_, i) => [`key${i}`, "value"])
    );
    expect(contentUpdateSchema.safeParse({ sections }).success).toBe(false);
  });
});
