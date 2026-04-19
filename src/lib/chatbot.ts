import { logger } from "./logger";

const SESSION_TTL = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_HISTORY = 20;

// --- Types ---

interface KnowledgeBase {
  business: {
    name: string;
    location: {
      address: string;
      distances: Record<string, string>;
    };
    contact: { phone: string; email: string };
    hosts: string;
    features: Record<string, string>;
    rating: { score: number; reviews: number };
  };
  accommodations: Accommodation[];
  policies: {
    checkIn: { time: string };
    checkOut: { time: string };
    securityDeposit: { amount: number };
    pets: string;
  };
  faqs: FAQ[];
  intents: Record<string, Intent>;
  fallback: { response: string };
}

interface Accommodation {
  id: string;
  name: string;
  type: string;
  size: string;
  maxGuests: number;
  price: { base: number; currency: string; extraGuestFee?: number };
  description: string;
  amenities: string[];
  views: string;
  petFriendly: boolean;
  petPolicy?: string;
}

interface FAQ {
  question: string;
  answer: string;
  keywords: string[];
}

interface Intent {
  patterns: string[];
  response: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  response: string;
  intent?: string;
}

// --- Session store ---

const conversationHistory = new Map<string, ChatMessage[]>();
const sessionLastActivity = new Map<string, number>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(evictStaleSessions, CLEANUP_INTERVAL);
  if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    (cleanupTimer as NodeJS.Timeout).unref();
  }
}

function evictStaleSessions() {
  const now = Date.now();
  let evicted = 0;
  for (const [sessionId, lastActivity] of sessionLastActivity) {
    if (now - lastActivity > SESSION_TTL) {
      conversationHistory.delete(sessionId);
      sessionLastActivity.delete(sessionId);
      evicted++;
    }
  }
  if (evicted > 0) {
    logger.info(`Chatbot: evicted ${evicted} stale session(s)`, {
      activeSessions: conversationHistory.size,
    });
  }
}

// --- Knowledge base loading ---

let knowledgeBase: KnowledgeBase | null = null;

