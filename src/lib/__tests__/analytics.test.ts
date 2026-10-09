import { describe, it, expect } from "vitest";
import {
  getAnalyticsConfig,
  metaPixelBootstrapScript,
  umamiConnectOrigins,
} from "@/lib/analytics";

const WEBSITE_ID = "94db1cb1-74f4-4a40-ad6c-962362670409";

describe("getAnalyticsConfig", () => {
  it("returns nulls when nothing is configured", () => {
    expect(getAnalyticsConfig({})).toEqual({ umami: null, metaPixelId: null });
  });

  it("defaults Umami to the cloud script and normalises the ID", () => {
    expect(
      getAnalyticsConfig({
        UMAMI_WEBSITE_ID: ` ${WEBSITE_ID.toUpperCase()} `,
        META_PIXEL_ID: " 123456789012345\n",
      })
    ).toEqual({
      umami: {
        websiteId: WEBSITE_ID,
        scriptUrl: "https://cloud.umami.is/script.js",
      },
      metaPixelId: "123456789012345",
    });
  });

  it("accepts a self-hosted https script URL", () => {
    expect(
      getAnalyticsConfig({
        UMAMI_WEBSITE_ID: WEBSITE_ID,
        UMAMI_SCRIPT_URL: "https://stats.example.com/script.js",
      }).umami?.scriptUrl
    ).toBe("https://stats.example.com/script.js");
  });

  it.each([
    "http://stats.example.com/script.js",
    "https://stats.example.com/script.js?x=1",
    "https://user:pw@stats.example.com/script.js",
    "https://stats.example.com/",
    "javascript:alert(1)",
    "not a url",
  ])("disables Umami for an unsafe script URL: %s", (url) => {
    expect(
      getAnalyticsConfig({ UMAMI_WEBSITE_ID: WEBSITE_ID, UMAMI_SCRIPT_URL: url })
        .umami
    ).toBeNull();
  });

  // The values land in HTML attributes, an inline <script> body and the CSP
  // header, so anything malformed must be rejected, not passed through.
  it("treats malformed IDs as unset", () => {
    expect(
      getAnalyticsConfig({
        UMAMI_WEBSITE_ID: `${WEBSITE_ID}" onload="alert(1)`,
        META_PIXEL_ID: "123456');alert(1);//",
      })
    ).toEqual({ umami: null, metaPixelId: null });
  });
});

describe("umamiConnectOrigins", () => {
  it("is empty when Umami is off", () => {
    expect(umamiConnectOrigins(null)).toEqual([]);
  });

  it("allows Umami Cloud's collection host", () => {
    const { umami } = getAnalyticsConfig({ UMAMI_WEBSITE_ID: WEBSITE_ID });
    expect(umamiConnectOrigins(umami)).toContain("https://gateway.umami.is");
  });

  it("allows only the self-hosted origin otherwise", () => {
    const { umami } = getAnalyticsConfig({
      UMAMI_WEBSITE_ID: WEBSITE_ID,
      UMAMI_SCRIPT_URL: "https://stats.example.com/umami/script.js",
    });
    expect(umamiConnectOrigins(umami)).toEqual(["https://stats.example.com"]);
  });
});

describe("metaPixelBootstrapScript", () => {
  it("initialises the Pixel and sends the first PageView", () => {
    const js = metaPixelBootstrapScript("123456789012345");
    expect(js).toContain("fbq('init','123456789012345')");
    expect(js).toContain("fbq('track','PageView')");
  });
});
