import { describe, it, expect, vi, beforeEach } from "vitest";

const { execFileSync } = vi.hoisted(() => ({ execFileSync: vi.fn() }));
vi.mock("node:child_process", () => ({
  execFileSync,
  default: { execFileSync },
}));

// Answers only the sitemap's own git calls; anything else that reaches for
// child_process while the module loads gets an empty result.
function fakeGit(isShallow: string, commitDate: string) {
  return (cmd: string, args: string[] = []) => {
    if (cmd !== "git") return "";
    return args[0] === "rev-parse" ? isShallow : commitDate;
  };
}

// The shallow-checkout check is memoised per module, so each test loads a
// fresh copy of the sitemap.
async function loadSitemap() {
  vi.resetModules();
  return (await import("../sitemap")).default;
}

beforeEach(() => execFileSync.mockReset());

describe("sitemap lastModified", () => {
  it("uses each page's last commit date in a full clone", async () => {
    execFileSync.mockImplementation(
      fakeGit("false\n", "2026-08-14T10:00:00+12:00\n")
    );
    const entries = (await loadSitemap())();
    expect(entries[0].lastModified).toBe("2026-08-14");
  });

  // Render's shallow clone made every page report the deploy date.
  it("omits lastModified in a shallow clone", async () => {
    execFileSync.mockImplementation(
      fakeGit("true\n", "2026-10-09T10:00:00+13:00\n")
    );
    const entries = (await loadSitemap())();
    expect(entries.length).toBeGreaterThan(20);
    expect(entries.every((e) => e.lastModified === undefined)).toBe(true);
  });

  it("falls back to the baseline date when git is unavailable", async () => {
    execFileSync.mockImplementation((cmd: string) => {
      if (cmd === "git") throw new Error("git not found");
      return "";
    });
    const entries = (await loadSitemap())();
    expect(entries[0].lastModified).toBe("2026-05-01");
  });
});
