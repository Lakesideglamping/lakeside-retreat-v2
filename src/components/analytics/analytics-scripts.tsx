import { headers } from "next/headers";
import {
  getAnalyticsConfig,
  metaPixelBootstrapScript,
  UMAMI_TRACKED_DOMAINS,
} from "@/lib/analytics";
import { MetaPageViews } from "./meta-page-views";

/**
 * Umami and Meta Pixel loaders for the public site. Renders nothing unless
 * UMAMI_WEBSITE_ID / META_PIXEL_ID are set (see lib/analytics.ts). Mounted in
 * the public layout only, so admin pages are never tracked.
 */
export async function AnalyticsScripts() {
  const { umami, metaPixelId } = getAnalyticsConfig();
  if (!umami && !metaPixelId) return null;

  // Same per-request nonce the root layout uses; see middleware.ts.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      {umami && (
        // Umami records client-side route changes itself (it hooks
        // history.pushState), so nothing extra is needed for Next navigation.
        <script
          defer
          nonce={nonce}
          src={umami.scriptUrl}
          data-website-id={umami.websiteId}
          data-domains={UMAMI_TRACKED_DOMAINS}
        />
      )}
      {metaPixelId && (
        <>
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: metaPixelBootstrapScript(metaPixelId),
            }}
          />
          <MetaPageViews />
        </>
      )}
    </>
  );
}
