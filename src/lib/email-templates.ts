export interface BookingEmailData {
  guest_name: string;
  guest_email: string;
  accommodation: string;
  check_in: string;
  check_out: string;
  total_price?: number | string;
  booking_id?: string;
  num_guests?: number;
  special_requests?: string;
}

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

export function formatAccommodationName(slug: string): string {
  const names: Record<string, string> = {
    "dome-pinot": "Dome Pinot",
    "dome-rose": "Dome Ros\u00e9",
    "lakeside-cottage": "Lakeside Cottage",
  };
  return (
    names[slug] ??
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

function formatDateNZ(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NZ");
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ---------------------------------------------------------------------------
 * Shared layout wrapper
 * ------------------------------------------------------------------------- */

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#faf8f5;font-family:Georgia,serif;color:#302e41;line-height:1.6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf8f5;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background-color:#2d5a5a;padding:28px 32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="margin:0;font-size:24px;color:#ffffff;font-family:Georgia,serif;">${title}</h1>
  <p style="margin:6px 0 0;font-size:14px;color:#c8dede;font-family:Georgia,serif;">Lakeside Retreat</p>
</td></tr>

<!-- Body -->
<tr><td style="background-color:#ffffff;padding:32px;border-left:1px solid #e8e4df;border-right:1px solid #e8e4df;">
${body}
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f5f2ee;padding:20px 32px;text-align:center;font-size:12px;color:#8a8694;border-radius:0 0 8px 8px;border:1px solid #e8e4df;border-top:none;">
  <p style="margin:0;">Lakeside Retreat &middot; 96 Smiths Way, Mount Pisa, Cromwell</p>
  <p style="margin:4px 0 0;">Central Otago 9383, New Zealand &middot; <a href="tel:+6421368682" style="color:#2d5a5a;">+64 21 368 682</a></p>
  <p style="margin:8px 0 0;"><a href="https://lakesideretreat.co.nz" style="color:#2d5a5a;">lakesideretreat.co.nz</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

/* Reusable inline-style snippets */
const detailsBox = 'style="background-color:#f8f6f3;padding:16px 20px;border-radius:6px;margin:20px 0;"';
const alertBox = (borderColor: string) =>
  `style="padding:14px 18px;border-radius:6px;margin:20px 0;border-left:4px solid ${borderColor};background-color:#fffdf7;"`;
const ctaButton = (bg: string) =>
  `style="display:inline-block;background-color:${bg};color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:5px;font-family:Georgia,serif;font-size:15px;"`;
const signOff = `<p style="margin-top:28px;">Warm regards,<br/>Stephen &amp; Sandy<br/>Lakeside Retreat</p>`;

/* ---------------------------------------------------------------------------
 * Templates
 * ------------------------------------------------------------------------- */

export function bookingConfirmationHtml(data: BookingEmailData): string {
  const name = formatAccommodationName(data.accommodation);
  const domeNotice = `<div ${alertBox("#ffc107")}>
        <p style="margin:0;"><strong>Please note:</strong> ${name} is strictly 18+ adults only. Guests arriving with anyone under 18 will not be accommodated and no refund will be given.</p>
      </div>`;

  return layout("Booking Confirmed", `
    <p>Hi ${data.guest_name},</p>
    <p>Thank you for booking with us! Your reservation is confirmed.</p>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Booking Details</h3>
      <p style="margin:4px 0;"><strong>Accommodation:</strong> ${name}</p>
      <p style="margin:4px 0;"><strong>Check-in:</strong> ${formatDateNZ(data.check_in)} (3:00 PM)</p>
      <p style="margin:4px 0;"><strong>Check-out:</strong> ${formatDateNZ(data.check_out)} (10:00 AM)</p>
      ${data.num_guests ? `<p style="margin:4px 0;"><strong>Guests:</strong> ${data.num_guests}</p>` : ""}
      ${data.total_price ? `<p style="margin:4px 0;"><strong>Total:</strong> $${data.total_price} NZD</p>` : ""}
      ${data.booking_id ? `<p style="margin:4px 0;"><strong>Booking ID:</strong> ${data.booking_id}</p>` : ""}
    </div>

    <p>A <strong>$300 security bond</strong> has been pre-authorised on your card. This is not a charge &mdash; it is automatically released after your stay provided no damage has occurred.</p>

    ${domeNotice}

    <h3 style="font-size:16px;color:#2d5a5a;">What's Next?</h3>
    <ul style="padding-left:20px;">
      <li>We'll send detailed arrival instructions 24 hours before check-in.</li>
      <li>If you have questions, reply to this email or call <a href="tel:+6421368682" style="color:#2d5a5a;">+64 21 368 682</a>.</li>
      <li>Find local recommendations on our website.</li>
    </ul>

    <p>We're excited to host you at our solar-powered retreat!</p>
    ${signOff}
  `);
}

export function preArrivalHtml(data: BookingEmailData): string {
  const name = formatAccommodationName(data.accommodation);
  const isDome = data.accommodation === "dome-pinot" || data.accommodation === "dome-rose";
  const isCottage = data.accommodation === "lakeside-cottage";

  let propertyTips = "";
  if (isDome) {
    propertyTips = `<div ${alertBox("#ffc107")}>
      <h4 style="margin:0 0 6px;">Dome Reminder</h4>
      <p style="margin:0;">Our eco-domes are <strong>adults-only</strong> accommodations. Please ensure your party meets this requirement. Guests arriving with children will not be accommodated and no refund will be given.</p>
    </div>`;
  } else if (isCottage) {
    propertyTips = `<div ${alertBox("#2196F3")}>
      <h4 style="margin:0 0 6px;">Cottage Reminder</h4>
      <p style="margin:0 0 8px;">Lakeside Cottage is strictly <strong>18+ adults only</strong>. Guests arriving with anyone under 18 will not be accommodated and no refund will be given.</p>
      <p style="margin:0;">Well-behaved dogs are welcome ($50 flat fee per stay). Please keep them off the furniture and clean up after them on the property.</p>
    </div>`;
  }

  return layout("Your Stay Starts Tomorrow!", `
    <p>Hi ${data.guest_name},</p>
    <p>We're excited to welcome you tomorrow! Here's everything you need for a smooth arrival.</p>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Arrival Details</h3>
      <p style="margin:4px 0;"><strong>Address:</strong> 96 Smiths Way, Mount Pisa, Cromwell</p>
      <p style="margin:4px 0;"><strong>Check-in:</strong> ${formatDateLong(data.check_in)} from 3:00 PM</p>
      <p style="margin:4px 0;"><strong>Check-out:</strong> ${formatDateLong(data.check_out)} by 10:00 AM</p>
      <p style="margin:4px 0;"><strong>Accommodation:</strong> ${name}</p>
      ${data.num_guests ? `<p style="margin:4px 0;"><strong>Guests:</strong> ${data.num_guests}</p>` : ""}
    </div>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Property Essentials</h3>
      <p style="margin:4px 0;"><strong>WiFi:</strong> Connect to <code>Lakeside_Guest</code></p>
      <p style="margin:4px 0;"><strong>Parking:</strong> Free parking available on-site</p>
      <p style="margin:4px 0;"><strong>Emergency Contact:</strong> <a href="tel:+6421368682" style="color:#2d5a5a;">+64 21 368 682</a></p>
    </div>

    <div ${alertBox("#17a2b8")}>
      <h4 style="margin:0 0 6px;">Security Bond</h4>
      <p style="margin:0;">A <strong>$300 authorisation hold</strong> will be placed on your card as a security bond. This is <em>not</em> a charge &mdash; it is automatically released after your stay, provided no damage has occurred.</p>
    </div>

    ${propertyTips}

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Explore the Area</h3>
      <p style="margin:4px 0;">Central Otago has incredible dining, wineries, and scenery. Ask us for our favourites when you arrive &mdash; we love sharing our local picks.</p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <p style="margin:0 0 10px;"><strong>Have questions before you arrive?</strong></p>
      <a href="https://wa.me/6421368682" ${ctaButton("#25D366")}>Message Us on WhatsApp</a>
    </div>

    <p>We can't wait to host you!</p>
    ${signOff}
  `);
}

export function duringStayHtml(data: BookingEmailData): string {
  const name = formatAccommodationName(data.accommodation);

  return layout("Welcome to Lakeside Retreat!", `
    <p>Hi ${data.guest_name},</p>
    <p>We hope you've settled in and are enjoying your stay at ${name}! We just wanted to check in and make sure everything is perfect.</p>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">A Few Reminders</h3>
      <p style="margin:4px 0;"><strong>Your Spa or Hot Tub:</strong> Make the most of it &mdash; the saltwater spa (domes) or wood-fired cedar tub (cottage) is a wonderful way to unwind after a day exploring Central Otago.</p>
      <p style="margin:4px 0;"><strong>WiFi:</strong> Connect to <code>Lakeside_Guest</code> &mdash; the password is in your welcome guide.</p>
      <p style="margin:4px 0;"><strong>Emergency Contact:</strong> <a href="tel:+6421368682" style="color:#2d5a5a;">+64 21 368 682</a></p>
    </div>

    <p>If anything isn't quite right or you need anything at all, please don't hesitate to reach out. We're just a message away!</p>

    <div style="text-align:center;margin:28px 0;">
      <a href="https://wa.me/6421368682" ${ctaButton("#25D366")}>Message Us on WhatsApp</a>
    </div>

    <p>Enjoy your evening!</p>
    ${signOff}
  `);
}

export function checkoutThankYouHtml(data: BookingEmailData): string {
  const name = formatAccommodationName(data.accommodation);
  const googleReviewUrl = "https://g.page/r/lakeside-retreat-cromwell/review";
  const airbnbUrl = "https://www.airbnb.co.nz/users/show/lakesideretreat";

  return layout("Thank You for Your Stay!", `
    <p>Hi ${data.guest_name},</p>
    <p>Thank you so much for staying with us at ${name}! We truly hope you had a wonderful time and that Lakeside Retreat felt like a home away from home.</p>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Security Bond</h3>
      <p style="margin:0;">Your security bond authorisation hold will be automatically released within <strong>7 days</strong>. You don't need to do anything &mdash; it will drop off your statement on its own.</p>
    </div>

    <p>If you enjoyed your stay, we'd love to hear about it! A quick review helps other travellers discover us and means the world to our small owner-run retreat.</p>

    <div style="text-align:center;margin:24px 0;">
      <a href="${googleReviewUrl}" ${ctaButton("#4285f4")} style="display:inline-block;background-color:#4285f4;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:5px;font-family:Georgia,serif;font-size:15px;margin:4px;">Review on Google</a>
      <a href="${airbnbUrl}" ${ctaButton("#ff5a5f")} style="display:inline-block;background-color:#ff5a5f;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:5px;font-family:Georgia,serif;font-size:15px;margin:4px;">Review on Airbnb</a>
    </div>

    <div ${alertBox("#2d5a5a")}>
      <p style="margin:0;"><strong>Book direct next time and save 18%!</strong> When you book through our website at <a href="https://lakesideretreat.co.nz" style="color:#2d5a5a;">lakesideretreat.co.nz</a>, you skip the platform fees and get the best possible rate. We'd love to welcome you back!</p>
    </div>

    <p>Thank you again for choosing Lakeside Retreat. We hope to see you again soon!</p>
    ${signOff}
  `);
}

export function abandonedCheckoutHtml(
  data: BookingEmailData & { reminderNumber?: number }
): string {
  const name = formatAccommodationName(data.accommodation);
  const reminderNumber = data.reminderNumber ?? 1;

  const headline =
    reminderNumber === 1
      ? "Still thinking it over?"
      : reminderNumber === 2
        ? "Your dates are still available"
        : "One last chance before your dates open up";

  const opener =
    reminderNumber === 1
      ? `You started booking ${name} with us and we saved your dates. Life gets busy &mdash; we wanted to let you know your spot is still here when you're ready.`
      : reminderNumber === 2
        ? `Just a gentle note that ${name} is still available for ${formatDateLong(data.check_in)}. Central Otago fills up fast this time of year, so we wanted to make sure you didn't miss out.`
        : `This is the last reminder we'll send. ${name} is still held for ${formatDateLong(data.check_in)} &mdash; after today we'll release your dates so other guests can book them.`;

  return layout("Your Lakeside Retreat Stay", `
    <p>Hi ${data.guest_name},</p>
    <p style="font-size:17px;color:#2d5a5a;margin:16px 0 8px;"><strong>${headline}</strong></p>
    <p>${opener}</p>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Your Stay</h3>
      <p style="margin:4px 0;"><strong>Accommodation:</strong> ${name}</p>
      <p style="margin:4px 0;"><strong>Check-in:</strong> ${formatDateLong(data.check_in)}</p>
      <p style="margin:4px 0;"><strong>Check-out:</strong> ${formatDateLong(data.check_out)}</p>
      ${data.num_guests ? `<p style="margin:4px 0;"><strong>Guests:</strong> ${data.num_guests}</p>` : ""}
      ${data.total_price ? `<p style="margin:4px 0;"><strong>Total:</strong> $${data.total_price} NZD</p>` : ""}
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="https://lakesideretreat.co.nz/stay" ${ctaButton("#2d5a5a")}>Finish Your Booking</a>
    </div>

    <div ${alertBox("#2d5a5a")}>
      <p style="margin:0;">Booking direct saves you 18% versus Airbnb or Booking.com &mdash; and you deal with us personally, not a platform.</p>
    </div>

    <p>If something held you up or you have a question before booking, just reply to this email. We're a small owner-run retreat and we'd love to help.</p>
    ${signOff}
  `);
}

export function paymentFailureHtml(data: BookingEmailData): string {
  const name = formatAccommodationName(data.accommodation);
  const idSlice = data.booking_id ? data.booking_id.slice(0, 8) : "";

  return layout("Payment Issue", `
    <p>Hi ${data.guest_name},</p>
    <p>We noticed that the payment for your booking didn't go through. Don't worry &mdash; these things happen, and your booking details are still saved.</p>

    <div ${alertBox("#ffc107")}>
      <h4 style="margin:0 0 6px;">What happened?</h4>
      <p style="margin:0;">Your payment could not be processed. This can happen for a number of reasons, such as insufficient funds, an expired card, or a temporary issue with your bank.</p>
    </div>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Your Booking</h3>
      <p style="margin:4px 0;"><strong>Accommodation:</strong> ${name}</p>
      <p style="margin:4px 0;"><strong>Check-in:</strong> ${formatDateNZ(data.check_in)}</p>
      <p style="margin:4px 0;"><strong>Check-out:</strong> ${formatDateNZ(data.check_out)}</p>
      ${data.num_guests ? `<p style="margin:4px 0;"><strong>Guests:</strong> ${data.num_guests}</p>` : ""}
      ${data.total_price ? `<p style="margin:4px 0;"><strong>Total:</strong> $${data.total_price} NZD</p>` : ""}
      ${idSlice ? `<p style="margin:4px 0;"><strong>Booking ID:</strong> ${idSlice}</p>` : ""}
    </div>

    <p>To complete your reservation, please try your payment again:</p>

    <div style="text-align:center;margin:28px 0;">
      <a href="https://lakesideretreat.co.nz/stay" ${ctaButton("#2d5a5a")}>Try Payment Again</a>
    </div>

    <p>If you continue to experience issues, please don't hesitate to reach out. We're happy to help you complete your booking.</p>
    ${signOff}
  `);
}

export function cancellationHtml(
  data: BookingEmailData & { refundEligible: boolean }
): string {
  const name = formatAccommodationName(data.accommodation);

  const refundBlock = data.refundEligible
    ? `<div style="padding:14px 18px;border-radius:6px;margin:20px 0;border-left:4px solid #28a745;background-color:#f0fff0;">
        <h4 style="margin:0 0 6px;">Refund Information</h4>
        <p style="margin:0;">Since you cancelled more than 14 days before your arrival date, you are eligible for a <strong>full refund</strong>. Your refund is being processed and should appear on your statement within 5&ndash;10 business days.</p>
      </div>`
    : `<div style="padding:14px 18px;border-radius:6px;margin:20px 0;border-left:4px solid #dc3545;background-color:#fff5f5;">
        <h4 style="margin:0 0 6px;">Refund Information</h4>
        <p style="margin:0;">As this cancellation was made within 14 days of your arrival date, it is unfortunately non-refundable per our cancellation policy.</p>
      </div>`;

  return layout("Booking Cancelled", `
    <p>Hi ${data.guest_name},</p>
    <p>This email confirms that your booking has been cancelled. We're sorry to see you go!</p>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Cancelled Booking Details</h3>
      <p style="margin:4px 0;"><strong>Accommodation:</strong> ${name}</p>
      <p style="margin:4px 0;"><strong>Check-in:</strong> ${formatDateNZ(data.check_in)}</p>
      <p style="margin:4px 0;"><strong>Check-out:</strong> ${formatDateNZ(data.check_out)}</p>
      ${data.num_guests ? `<p style="margin:4px 0;"><strong>Guests:</strong> ${data.num_guests}</p>` : ""}
      ${data.total_price ? `<p style="margin:4px 0;"><strong>Total:</strong> $${data.total_price} NZD</p>` : ""}
      ${data.booking_id ? `<p style="margin:4px 0;"><strong>Booking ID:</strong> ${data.booking_id}</p>` : ""}
    </div>

    <div ${alertBox("#17a2b8")}>
      <h4 style="margin:0 0 6px;">Cancellation Policy</h4>
      <p style="margin:0;">Cancellations 14+ days before arrival receive a full refund. Cancellations within 14 days are non-refundable.</p>
    </div>

    ${refundBlock}

    <p>We'd love to welcome you another time. If your plans change, you're always welcome to rebook:</p>

    <div style="text-align:center;margin:28px 0;">
      <a href="https://lakesideretreat.co.nz/stay" ${ctaButton("#2d5a5a")}>Book Again</a>
    </div>

    <p>If you have any questions about your cancellation or refund, please don't hesitate to get in touch.</p>
    ${signOff}
  `);
}

export function paymentNotificationHtml(
  data: BookingEmailData & { paymentAmount: string; paymentMethod: string }
): string {
  const name = formatAccommodationName(data.accommodation);

  return layout("Payment Confirmed", `
    <div style="background-color:#f0fff0;padding:16px 20px;border-radius:6px;margin:0 0 20px;">
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Payment Details</h3>
      <p style="margin:4px 0;"><strong>Amount:</strong> $${data.paymentAmount} NZD</p>
      <p style="margin:4px 0;"><strong>Payment Method:</strong> ${data.paymentMethod}</p>
      <p style="margin:4px 0;"><strong>Status:</strong> Completed</p>
    </div>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Booking Details</h3>
      <p style="margin:4px 0;"><strong>Guest:</strong> ${data.guest_name} (${data.guest_email})</p>
      <p style="margin:4px 0;"><strong>Accommodation:</strong> ${name}</p>
      <p style="margin:4px 0;"><strong>Dates:</strong> ${formatDateNZ(data.check_in)} to ${formatDateNZ(data.check_out)}</p>
      ${data.booking_id ? `<p style="margin:4px 0;"><strong>Booking ID:</strong> ${data.booking_id}</p>` : ""}
    </div>

    <p>Booking is now fully confirmed and paid.</p>
  `);
}

export function systemAlertHtml(data: {
  alertType: string;
  message: string;
  details?: string;
}): string {
  const colorMap: Record<string, string> = {
    error: "#dc3545",
    warning: "#ffc107",
    info: "#17a2b8",
    success: "#28a745",
  };
  const bgMap: Record<string, string> = {
    error: "#fff5f5",
    warning: "#fffdf7",
    info: "#f0f8ff",
    success: "#f0fff0",
  };

  const borderColor = colorMap[data.alertType] ?? "#6c757d";
  const bgColor = bgMap[data.alertType] ?? "#f8f6f3";

  return layout(`System Alert - ${data.alertType.toUpperCase()}`, `
    <div style="padding:16px 20px;border-radius:6px;margin:0 0 20px;border-left:4px solid ${borderColor};background-color:${bgColor};">
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Alert Details</h3>
      <p style="margin:4px 0;"><strong>Type:</strong> ${data.alertType.toUpperCase()}</p>
      <p style="margin:4px 0;"><strong>Time:</strong> ${new Date().toLocaleString("en-NZ")}</p>
      <p style="margin:4px 0;"><strong>Message:</strong> ${data.message}</p>
    </div>

    ${data.details ? `<div ${detailsBox}><h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Additional Details</h3><p style="margin:4px 0;">${data.details}</p></div>` : ""}

    <p style="color:#8a8694;font-size:13px;">This is an automated alert from the Lakeside Retreat monitoring system.</p>
  `);
}

export function contactConfirmationHtml(data: {
  name: string;
  email: string;
  message: string;
}): string {
  return layout("We've Received Your Message", `
    <p>Hi ${data.name},</p>
    <p>Thank you for getting in touch! We've received your message and will get back to you as soon as possible &mdash; usually within 24 hours.</p>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Your Message</h3>
      <p style="margin:4px 0;white-space:pre-wrap;">${data.message}</p>
    </div>

    <p>If you need an urgent response, you can reach us directly:</p>
    <ul style="padding-left:20px;">
      <li>Phone: <a href="tel:+6421368682" style="color:#2d5a5a;">+64 21 368 682</a></li>
      <li>WhatsApp: <a href="https://wa.me/6421368682" style="color:#2d5a5a;">Message us</a></li>
    </ul>

    ${signOff}
  `);
}