async function loadKnowledgeBase(): Promise<KnowledgeBase | null> {
  if (knowledgeBase) return knowledgeBase;

  try {
    // Server-side: read from filesystem
    if (typeof window === "undefined") {
      const fs = await import("fs");
      const path = await import("path");
      const kbPath = path.join(process.cwd(), "public", "chatbot-knowledge-base.json");
      const data = fs.readFileSync(kbPath, "utf8");
      knowledgeBase = JSON.parse(data) as KnowledgeBase;
    } else {
      // Client-side: fetch from public directory
      const res = await fetch("/chatbot-knowledge-base.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      knowledgeBase = (await res.json()) as KnowledgeBase;
    }

    return knowledgeBase;
  } catch (error) {
    logger.error("Failed to load chatbot knowledge base", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// --- Intent detection ---

function matchIntent(
  message: string,
  kb: KnowledgeBase
): { response: string; intent: string } | null {
  for (const [intentName, intentData] of Object.entries(kb.intents)) {
    for (const pattern of intentData.patterns) {
      if (message.includes(pattern.toLowerCase())) {
        return { response: intentData.response, intent: intentName };
      }
    }
  }
  return null;
}

// --- FAQ matching with keyword scoring ---

function matchFAQ(message: string, kb: KnowledgeBase): string | null {
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const faq of kb.faqs) {
    let score = 0;

    for (const keyword of faq.keywords) {
      if (message.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }

    const questionWords = faq.question.toLowerCase().split(/\s+/);
    for (const word of questionWords) {
      if (word.length > 3 && message.includes(word)) {
        score += 1;
      }
    }

    if (score > bestScore && score >= 2) {
      bestScore = score;
      bestMatch = faq.answer;
    }
  }

  return bestMatch;
}

// --- Accommodation matching ---

function formatAccommodationResponse(acc: Accommodation): string {
  let response = `**${acc.name}** - ${acc.type}\n\n`;
  response += `${acc.description}\n\n`;
  response += `**Size:** ${acc.size}\n`;
  response += `**Max Guests:** ${acc.maxGuests}\n`;
  response += `**Price:** $${acc.price.base} NZD per night\n`;
  response += `**Views:** ${acc.views}\n\n`;
  response += `**Amenities include:** ${acc.amenities.slice(0, 5).join(", ")}, and more.\n\n`;

  if (acc.petFriendly) {
    response += `This accommodation is pet-friendly. ${acc.petPolicy ?? ""}\n\n`;
  }

  response += `Would you like to book ${acc.name} or learn more about our other options?`;
  return response;
}

function formatComparisonResponse(kb: KnowledgeBase): string {
  let response = "Here's a comparison of our accommodations:\n\n";

  for (const acc of kb.accommodations) {
    response += `**${acc.name}** (${acc.size})\n`;
    response += `- Price: $${acc.price.base} NZD/night\n`;
    response += `- Max guests: ${acc.maxGuests}\n`;
    response += `- Best for: ${acc.maxGuests <= 2 ? "Couples" : "Small adult groups"}\n`;
    response += `- Pet-friendly: ${acc.petFriendly ? "Yes" : "No"}\n\n`;
  }

  response +=
    "The domes are perfect for romantic getaways with saltwater spa access and breakfast included (adults only, no pets). ";
  response +=
    "The cottage suits couples or small adult groups with a kitchenette, direct lake access, wood-fired hot tub, BBQ, and is dog-friendly.\n\n";
  response +=
    "All three properties are strictly adults only (18+).\n\n";
  response += "Which accommodation interests you most?";
  return response;
}

function matchAccommodation(message: string, kb: KnowledgeBase): string | null {
  for (const acc of kb.accommodations) {
    const nameVariants = [
      acc.name.toLowerCase(),
      acc.id.toLowerCase(),
      acc.id.replace("-", " ").toLowerCase(),
    ];

    for (const variant of nameVariants) {
      if (message.includes(variant)) {
        return formatAccommodationResponse(acc);
      }
    }
  }

  if (
    message.includes("compare") ||
    message.includes("difference") ||
    message.includes("which") ||
    message.includes("recommend")
  ) {
    return formatComparisonResponse(kb);
  }

  return null;
}

// --- Optional OpenAI enhancement ---

function buildSystemPrompt(kb: KnowledgeBase): string {
  return `You are a helpful assistant for Lakeside Retreat, a luxury glamping accommodation in Central Otago, New Zealand.

IMPORTANT RULES:
1. Only answer questions about Lakeside Retreat and its services
2. Never invent prices, policies, or information not provided below
3. If unsure, suggest contacting Stephen & Sandy at ${kb.business.contact.phone} or ${kb.business.contact.email}
4. Be friendly, helpful, and concise
5. Encourage bookings when appropriate

BUSINESS INFO:
- Location: ${kb.business.location.address}
- Hosts: ${kb.business.hosts}
- Phone: ${kb.business.contact.phone}
- Email: ${kb.business.contact.email}
- Rating: ${kb.business.rating.score}/5 from ${kb.business.rating.reviews} reviews

ACCOMMODATIONS:
${kb.accommodations
  .map(
    (a) =>
      `- ${a.name}: ${a.size}, $${a.price.base}/night, max ${a.maxGuests} guests, ${a.petFriendly ? "pet-friendly" : "no pets"}`
  )
  .join("\n")}

POLICIES:
- Check-in: ${kb.policies.checkIn.time} (early check-in often available)
- Check-out: ${kb.policies.checkOut.time} (late check-out by arrangement)
- Security deposit: $${kb.policies.securityDeposit.amount} (authorization hold, released 48h after checkout)
- Pets: ${kb.policies.pets}

DISTANCES:
- Queenstown Airport: ${kb.business.location.distances.queenstown_airport}
- Wanaka: ${kb.business.location.distances.wanaka}
- Cromwell: ${kb.business.location.distances.cromwell}
- Cycle trail: ${kb.business.location.distances.cycle_trail}

SUSTAINABILITY:
- ${kb.business.features.solar_system}
- ${kb.business.features.battery}

Keep responses concise and helpful. If the question is not about Lakeside Retreat, politely redirect to relevant topics.`;
}

async function getAIResponse(
  userMessage: string,
  history: ChatMessage[],
  kb: KnowledgeBase
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const systemPrompt = buildSystemPrompt(kb);

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.slice(-6).map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// --- Main entry point ---

export async function processMessage(
  sessionId: string,
  message: string
): Promise<ChatResponse> {
  const kb = await loadKnowledgeBase();

  if (!kb) {
    return {
      response:
        "Sorry, I'm having trouble accessing my knowledge base. Please contact us directly at info@lakesideretreat.co.nz",
    };
  }

  ensureCleanupTimer();

  const normalizedMessage = message.toLowerCase().trim();

  // Update session activity
  sessionLastActivity.set(sessionId, Date.now());

  if (!conversationHistory.has(sessionId)) {
    conversationHistory.set(sessionId, []);
  }
  const history = conversationHistory.get(sessionId)!;
  history.push({ role: "user", content: message, timestamp: new Date() });

  // Cap history length
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }

  let response: string;
  let intent: string | undefined;

  // 1. Intent detection
  const intentMatch = matchIntent(normalizedMessage, kb);
  if (intentMatch) {
    response = intentMatch.response;
    intent = intentMatch.intent;
  } else {
    // 2. FAQ matching
    const faqResponse = matchFAQ(normalizedMessage, kb);
    if (faqResponse) {
      response = faqResponse;
      intent = "faq";
    } else {
      // 3. Accommodation matching
      const accommodationResponse = matchAccommodation(normalizedMessage, kb);
      if (accommodationResponse) {
        response = accommodationResponse;
        intent = "accommodation";
      } else if (process.env.OPENAI_API_KEY) {
        // 4. AI fallback
        try {
          response = await getAIResponse(message, history, kb);
          intent = "ai";
        } catch (error) {
          logger.error("AI response failed, using fallback", {
            error: error instanceof Error ? error.message : String(error),
          });
          response = kb.fallback.response;
          intent = "fallback";
        }
      } else {
        response = kb.fallback.response;
        intent = "fallback";
      }
    }
  }

  history.push({ role: "assistant", content: response, timestamp: new Date() });

  return { response, intent };
}
