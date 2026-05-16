import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";
import { prisma } from "./db";
import {
  type BookingEmailData as TemplateBookingData,
  escapeHtml,
  formatAccommodationName,
  preArrivalHtml,
  duringStayHtml,
  checkoutThankYouHtml,
  checkoutReviewReminderHtml,
  abandonedCheckoutHtml,
  paymentFailureHtml,
  cancellationHtml,
  paymentNotificationHtml,
  systemAlertHtml,
} from "./email-templates";

export type { BookingEmailData } from "./email-templates";
export { formatAccommodationName } from "./email-templates";

const isConfigured =
  !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS;

function createTransporter() {
  if (!isConfigured) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.titan.email",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
  });
}

const contactTo = () =>
  process.env.CONTACT_EMAIL || process.env.EMAIL_USER || "";

// Wraps transporter.sendMail so every attempt — successful or not — lands in
// email_sends. Admin UI reads that table to show per-booking communications.
// A DB insert failure must never break the send path, so the logging write
// is best-effort.
async function sendAndLog(
  transporter: Transporter,
  mail: nodemailer.SendMailOptions,
  meta: { template: string; bookingId?: string | null }
): Promise<void> {
  const recipient = Array.isArray(mail.to)
    ? mail.to.map(String).join(", ")
    : String(mail.to ?? "");
  const subject = typeof mail.subject === "string" ? mail.subject : String(mail.subject ?? "");

  try {
    await transporter.sendMail(mail);
    await prisma.email_sends
      .create({
        data: {
          booking_id: meta.bookingId ?? null,
          template: meta.template,
          recipient,
          subject,
          status: "sent",
        },
      })
      .catch((logErr) =>
        logger.warn("[email] failed to persist send log", {
          template: meta.template,
          error: String(logErr),
        })
      );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.email_sends
      .create({
        data: {
          booking_id: meta.bookingId ?? null,
          template: meta.template,
          recipient,
          subject,
          status: "failed",
          error: message,
        },
      })
      .catch(() => {});
    throw err;
  }
}

interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const subjectLabels: Record<string, string> = {
  booking: "Booking Enquiry",
  availability: "Availability Check",
  special: "Special Request",
  feedback: "Feedback",
  other: "General Enquiry",
};

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.info("[email] Not configured — skipping send", { data });
    return;
  }

  const subjectLabel = subjectLabels[data.subject] || data.subject;
  const subjectLine = `Website Enquiry: ${subjectLabel} from ${data.name}`;

  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safeSubjectLabel = escapeHtml(subjectLabel);
  const safeMessage = escapeHtml(data.message);

  await sendAndLog(transporter, {
    from: `"Lakeside Retreat" <${process.env.EMAIL_USER}>`,
    to: contactTo(),
    replyTo: data.email,
    subject: subjectLine,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2d5a5a;">New Contact Form Submission</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Name</td><td style="padding: 8px;">${safeName}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Email</td><td style="padding: 8px;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Subject</td><td style="padding: 8px;">${safeSubjectLabel}</td></tr>
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #FAF4F5; border-radius: 8px;">
          <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
        </div>
        <p style="margin-top: 16px; color: #64748b; font-size: 12px;">
          Sent from the Lakeside Retreat website contact form.
        </p>
      </div>
    `,
  }, { template: "contact_enquiry" });
}

interface LegacyBookingEmailData {
  guestName: string;
  guestEmail: string;
  accommodation: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  bookingId?: string;
  depositStatus?: "held" | "failed_to_hold" | "pending";
}

export async function sendBookingConfirmation(
  data: LegacyBookingEmailData
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.info("[email] Not configured — skipping booking confirmation", { data });
    return;
  }

  const safeGuestName = escapeHtml(data.guestName);
  const safeGuestEmail = escapeHtml(data.guestEmail);
  const safeAccommodation = escapeHtml(data.accommodation);
  const safeCheckIn = escapeHtml(data.checkIn);
  const safeCheckOut = escapeHtml(data.checkOut);
  const safeGuests = escapeHtml(data.guests);
  const safeTotal = escapeHtml(data.totalAmount.toFixed(2));

  await sendAndLog(transporter, {
    from: `"Lakeside Retreat" <${process.env.EMAIL_USER}>`,
    to: data.guestEmail,
    subject: `Booking Confirmation - Lakeside Retreat`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2d5a5a;">Booking Confirmed!</h2>
        <p>Hi ${safeGuestName},</p>
        <p>Your booking at Lakeside Retreat has been confirmed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Accommodation</td><td style="padding: 8px;">${safeAccommodation}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Check-in</td><td style="padding: 8px;">${safeCheckIn} (3:00 PM)</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Check-out</td><td style="padding: 8px;">${safeCheckOut} (10:00 AM)</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Guests</td><td style="padding: 8px;">${safeGuests}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Total</td><td style="padding: 8px;">$${safeTotal} NZD</td></tr>
        </table>
        ${data.depositStatus === "failed_to_hold"
          ? `<p style="color:#b91c1c;background:#fef2f2;padding:12px;border-radius:6px;border:1px solid #fca5a5;">
               <strong>Important:</strong> We were unable to pre-authorise the $300 security bond on your card.
               Our team will be in touch shortly to arrange this before your arrival.
               Your accommodation booking is confirmed.
             </p>`
          : `<p>A $300 security bond has been pre-authorised on your card and will be released within 7 days of checkout.</p>`
        }
        <p>Self-check-in instructions will be sent closer to your arrival date.</p>
        <p style="margin-top: 24px; color: #64748b; font-size: 12px;">
          Lakeside Retreat &middot; 96 Smiths Way, Mount Pisa, Cromwell 9383, New Zealand
        </p>
      </div>
    `,
  }, { template: "booking_confirmation_guest", bookingId: data.bookingId });

  // Also notify the host
  await sendAndLog(transporter, {
    from: `"Lakeside Retreat" <${process.env.EMAIL_USER}>`,
    to: contactTo(),
    subject: `New Booking: ${data.accommodation} - ${data.checkIn} to ${data.checkOut}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2d5a5a;">New Booking Received</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold;">Guest</td><td style="padding: 8px;">${safeGuestName} (${safeGuestEmail})</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Accommodation</td><td style="padding: 8px;">${safeAccommodation}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Dates</td><td style="padding: 8px;">${safeCheckIn} to ${safeCheckOut}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Guests</td><td style="padding: 8px;">${safeGuests}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Total</td><td style="padding: 8px;">$${safeTotal} NZD</td></tr>
        </table>
      </div>
    `,
  }, { template: "booking_confirmation_host", bookingId: data.bookingId });
}

/* ---------------------------------------------------------------------------
 * Template-based email senders
 * ------------------------------------------------------------------------- */

const fromAddress = () => `"Lakeside Retreat" <${process.env.EMAIL_USER}>`;

export async function sendPreArrivalInstructions(
  booking: TemplateBookingData
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("Email not configured - pre-arrival instructions skipped");
    return;
  }

  const name = formatAccommodationName(booking.accommodation);
  await sendAndLog(transporter, {
    from: fromAddress(),
    to: booking.guest_email,
    subject: `Your Arrival Instructions - Lakeside Retreat (${name})`,
    html: preArrivalHtml(booking),
  }, { template: "pre_arrival", bookingId: booking.booking_id });
  logger.info(`Pre-arrival instructions sent to ${booking.guest_email}`);
}

export async function sendDuringStayCheckin(
  booking: TemplateBookingData
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("Email not configured - during-stay check-in skipped");
    return;
  }

  await sendAndLog(transporter, {
    from: fromAddress(),
    to: booking.guest_email,
    subject: "Welcome to Lakeside Retreat - We hope you're settling in!",
    html: duringStayHtml(booking),
  }, { template: "during_stay", bookingId: booking.booking_id });
  logger.info(`During-stay check-in email sent to ${booking.guest_email}`);
}

export async function sendCheckoutThankYou(
  booking: TemplateBookingData
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("Email not configured - checkout thank-you skipped");
    return;
  }

  await sendAndLog(transporter, {
    from: fromAddress(),
    to: booking.guest_email,
    subject: "Thank you for staying at Lakeside Retreat!",
    html: checkoutThankYouHtml(booking),
  }, { template: "checkout_thank_you", bookingId: booking.booking_id });
  logger.info(`Checkout thank-you email sent to ${booking.guest_email}`);
}

