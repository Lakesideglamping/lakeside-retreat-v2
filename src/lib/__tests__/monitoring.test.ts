import { describe, it, expect } from "vitest";
import { maskEmail, maskPhone, redactPII } from "../monitoring";

describe("maskEmail", () => {
  it("masks local part beyond first two chars", () => {
    expect(maskEmail("john@example.com")).toBe("jo***@example.com");
  });

  it("handles single-char local part", () => {
    expect(maskEmail("a@example.com")).toBe("a***@example.com");
  });

  it("returns original when no @ present", () => {
    expect(maskEmail("notanemail")).toBe("notanemail");
  });

  it("handles empty string", () => {
    expect(maskEmail("")).toBe("");
  });
});

describe("maskPhone", () => {
  it("keeps last 4 digits", () => {
    expect(maskPhone("+64 21 368 682")).toBe("***8682");
    expect(maskPhone("021 123 4567")).toBe("***4567");
  });

  it("returns *** for very short inputs", () => {
    expect(maskPhone("12")).toBe("***");
  });
});

describe("redactPII", () => {
  it("masks email fields", () => {
    const result = redactPII({ email: "jane@example.com", name: "Jane" });
    expect(result.email).toBe("ja***@example.com");
    expect(result.name).toBe("Jane");
  });

  it("masks guest_email field", () => {
    const result = redactPII({ guest_email: "guest@test.com" });
    expect(result.guest_email).toBe("gu***@test.com");
  });

  it("masks phone field", () => {
    const result = redactPII({ phone: "+64211234567" });
    expect(result.phone).toBe("***4567");
  });

  it("does not mutate the original object", () => {
    const original = { email: "test@test.com" };
    redactPII(original);
    expect(original.email).toBe("test@test.com");
  });

  it("ignores non-string values", () => {
    const result = redactPII({ count: 5 as unknown as string });
    expect(result.count).toBe(5);
  });
});
