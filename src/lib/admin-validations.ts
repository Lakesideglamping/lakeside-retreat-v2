import { z } from "zod";
import { getValidIds } from "./accommodations";

const accommodationField = () =>
  z.string().refine((val) => getValidIds().includes(val), {
    message: "Invalid accommodation",
  });

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  totpCode: z.string().length(6).regex(/^\d{6}$/).optional(),
  recoveryCode: z.string().regex(/^[A-Z0-9]{5}-[A-Z0-9]{5}$/).optional(),
});

export const bookingCreateSchema = z
  .object({
    guest_name: z.string().min(2).max(100),
    guest_email: z.string().email(),
    guest_phone: z.string().optional(),
    accommodation: accommodationField(),
    check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guests: z.number().int().min(1).max(10),
    total_price: z.number().min(0).optional(),
    status: z.string().optional(),
    notes: z.string().max(1000).optional(),
    booking_source: z.string().optional(),
  })
  .refine((d) => new Date(d.check_out) > new Date(d.check_in), {
    message: "Check-out must be after check-in",
    path: ["check_out"],
  });

export const bookingUpdateSchema = z
  .object({
    guest_name: z.string().min(2).max(100).optional(),
    guest_email: z.string().email().optional(),
    guest_phone: z.string().optional(),
    accommodation: accommodationField().optional(),
    check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    guests: z.number().int().min(1).max(10).optional(),
    total_price: z.number().min(0).optional(),
    status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
    payment_status: z.enum(["pending", "paid", "refunded", "failed", "paid_external"]).optional(),
    notes: z.string().max(1000).optional(),
    booking_source: z.string().max(50).optional(),
  })
  .refine(
    (d) =>
      !d.check_in || !d.check_out || new Date(d.check_out) > new Date(d.check_in),
    { message: "Check-out must be after check-in", path: ["check_out"] }
  );

export const statusUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
});

export const seasonalRateSchema = z.object({
  name: z.string().min(1).max(100),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  multiplier: z.number().min(0.01).max(9.99),
  is_active: z.boolean().optional(),
});

export const reviewSchema = z.object({
  guest_name: z.string().min(2).max(100),
  platform: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().max(2000).optional(),
  stay_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  property: z.string().optional(),
  status: z.string().optional(),
  is_featured: z.boolean().optional(),
  admin_notes: z.string().max(500).optional(),
});

export const reviewUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "deleted"]).optional(),
  is_featured: z.boolean().optional(),
  admin_notes: z.string().max(500).optional(),
});

export const promoCodeSchema = z
  .object({
    name: z.string().min(1).max(100),
    code: z.string().min(3).max(50),
    type: z.enum(["seasonal", "partner", "general"]).optional(),
    description: z.string().max(500).optional(),
    discount_type: z.enum(["percentage", "fixed"]),
    discount_value: z.number().min(0),
    valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    min_stay: z.number().int().min(1).optional(),
    usage_limit: z.number().int().min(1).optional(),
    status: z.enum(["active", "paused", "expired"]).optional(),
    partner_info: z.string().max(500).optional(),
  })
  .refine(
    (d) =>
      !d.valid_from ||
      !d.valid_until ||
      new Date(d.valid_until) >= new Date(d.valid_from),
    { message: "Valid-until must be on or after valid-from", path: ["valid_until"] }
  )
  .refine(
    (d) => d.discount_type !== "percentage" || d.discount_value <= 100,
    { message: "Percentage discount cannot exceed 100", path: ["discount_value"] }
  )
  .refine(
    (d) => d.discount_type !== "fixed" || d.discount_value <= 100000,
    { message: "Fixed discount cannot exceed $100,000", path: ["discount_value"] }
  );

export const blockedDateSchema = z.object({
  property: accommodationField(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.enum(["maintenance", "personal", "cleaning", "other"]).optional(),
  notes: z.string().max(500).optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a digit"),
});

export const contentUpdateSchema = z.object({
  sections: z
    .record(z.string(), z.string().max(5000))
    .refine((val) => Object.keys(val).length <= 50, {
      message: "Too many content sections (max 50)",
    }),
});

export const pricingConfigSchema = z.object({
  accommodation: z.string().min(1),
  base: z.number().min(0),
  weekend: z.number().min(0).optional(),
  peak: z.number().min(0).optional(),
  cleaning: z.number().min(0),
  minNights: z.number().int().min(1).optional(),
});
