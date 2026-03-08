import nodemailer from "nodemailer";

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
    console.log("[email] Not configured — skipping send. Data:", data);
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

interface BookingEmailData {
  guestName: string;
  guestEmail: string;
  accommodation: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
}

export async function sendBookingConfirmation(
  data: BookingEmailData
): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    console.log("[email] Not configured — skipping booking confirmation.", data);
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
