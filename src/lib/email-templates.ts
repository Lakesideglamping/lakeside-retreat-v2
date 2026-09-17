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

// Every outbound template interpolates guest-controlled strings. Without
// escaping, a name like `"><a href="phishing"> breaks out of surrounding
// markup — not classic XSS (mail clients strip <script>) but trivially
// exploitable for phishing-inside-your-brand and admin-inbox tampering.
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

/**
 * Money, always to the cent.
 *
 * Callers disagree on shape: the crons pass a JS number (650), the refund
 * webhook stringifies a Prisma Decimal, and the booking confirmation passes
 * an already-formatted string. Formatting here rather than at each call site
 * means no future caller can put "$650" in front of a guest instead of
 * "$650.00" — a price missing its cents reads like a typo on a receipt.
 *
 * Anything non-numeric is passed through untouched rather than rendered as
 * NaN, so a malformed value degrades to the raw text instead of nonsense.
 */
function formatPrice(value: number | string | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n.toFixed(2) : String(value);
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
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#faf8f5;font-family:Georgia,serif;color:#302e41;line-height:1.6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf8f5;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background-color:#2d5a5a;padding:28px 32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="margin:0;font-size:24px;color:#ffffff;font-family:Georgia,serif;">${safeTitle}</h1>
</td></tr>

<!-- Logo. On its own light band rather than inside the teal header: the mark
     is dark burgundy on transparency, so on #2d5a5a it is all but invisible.
     Absolute src because a mail client has no site to resolve a relative path
     against, width/height as attributes because Outlook ignores CSS sizing,
     and alt text carrying the brand name for the many clients that block
     images by default — where the alt is all the recipient sees. -->
<tr><td style="background-color:#ffffff;padding:22px 32px 6px;text-align:center;border-left:1px solid #e8e4df;border-right:1px solid #e8e4df;">
  <img src="https://lakesideretreat.co.nz/images/logormbg.png" alt="Lakeside Retreat" width="200" height="81" style="display:block;margin:0 auto;border:0;max-width:200px;height:auto;" />
</td></tr>

<!-- Body. Reduced top padding because the logo band above already supplies
     the gap; a full 32px on top of it leaves the greeting stranded. -->
<tr><td style="background-color:#ffffff;padding:14px 32px 32px;border-left:1px solid #e8e4df;border-right:1px solid #e8e4df;">
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
// Shared by every outbound template, so this is the one place the hosts are
// named at sign-off. "Steve and Sandy" matches the body text ("contact Steve
// or Sandy") and the public site, which was brought into line separately.
// Guest review text is the exception and says whatever the guest wrote.
const signOff = `<p style="margin-top:28px;"><br>Warm regards,<br><br><br/>Steve and Sandy<br/>Lakeside Retreat</p>`;

/* ---------------------------------------------------------------------------
 * BookingTemplates-Domes
 * ------------------------------------------------------------------------- */

export function bookingConfirmationHtml(data: BookingEmailData): string {
  const name = escapeHtml(formatAccommodationName(data.accommodation));
  const guestName = escapeHtml(data.guest_name);
  const numGuests = escapeHtml(data.num_guests);
  const totalPrice = escapeHtml(formatPrice(data.total_price));
  const bookingId = escapeHtml(data.booking_id);

  return layout("Booking Confirmed", `
    <p>Dear ${guestName},</p>
    <p>It is our pleasure to welcome you to Lakeside Retreat – located in a boutique vineyard, at the shore of beautiful Lake Dunstan.</p>
    
    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Your reservation Details:</h3>
      <p style="margin:4px 0;">Accommodation: ${name}</p>
      <p style="margin:4px 0;">Check-in Date: ${formatDateLong(data.check_in)} (3:00 PM)</p>
      <p style="margin:4px 0;">Check-out Date: ${formatDateLong(data.check_out)} (10:00 AM)</p>
      ${data.num_guests ? `<p style="margin:4px 0;">No. of Guests: ${numGuests}</p>` : ""}
      ${data.total_price ? `<p style="margin:4px 0;">Total: $${totalPrice} NZD</p>` : ""}
      ${data.booking_id ? `<p style="margin:4px 0;">Booking ID: ${bookingId}</p>` : ""}
    </div>

    <h5 style="font-size:16px;color:#2d5a5a;">For your stay:</h5>
    <ul style="padding-left:20px;">
      <li>
      Your very own private fresh saltwater spa is available
      free of charge during your stay.
    </li>
    <li>
      On arrival, please press the button to open the electric gate. The gate will close
      automatically after two minutes.
    </li>
    <li>
      Our domes have a non-smoking policy. Please smoke at
      the patio or in the garden area. Thank you.
    </li>
    <li>
      Continental breakfast is included in your booking.
      Please advise us if you have any dietary requirements.
    </li>
    </ul>
 <h5 style="font-size:16px;color:#2d5a5a;">Check-In / Check-Out</h5> 
<p> Dome check-in time is from 3:00pm. Check-out time is 10:00am.  Early check-in and late check-out can be arranged, subject to availability and an additional charge. Please check with us to confirm. </p> 

 <h5 style="font-size:16px;color:#2d5a5a;">Parking</h5> 
<p> Free parking is available at the front of the dome. </p> 

 <h5 style="font-size:16px;color:#2d5a5a;">Driving Directions</h5> 
<p>We are at:</p> 
<address> 96 Smiths Way<br> Mt Pisa, Cromwell 9383<br> New Zealand </address> 
<p> We are approximately 10 minutes' drive north of Cromwell town centre. Please see the link below for detailed directions: </p> 
<p> <a href="https://www.google.co.nz/maps/place/96+Smiths+Way,+Mount+Pisa+9383" target="_blank" rel="noopener noreferrer" > View driving directions on Google Maps </a> </p> 
<p> The domes are on your right-hand side in the driveway, towards the lake. </p> 

 <h5 style="font-size:16px;color:#2d5a5a;">Special Information</h5> 
<p> Discover and book Cromwell's most memorable activities at: </p> <p> <a href="https://www.tripadvisor.co.nz/Attractions-g642254-Activities-Cromwell_Central_Otago_Otago_Region_South_Island.html" target="_blank" rel="noopener noreferrer" > Discover Cromwell activities on TripAdvisor </a> </p> 

<h5 style="font-size:16px;color:#2d5a5a;">Need Help During Your Stay?</h5> 
<p> Should you require any additional help or information during your stay with us, please do not hesitate to contact Steve or Sandy: </p> <p> Phone: <a href="tel:+6421368682">021 368 682</a> </p> <p> Email: <a href="mailto:info@lakesideretreat.co.nz">info@lakesideretreat.co.nz</a> </p> <p> We sincerely thank you for choosing Lakeside Retreat. We hope that you have a comfortable and pleasant stay! </p> 


${signOff}
    
   
  `);
}
/* ---------------------------------------------------------------------------
 * BookingTemplates-Cottage
 * ------------------------------------------------------------------------- */

export function bookingConfirmationCottageHtml(data: BookingEmailData): string {
  const name = escapeHtml(formatAccommodationName(data.accommodation));
  const guestName = escapeHtml(data.guest_name);
  const numGuests = escapeHtml(data.num_guests);
  const totalPrice = escapeHtml(formatPrice(data.total_price));
  const bookingId = escapeHtml(data.booking_id);

  return layout("Booking Confirmed", `
    <p>Dear ${guestName},</p>
    <p>It is our pleasure to welcome you to Lakeside Retreat – located in a boutique vineyard, at the shore of beautiful Lake Dunstan.</p>
    
    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Your reservation Details:</h3>
      <p style="margin:4px 0;">Accommodation: ${name}</p>
      <p style="margin:4px 0;">Check-in Date: ${formatDateLong(data.check_in)} (3:00 PM)</p>
      <p style="margin:4px 0;">Check-out Date: ${formatDateLong(data.check_out)} (10:00 AM)</p>
      ${data.num_guests ? `<p style="margin:4px 0;">No. of Guests: ${numGuests}</p>` : ""}
      ${data.total_price ? `<p style="margin:4px 0;">Total: $${totalPrice} NZD</p>` : ""}
      ${data.booking_id ? `<p style="margin:4px 0;">Booking ID: ${bookingId}</p>` : ""}
    </div>

    <h5 style="font-size:16px;color:#2d5a5a;">For your stay:</h5>
    <ul style="padding-left:20px;">
      <li>
      Your very own private fresh hot tub is available
      free of charge during your stay.
    </li>
    <li>
      On arrival, please press the button to open the electric gate. The gate will close
      automatically after two minutes.
    </li>
    <li>
     The cottage has a non-smoking policy. Please smoke at
      the patio or in the garden area. Thank you.
    </li>
    <li>
      Enjoy a continental breakfast delivered onsite during your stay. Breakfast options and pricing are available upon request.
    </li>
    </ul>
 <h5 style="font-size:16px;color:#2d5a5a;">Check-In / Check-Out</h5> 
<p> Cottage check-in time is from 3:00pm. Check-out time is 10:00am.  Early check-in and late check-out can be arranged, subject to availability and an additional charge. Please check with us to confirm. </p>

 <h5 style="font-size:16px;color:#2d5a5a;">Parking</h5>
<p> Free parking is available at the front of the cottage. </p>

 <h5 style="font-size:16px;color:#2d5a5a;">Driving Directions</h5>
<p>We are at:</p>
<address> 96 Smiths Way<br> Mt Pisa, Cromwell 9383<br> New Zealand </address>
<p> We are approximately 10 minutes' drive north of Cromwell town centre. Please see the link below for detailed directions: </p>
<p> <a href="https://www.google.co.nz/maps/place/96+Smiths+Way,+Mount+Pisa+9383" target="_blank" rel="noopener noreferrer" > View driving directions on Google Maps </a> </p>
<p> The cottage is on your left-hand side, at the end of the driveway. </p>

 <h5 style="font-size:16px;color:#2d5a5a;">Special Information</h5> 
<p> Discover and book Cromwell's most memorable activities at: </p> <p> <a href="https://www.tripadvisor.co.nz/Attractions-g642254-Activities-Cromwell_Central_Otago_Otago_Region_South_Island.html" target="_blank" rel="noopener noreferrer" > Discover Cromwell activities on TripAdvisor </a> </p> 

<h5 style="font-size:16px;color:#2d5a5a;">Need Help During Your Stay?</h5> 
<p> Should you require any additional help or information during your stay with us, please do not hesitate to contact Steve or Sandy: </p> <p> Phone: <a href="tel:+6421368682">021 368 682</a> </p> <p> Email: <a href="mailto:info@lakesideretreat.co.nz">info@lakesideretreat.co.nz</a> </p> <p> We sincerely thank you for choosing Lakeside Retreat. We hope that you have a comfortable and pleasant stay! </p> 


${signOff}
    
   
  `);
}

export function preArrivalHtml(data: BookingEmailData): string {
  const name = escapeHtml(formatAccommodationName(data.accommodation));
  const guestName = escapeHtml(data.guest_name);
  const numGuests = escapeHtml(data.num_guests);
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
      <p style="margin:0;">Well-behaved dogs are welcome ($25 flat fee per stay). Please keep them off the furniture and clean up after them on the property.</p>
    </div>`;
  }

  return layout("Your Stay Starts Soon", `
    <p>Hi ${guestName},</p>
    <p>We can't wait to welcome you to our unique and tranquil dome in our boutique vineyard for a one-of-a-kind experience.</p>
    <p>As we prepare for your upcoming stay, here are a few details to ensure a smooth and enjoyable experience:</p>
    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Arrival Details</h3>
      <p style="margin:4px 0;">Our Address is: <br>96 Smiths Way,<br> Mount Pisa,<br> Cromwell</p>
      <p style="margin:4px 0;"><br>Check-in: ${formatDateLong(data.check_in)} from 3:00 PM</p>
      <p style="margin:4px 0;">Check-out: ${formatDateLong(data.check_out)} by 10:00 AM</p>
      <p style="margin:4px 0;">You have booked: ${name}</p>
      ${data.num_guests ? `<p style="margin:4px 0;">Guests: ${numGuests}</p>` : ""}
    </div>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Property Essentials</h3>
      <p style="margin:4px 0;"><strong>Parking:</strong><br> Complimentary onsite parking is available for your convenience throughout your stay.</p>
      <p style="margin:4px 0;"><strong>Self Checkin:</strong> <br>On arrival, your key will be waiting on the benchtop, with the door unlocked for your convenience. Once you’re settled in, we’ll pop by to warmly welcome you and ensure everything is just right for your stay.<br></p>
      <p style="margin:4px 0;" class="weather-message"><strong>Weather Forecast:</strong><br>
  For your weather forecast in Cromwell, please
  <a
    href="https://www.accuweather.com/en/nz/cromwell/249913/weather-forecast/249913"
    target="_blank"
    rel="noopener noreferrer"
  >
    view the latest forecast here
  </a>
  at your convenience.
</p>
    </div>

    ${propertyTips}

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Explore the Area</h3>
      <p style="margin:4px 0;">Central Otago has incredible dining, wineries, and scenery. Explore our website or simply ask us for our favourites when you arrive — we’re always delighted to share our local recommendations.</p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <p style="margin:0 0 10px;"><strong>Have questions before you arrive?</strong></p>
      <a href="https://wa.me/6421368682" ${ctaButton("#25D366")}>Message Us on WhatsApp</a>
    </div>

    <p>We can't wait to host you!</p>
    ${signOff}
  `);
}

export function checkoutReviewReminderHtml(data: BookingEmailData): string {
  // No accommodation name: the rewritten copy thanks the guest for their stay
  // without naming the property, so formatAccommodationName is not needed here.
  const guestName = escapeHtml(data.guest_name);
  const googleReviewUrl = "https://g.page/r/lakeside-retreat-cromwell/review?utm_source=email&utm_medium=review_reminder";
  
  return layout("How was your stay?", `
    <p>Hi ${guestName},</p>
    <p>Thank you for choosing Lakeside Retreat. It has been a pleasure to welcome you, and we hope your stay was peaceful, restorative, and a memorable part of your time in Central Otago.</p>

    <p>If there was anything during your stay that fell short of expectations, we would be most grateful to hear from you directly. Simply reply to this message — we value your feedback and would welcome the opportunity to make things right.</p>

    <p>Should you have enjoyed your time with us, we would be honoured if you would share a few words about your experience in a review. Your thoughtful feedback is sincerely appreciated and means a great deal to us.</p>

    <div style="text-align:center;margin:24px 0;">
      <a href="${googleReviewUrl}" ${ctaButton("#4285f4")}>Review on Google</a>
      </div>

<p>As you continue your travels, we wish you a beautiful journey ahead, filled with wonderful places, unforgettable moments, and safe travels.</p>

    <p>It has been our pleasure to host you, and we hope our paths cross again at Lakeside Retreat.</p>

    ${signOff}
  `);
}

export function paymentFailureHtml(data: BookingEmailData): string {
  const name = escapeHtml(formatAccommodationName(data.accommodation));
  const guestName = escapeHtml(data.guest_name);
  const numGuests = escapeHtml(data.num_guests);
  const totalPrice = escapeHtml(formatPrice(data.total_price));
  const idSlice = escapeHtml(data.booking_id ? data.booking_id.slice(0, 8) : "");

  return layout("Payment Issue", `
    <p>Hi ${guestName},</p>
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
      ${data.num_guests ? `<p style="margin:4px 0;"><strong>Guests:</strong> ${numGuests}</p>` : ""}
      ${data.total_price ? `<p style="margin:4px 0;"><strong>Total:</strong> $${totalPrice} NZD</p>` : ""}
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
  const name = escapeHtml(formatAccommodationName(data.accommodation));
  const guestName = escapeHtml(data.guest_name);
  const numGuests = escapeHtml(data.num_guests);
  const totalPrice = escapeHtml(formatPrice(data.total_price));
  const bookingId = escapeHtml(data.booking_id);

  const refundBlock = data.refundEligible
    ? `<div style="padding:14px 18px;border-radius:6px;margin:20px 0;border-left:4px solid #28a745;background-color:#f0fff0;">
        <h4 style="margin:0 0 6px;">Refund Information</h4>
        <p style="margin:0;">Since your cancellation was made more than 14 days before your scheduled arrival date, you are eligible for a full refund. Your refund is now being processed and should appear on your original payment method within 5&ndash;10 business days, depending on your bank or card provider.</p>
      </div>`
    : `<div style="padding:14px 18px;border-radius:6px;margin:20px 0;border-left:4px solid #dc3545;background-color:#fff5f5;">
        <h4 style="margin:0 0 6px;">Refund Information</h4>
        <p style="margin:0;">As this cancellation was made within 14 days of your arrival date, it is unfortunately non-refundable per our cancellation policy.</p>
      </div>`;

  return layout("Booking Cancelled", `
    <p>Hi ${guestName},</p>
    <p>This email confirms that your booking has been cancelled. We’re sorry to see you go, but we hope to have the pleasure of welcoming you to Lakeside Retreat another time.</p>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Cancelled Booking Details</h3>
      <p style="margin:4px 0;">Accommodation: ${name}</p>
      <p style="margin:4px 0;">Check-in: ${formatDateNZ(data.check_in)}</p>
      <p style="margin:4px 0;">Check-out: ${formatDateNZ(data.check_out)}</p>
      ${data.num_guests ? `<p style="margin:4px 0;">Guests: ${numGuests}</p>` : ""}
      ${data.total_price ? `<p style="margin:4px 0;">Total: $${totalPrice} NZD</p>` : ""}
      ${data.booking_id ? `<p style="margin:4px 0;">Booking ID: ${bookingId}</p>` : ""}
    </div>

    <div ${alertBox("#17a2b8")}>
      <h4 style="margin:0 0 6px;">Cancellation Policy</h4>
      <p style="margin:0;">Cancellations made 14 or more days before arrival are eligible for a full refund. Cancellations made within 14 days of arrival are non-refundable.</p>
    </div>

    ${refundBlock}

    <p>Thank you for choosing Lakeside Retreat. We would be delighted to welcome you back on another occasion. Should your plans change, we hope you’ll consider staying with us in the future. It would be our pleasure to host you and share another memorable stay.</p>

    <div style="text-align:center;margin:28px 0;">
  	<a href="https://lakesideretreat.co.nz/stay" ${ctaButton("#2d5a5a")}>    Book Again </a>
    </div>

    <p>If you have any questions about your cancellation or refund, please don't hesitate to get in touch.</p>
    ${signOff}
  `);
}

export function paymentNotificationHtml(
  data: BookingEmailData & { paymentAmount: string; paymentMethod: string }
): string {
  const name = escapeHtml(formatAccommodationName(data.accommodation));
  const guestName = escapeHtml(data.guest_name);
  const guestEmail = escapeHtml(data.guest_email);
  const paymentAmount = escapeHtml(data.paymentAmount);
  const paymentMethod = escapeHtml(data.paymentMethod);
  const bookingId = escapeHtml(data.booking_id);

  return layout("Payment Confirmed", `
    <div style="background-color:#f0fff0;padding:16px 20px;border-radius:6px;margin:0 0 20px;">
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Payment Details</h3>
      <p style="margin:4px 0;"><strong>Amount:</strong> $${paymentAmount} NZD</p>
      <p style="margin:4px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
      <p style="margin:4px 0;"><strong>Status:</strong> Completed</p>
    </div>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Booking Details</h3>
      <p style="margin:4px 0;"><strong>Guest:</strong> ${guestName} (${guestEmail})</p>
      <p style="margin:4px 0;"><strong>Accommodation:</strong> ${name}</p>
      <p style="margin:4px 0;"><strong>Dates:</strong> ${formatDateNZ(data.check_in)} to ${formatDateNZ(data.check_out)}</p>
      ${data.booking_id ? `<p style="margin:4px 0;"><strong>Booking ID:</strong> ${bookingId}</p>` : ""}
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
  const alertTypeUpper = escapeHtml(data.alertType.toUpperCase());
  const message = escapeHtml(data.message);
  const details = escapeHtml(data.details);

  return layout(`System Alert - ${data.alertType.toUpperCase()}`, `
    <div style="padding:16px 20px;border-radius:6px;margin:0 0 20px;border-left:4px solid ${borderColor};background-color:${bgColor};">
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Alert Details</h3>
      <p style="margin:4px 0;"><strong>Type:</strong> ${alertTypeUpper}</p>
      <p style="margin:4px 0;"><strong>Time:</strong> ${escapeHtml(new Date().toLocaleString("en-NZ"))}</p>
      <p style="margin:4px 0;"><strong>Message:</strong> ${message}</p>
    </div>

    ${data.details ? `<div ${detailsBox}><h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Additional Details</h3><p style="margin:4px 0;white-space:pre-wrap;">${details}</p></div>` : ""}

    <p style="color:#8a8694;font-size:13px;">This is an automated alert from the Lakeside Retreat monitoring system.</p>
  `);
}

export function contactConfirmationHtml(data: {
  name: string;
  email: string;
  message: string;
}): string {
  const guestName = escapeHtml(data.name);
  const message = escapeHtml(data.message);

  return layout("We've Received Your Message", `
    <p>Hi ${guestName},</p>
    <p>Thank you for getting in touch! We've received your message and will get back to you as soon as possible &mdash; usually within 24 hours.</p>

    <div ${detailsBox}>
      <h3 style="margin:0 0 12px;font-size:17px;color:#2d5a5a;">Your Message</h3>
      <p style="margin:4px 0;white-space:pre-wrap;">${message}</p>
    </div>

    <p>If you need an urgent response, you can reach us directly:</p>
    <ul style="padding-left:20px;">
      <li>Phone: <a href="tel:+6421368682" style="color:#2d5a5a;">+64 21 368 682</a></li>
      <li>WhatsApp: <a href="https://wa.me/6421368682" style="color:#2d5a5a;">Message us</a></li>
    </ul>

    ${signOff}
  `);
}
