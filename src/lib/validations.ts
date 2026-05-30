import { z } from "zod";
import { getValidIds } from "./accommodations";

/**
 * YYYY-MM-DD calendar date. Regex alone accepts impossible dates like
 * "9999-13-45"; the refine step parses and round-trips through Date so
 * month/day bounds (and leap years) are actually enforced.
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .refine((s) => {
    const d = new Date(s + "T00:00:00Z");
    return !isNaN(d.getTime()) && s === d.toISOString().slice(0, 10);
  }, "Invalid calendar date");

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  subject: z.enum(["booking", "availability", "special", "feedback", "other"], {
    message: "Please select a subject",
  }),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be under 1000 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export const availabilityCheckSchema = z.object({
  accommodation: z.string().refine((val) => getValidIds().includes(val), {
    message: "Invalid accommodation",
  }),
  checkIn: dateStringSchema,
  checkOut: dateStringSchema,
});

export const paymentSessionSchema = z.object({
  accommodation: z.string().refine((val) => getValidIds().includes(val), {
    message: "Invalid accommodation",
  }),
  checkIn: dateStringSchema,
  checkOut: dateStringSchema,
  guests: z.number().int().min(1).max(10),
  guestName: z.string().min(2).max(100),
  guestEmail: z.string().email(),
  // Phone is mandatory — we need a way to reach the guest about their stay.
  // Min 6 digits is a loose sanity floor that still allows international
  // formats, spaces, +, (), and hyphens.
  guestPhone: z
    .string()
    .trim()
    .min(6, "A contact phone number is required")
    .max(30)
    .regex(/[0-9]/, "Please enter a valid phone number"),
  specialRequests: z.string().max(500).optional(),
  pets: z.number().int().min(0).max(2).optional(),
  promoCode: z.string().max(50).optional(),
  adultsOnlyConfirmed: z.literal(true, {
    message: "You must confirm every guest is 18 years or older",
  }),
});

export type PaymentSessionData = z.infer<typeof paymentSessionSchema>;
