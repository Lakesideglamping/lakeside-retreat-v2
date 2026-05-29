import { prisma } from "@/lib/db";
import { ContactMessagesContent } from "@/components/admin/messages/contact-messages-content";

const PAGE_SIZE = 20;

// Server-prefetch the first page so the table is populated on first paint,
// matching the pattern used by the other admin pages (no client-fetch
// flicker). Pagination beyond page 1 is handled client-side via
// /api/admin/contact-messages.
export default async function MessagesPage() {
  const [messages, total] = await Promise.all([
    prisma.contact_messages.findMany({
      orderBy: { created_at: "desc" },
      take: PAGE_SIZE,
    }),
    prisma.contact_messages.count(),
  ]);

  return (
    <ContactMessagesContent
      initialData={{
        messages: messages.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          message: m.message,
          created_at: m.created_at ? m.created_at.toISOString() : null,
        })),
        pagination: {
          page: 1,
          limit: PAGE_SIZE,
          total,
          totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        },
      }}
    />
  );
}
