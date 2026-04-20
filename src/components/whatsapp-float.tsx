// Fall back to the known number so the button still works if the env var
// is not set. Configure NEXT_PUBLIC_WHATSAPP_PHONE in your environment
// (e.g. "6421368682" — country code, no +, no spaces).
const PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "6421368682";
const MESSAGE = "Hi! I'm interested in booking at Lakeside Retreat and had a quick question.";

export function WhatsAppFloat() {
  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message us on WhatsApp"
      className="group fixed bottom-20 right-5 md:bottom-6 md:right-6 z-40 flex items-center gap-3"
    >
      {/* Desktop label */}
      <span className="hidden md:inline-block bg-white text-body text-sm font-semibold px-4 py-2 rounded-full shadow-md opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap">
        Message us on WhatsApp
      </span>

      {/* Bubble */}
      <span
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-lg hover:scale-105 active:scale-95 transition-transform"
      >
        {/* Subtle ping on load to draw the eye without being annoying */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping-slow" aria-hidden />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="relative w-7 h-7 fill-white"
          aria-hidden
        >
          <path d="M16.003 3C9.373 3 4 8.373 4 15.003c0 2.65.867 5.112 2.33 7.11L4 29l7.09-2.298a12.95 12.95 0 0 0 4.914.96h.002C22.636 27.662 28 22.288 28 15.66 28 12.44 26.74 9.42 24.46 7.14A12.92 12.92 0 0 0 16.003 3Zm0 2.18c2.8 0 5.432 1.09 7.41 3.068a10.41 10.41 0 0 1 3.07 7.41c0 5.44-4.43 9.87-9.87 9.87h-.003a10.75 10.75 0 0 1-4.473-.967l-.32-.142-4.21 1.365 1.388-4.103-.156-.333a10.6 10.6 0 0 1-1.066-4.6c.002-5.44 4.428-9.868 9.87-9.868Zm-4.76 5.46c-.22 0-.58.083-.885.413-.305.33-1.165 1.138-1.165 2.775s1.193 3.22 1.36 3.443c.166.22 2.33 3.72 5.767 5.068 2.86 1.122 3.442.9 4.063.844.62-.055 2-.818 2.283-1.608.28-.79.28-1.47.195-1.608-.083-.137-.305-.22-.635-.385-.33-.165-1.96-.967-2.263-1.078-.303-.11-.524-.165-.745.165-.22.33-.854 1.078-1.047 1.298-.193.22-.386.247-.717.082-.33-.165-1.396-.515-2.66-1.64-.984-.877-1.647-1.96-1.84-2.29-.192-.33-.02-.508.145-.673.148-.147.33-.385.496-.578.165-.193.22-.33.33-.55.11-.22.055-.413-.028-.578-.083-.165-.723-1.744-.99-2.387-.26-.626-.526-.542-.724-.552-.187-.01-.402-.012-.617-.012Z" />
        </svg>
      </span>
    </a>
  );
}
