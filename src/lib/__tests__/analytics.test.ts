import { describe, it, expect } from "vitest";
import {
  getAnalyticsIds,
  gaBootstrapScript,
  metaPixelBootstrapScript,
} from "@/lib/analytics";

describe("getAnalyticsIds", () => {
  it("returns nulls when nothing is configured", () => {
    expect(getAnalyticsIds({})).toEqual({ gaId: null, metaPixelId: null });
  });

  it("accepts well-formed IDs, trimming whitespace", () => {
    expect(
      getAnalyticsIds({
        GA_MEASUREMENT_ID: " g-abc123xyz ",
        META_PIXEL_ID: " 123456789012345\n",
      })
    ).toEqual({ gaId: "G-ABC123XYZ", metaPixelId: "123456789012345" });
  });

  it("treats malformed IDs as unset", () => {
    expect(
      getAnalyticsIds({ GA_MEASUREMENT_ID: "UA-1234-1", META_PIXEL_ID: "abc" })
    ).toEqual({ gaId: null, metaPixelId: null });
  });

  // The IDs land inside inline <script> bodies, so anything that could break
  // out of the string literal must be rejected, not passed through.
  it("rejects IDs that would inject script", () => {
    expect(
      getAnalyticsIds({
        GA_MEASUREMENT_ID: "G-ABC');alert(1);//",
        META_PIXEL_ID: "123456');alert(1);//",
      })
    ).toEqual({ gaId: null, metaPixelId: null });
  });
});

describe("bootstrap scripts", () => {
  it("configures GA with the given ID", () => {
    const js = gaBootstrapScript("G-ABC123XYZ");
    expect(js).toContain("gtag/js?id=G-ABC123XYZ");
    expect(js).toContain("gtag('config','G-ABC123XYZ')");
  });

  it("initialises the Pixel and sends the first PageView", () => {
    const js = metaPixelBootstrapScript("123456789012345");
    expect(js).toContain("fbq('init','123456789012345')");
    expect(js).toContain("fbq('track','PageView')");
  });
});
