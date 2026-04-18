import { z } from "zod";
import { getValidIds } from "./accommodations";

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
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export const paymentSessionSchema = z.object({
  accommodation: z.string().refine((val) => getValidIds().includes(val), {
    message: "Invalid accommodation",
  }),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(10),
  guestName: z.string().min(2).max(100),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  specialRequests: z.string().max(500).optional(),
  pets: z.number().int().min(0).max(2).optional(),
  promoCode: z.string().max(50).optional(),
});

export type PaymentSessionData = z.infer<typeof paymentSessionSchema>;
