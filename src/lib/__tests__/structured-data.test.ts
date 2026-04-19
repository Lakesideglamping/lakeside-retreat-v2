/**
 * Guards the XSS escape for JSON-LD content inside <script> tags.
 * If an attacker can inject a string ending with </script> into any
 * schema field (review text, property name, etc.), they could break
 * out of the tag and execute JS. This is the regression guard.
 */
import { describe, it, expect } from "vitest";
import { __test__ } from "../structured-data";

const { safeJsonForScript } = __test__;

describe("safeJsonForScript", () => {
  it("escapes </script> so it cannot close the host tag", () => {
    const out = safeJsonForScript({ desc: "evil</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<script>");
    expect(out).toContain("\\u003c");
  });

  it("escapes all angle brackets and ampersands", () => {
    const out = safeJsonForScript({ x: "<>&" });
    expect(out).not.toMatch(/[<>&]/);
    expect(out).toContain("\\u003c");
    expect(out).toContain("\\u003e");
    expect(out).toContain("\\u0026");
  });

  it("escapes U+2028 and U+2029 line terminators", () => {
    const out = safeJsonForScript({ x: "line1\u2028line2\u2029line3" });
    expect(out).not.toContain("\u2028");
    expect(out).not.toContain("\u2029");
  });

  it("produces parseable JSON (after un-escaping unicode)", () => {
    const out = safeJsonForScript({ a: "hello", b: 1 });
    // JSON.parse accepts \uXXXX escapes, so the output is still valid JSON.
    const parsed = JSON.parse(out);
    expect(parsed).toEqual({ a: "hello", b: 1 });
  });
});
