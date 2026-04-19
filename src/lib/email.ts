import nodemailer from "nodemailer";
import { logger } from "./logger";
import {
  type BookingEmailData as TemplateBookingData,
  formatAccommodationName,
  preArrivalHtml,
  duringStayHtml,
  checkoutThankYouHtml,
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

  const subjectLine = `Website Enquiry: ${subjectLabels[data.subject] || data.subject} from ${data.name}`;

  await transporter.sendMail({
    from: `"Lakeside Retreat" <${process.env.EMAIL_USER}>`,
    to: contactTo(),
    replyTo: data.email,
    subject: subjectLine,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2d5a5a;">New Contact Form Submission</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Name</td><td style="padding: 8px;">${data.name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Email</td><td style="padding: 8px;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Subject</td><td style="padding: 8px;">${subjectLabels[data.subject] || data.subject}</td></tr>
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #FAF4F5; border-radius: 8px;">
          <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
        </div>
        <p style="margin-top: 16px; color: #64748b; font-size: 12px;">
          Sent from the Lakeside Retreat website contact form.
        </p>
      </div>
    `,
  });
}

interface LegacyBookingEmailData {
  guestName: string;
  guestEmail: string;
  accommodation: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
}

export async function sendBookingConfirmation(
  data: LegacyBookingEmailData
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    logger.info("[email] Not configured — skipping booking confirmation", { data });
    return;
  }

  await transporter.sendMail({
    from: `"Lakeside Retreat" <${process.env.EMAIL_USER}>`,
    to: data.guestEmail,
    subject: `Booking Confirmation - Lakeside Retreat`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2d5a5a;">Booking Confirmed!</h2>
        <p>Hi ${data.guestName},</p>
        <p>Your booking at Lakeside Retreat has been confirmed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Accommodation</td><td style="padding: 8px;">${data.accommodation}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Check-in</td><td style="padding: 8px;">${data.checkIn} (3:00 PM)</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Check-out</td><td style="padding: 8px;">${data.checkOut} (10:00 AM)</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Guests</td><td style="padding: 8px;">${data.guests}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #753742;">Total</td><td style="padding: 8px;">$${data.totalAmount.toFixed(2)} NZD</td></tr>
        </table>
        <p>A $300 security bond has been pre-authorised on your card and will be released within 7 days of checkout.</p>
        <p>Self-check-in instructions will be sent closer to your arrival date.</p>
        <p style="margin-top: 24px; color: #64748b; font-size: 12px;">
          Lakeside Retreat &middot; 96 Smiths Way, Mount Pisa, Cromwell 9383, New Zealand
        </p>
      </div>
    `,
  });

  // Also notify the host
  await transporter.sendMail({
    from: `"Lakeside Retreat" <${process.env.EMAIL_USER}>`,
    to: contactTo(),
    subject: `New Booking: ${data.accommodation} - ${data.checkIn} to ${data.checkOut}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2d5a5a;">New Booking Received</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold;">Guest</td><td style="padding: 8px;">${data.guestName} (${data.guestEmail})</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Accommodation</td><td style="padding: 8px;">${data.accommodation}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Dates</td><td style="padding: 8px;">${data.checkIn} to ${data.checkOut}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Guests</td><td style="padding: 8px;">${data.guests}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Total</td><td style="padding: 8px;">$${data.totalAmount.toFixed(2)} NZD</td></tr>
        </table>
      </div>
    `,
  });
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
  await transporter.sendMail({
    from: fromAddress(),
    to: booking.guest_email,
    subject: `Your Arrival Instructions - Lakeside Retreat (${name})`,
    html: preArrivalHtml(booking),
  });
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

  await transporter.sendMail({
    from: fromAddress(),
    to: booking.guest_email,
    subject: "Welcome to Lakeside Retreat - We hope you're settling in!",
    html: duringStayHtml(booking),
  });
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

  await transporter.sendMail({
    from: fromAddress(),
    to: booking.guest_email,
    subject: "Thank you for staying at Lakeside Retreat!",
    html: checkoutThankYouHtml(booking),
  });
  logger.info(`Checkout thank-you email sent to ${booking.guest_email}`);
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
  await transporter.sendMail({
    from: fromAddress(),
    to: booking.guest_email,
    subject: `Payment Issue — Lakeside Retreat${idSlice ? ` Booking #${idSlice}` : ""}`,
    html: paymentFailureHtml(booking),
  });
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

  await transporter.sendMail({
    from: fromAddress(),
    to: booking.guest_email,
    subject: "Booking Cancelled — Lakeside Retreat",
    html: cancellationHtml(booking),
  });
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
  await transporter.sendMail({
    from: fromAddress(),
    to: contactTo(),
    subject: `Payment Received - ${booking.guest_name} (${name})`,
    html: paymentNotificationHtml(booking),
  });
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

  await transporter.sendMail({
    from: fromAddress(),
    to: contactTo(),
    subject: `Lakeside Retreat System Alert - ${alertType.toUpperCase()}`,
    html: systemAlertHtml({ alertType, message, details }),
  });
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