/**
 * Second-attempt review nudge sent ~7 days after the initial thank-you.
 * Lifts review response rate from ~10% (single email) to ~17% (two-step
 * sequence) — extra Google reviews directly improve local search rank.
 */
export async function sendCheckoutReviewReminder(
  booking: TemplateBookingData
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("Email not configured - review reminder skipped");
    return;
  }

  await sendAndLog(transporter, {
    from: fromAddress(),
    to: booking.guest_email,
    subject: `${booking.guest_name.split(" ")[0]}, how was your stay at Lakeside Retreat?`,
    html: checkoutReviewReminderHtml(booking),
  }, { template: "checkout_review_reminder", bookingId: booking.booking_id });
  logger.info(`Review reminder email sent to ${booking.guest_email}`);
}

export async function sendAbandonedCheckoutReminder(
  booking: TemplateBookingData & { reminderNumber?: number }
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("Email not configured - abandoned checkout reminder skipped");
    return;
  }

  const name = formatAccommodationName(booking.accommodation);
  const subject =
    booking.reminderNumber && booking.reminderNumber > 1
      ? `Your ${name} stay is still available`
      : `Your ${name} booking is waiting`;

  await sendAndLog(transporter, {
    from: fromAddress(),
    to: booking.guest_email,
    subject,
    html: abandonedCheckoutHtml(booking),
  }, { template: "abandoned_checkout", bookingId: booking.booking_id });
  logger.info(`Abandoned checkout reminder sent to ${booking.guest_email}`);
}

export async function sendPaymentFailureNotification(
  booking: TemplateBookingData
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("Email not configured - payment failure notification skipped");
    return;
  }

  const idSlice = booking.booking_id ? booking.booking_id.slice(0, 8) : "";
  await sendAndLog(transporter, {
    from: fromAddress(),
    to: booking.guest_email,
    subject: `Payment Issue — Lakeside Retreat${idSlice ? ` Booking #${idSlice}` : ""}`,
    html: paymentFailureHtml(booking),
  }, { template: "payment_failure", bookingId: booking.booking_id });
  logger.info(`Payment failure notification sent to ${booking.guest_email}`);
}

export async function sendCancellationConfirmation(
  booking: TemplateBookingData & { refundEligible: boolean }
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("Email not configured - cancellation confirmation skipped");
    return;
  }

  await sendAndLog(transporter, {
    from: fromAddress(),
    to: booking.guest_email,
    subject: "Booking Cancelled — Lakeside Retreat",
    html: cancellationHtml(booking),
  }, { template: "cancellation", bookingId: booking.booking_id });
  logger.info(`Cancellation confirmation sent to ${booking.guest_email}`);
}

export async function sendPaymentNotification(
  booking: TemplateBookingData & { paymentAmount: string; paymentMethod: string }
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("Email not configured - payment notification skipped");
    return;
  }

  const name = formatAccommodationName(booking.accommodation);
  await sendAndLog(transporter, {
    from: fromAddress(),
    to: contactTo(),
    subject: `Payment Received - ${booking.guest_name} (${name})`,
    html: paymentNotificationHtml(booking),
  }, { template: "payment_notification", bookingId: booking.booking_id });
  logger.info("Payment notification sent to admin");
}

export async function sendSystemAlert(
  alertType: string,
  message: string,
  details?: string
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("Email not configured - system alert skipped");
    return;
  }

  await sendAndLog(transporter, {
    from: fromAddress(),
    to: contactTo(),
    subject: `Lakeside Retreat System Alert - ${alertType.toUpperCase()}`,
    html: systemAlertHtml({ alertType, message, details }),
  }, { template: "system_alert", bookingId: null });
  logger.info(`System alert sent: ${alertType}`);
}

export async function testEmailConfiguration(): Promise<{
  success: boolean;
  message: string;
}> {
  const transporter = createTransporter();
  if (!transporter) {
    return { success: false, message: "Email not configured (missing EMAIL_USER or EMAIL_PASS)" };
  }

  try {
    await transporter.verify();
    logger.info("SMTP connection verified successfully");
    return { success: true, message: "SMTP connection verified successfully" };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error("SMTP connection verification failed", { error: errMsg });
    return { success: false, message: `SMTP verification failed: ${errMsg}` };
  }
}
