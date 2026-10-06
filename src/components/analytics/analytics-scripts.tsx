import { headers } from "next/headers";
import {
  getAnalyticsIds,
  gaBootstrapScript,
  metaPixelBootstrapScript,
} from "@/lib/analytics";
import { MetaPageViews } from "./meta-page-views";

/**
 * GA4 and Meta Pixel loaders for the public site. Renders nothing unless
 * GA_MEASUREMENT_ID / META_PIXEL_ID are set (see lib/analytics.ts). Mounted in
 * the public layout only, so admin pages are never tracked.
 */
export async function AnalyticsScripts() {
  const { gaId, metaPixelId } = getAnalyticsIds();
  if (!gaId && !metaPixelId) return null;

  // Same per-request nonce the root layout uses; see middleware.ts.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      {gaId && (
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: gaBootstrapScript(gaId) }}
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
