import { MetadataRoute } from "next";

/**
 * Evaluated per request, not baked into the build.
 *
 * This route was prerendered as static, and MAINTENANCE_MODE was read once at
 * module load, so its output was fixed at build time. Turning maintenance off
 * in Render lifted the middleware redirect immediately — middleware runs on
 * every request — while robots.txt kept serving the "disallow: /" baked in by
 * an earlier build, telling every crawler to stay away from a live site.
 *
 * The failure is silent and slow: nothing errors, the site looks fine, and the
 * only symptom is that Google never indexes it. force-dynamic costs nothing
 * here (the response is a few lines of text) and makes the env var the single
 * source of truth at the moment it is asked.
 */
export const dynamic = "force-dynamic";

/**
 * Paths no crawler should spend requests on.
 *
 * /_next/image is the one that matters. It is the on-demand image optimiser:
 * every distinct ?url=&w=&q= combination makes sharp decode the source and
 * re-encode it, natively, outside the Node heap. next/image puts one URL per
 * configured width into every srcset it renders, so a crawler walking the site
 * multiplies 89 images by every width in deviceSizes.
 *
 * That is what exhausted the 512MB instance twice on 2026-09-18 — the second
 * time with GPTBot fetching /_next/image?...IMG_1266-1920x1080.jpeg...&w=1920,
 * and Render reporting "exceeded its memory limit" as it restarted.
 *
 * Blocking it costs nothing. sitemap-images.xml advertises the originals under
 * /images/, which are served as plain static files and never touch sharp, so
 * Google Images still indexes every photo. Browsers do not read robots.txt, so
 * real visitors keep getting optimised images exactly as before.
 *
 * Only /_next/image is blocked, never /_next/ as a whole: /_next/static holds
 * the JS and CSS Google needs to render pages for indexing.
 */
const DISALLOW = [
  "/admin/",
  "/api/",
  "/.git/",
  "/node_modules/",
  "/_next/image",
];

/**
 * Crawlers that collect content to train foundation models.
 *
 * Blocked. They walk the site exhaustively and return nothing — no referral, no
 * citation, no visitor. Tokens verified against each vendor's own crawler
 * documentation on 2026-09-18.
 */
const TRAINING_CRAWLERS = ["GPTBot", "ClaudeBot", "CCBot"];

/**
 * Crawlers that surface and link the site in AI answers, and fetchers acting
 * for someone who asked a question just now.
 *
 * Allowed. For a direct-booking business competing with the OTAs for
 * visibility, being findable when a traveller asks an assistant about glamping
 * near Cromwell is a discovery channel, the same way Google is.
 *
 * These get the same rules as everyone else, so listing them is redundant
 * today. It is here so the policy is legible, and so tightening the "*" block
 * later cannot silently shut off the channel we chose to keep.
 *
 * Note both vendors say their user-initiated fetchers may not consult
 * robots.txt at all, since a person asked for that page directly. Allowing them
 * is therefore a statement of intent as much as a control.
 */
const SEARCH_AND_USER_AGENTS = [
  "OAI-SearchBot", // OpenAI — ChatGPT search results
  "ChatGPT-User", // OpenAI — user-initiated fetch
  "Claude-SearchBot", // Anthropic — search quality
  "Claude-User", // Anthropic — user-initiated fetch
  "PerplexityBot", // Perplexity — search indexing
  "Perplexity-User", // Perplexity — user-initiated fetch
];

export default function robots(): MetadataRoute.Robots {
  // Read inside the handler, so a long-lived server process cannot hold a
  // stale value from whenever the module first loaded.
  const maintenanceMode = process.env.MAINTENANCE_MODE === "true";

  // Block all crawlers while in maintenance mode — no point indexing a
  // coming-soon page, and we don't want half-built content in Google's cache.
  if (maintenanceMode) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      // Most specific first. A crawler obeys the block naming its own token and
      // ignores the others, so the training crawlers never fall through to "*".
      { userAgent: TRAINING_CRAWLERS, disallow: "/" },
      {
        userAgent: SEARCH_AND_USER_AGENTS,
        allow: "/",
        disallow: DISALLOW,
        crawlDelay: 1,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
        crawlDelay: 1,
      },
    ],
    sitemap: [
      "https://lakesideretreat.co.nz/sitemap.xml",
      "https://lakesideretreat.co.nz/sitemap-images.xml",
    ],
  };
}
