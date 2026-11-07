/**
 * The start-up image warm has to fire on Render after every boot and nowhere
 * else. These pin the decision table and the plumbing: what it probes before
 * starting, what it spawns, and that a refused lock or a dead local server
 * means no spawn at all.
 */
import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import {
  acquireWarmLock,
  localBaseUrl,
  shouldWarmOnStart,
  startImageWarm,
} from "../warm-images-on-start";
import { mkdtempSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const logger = () => ({ info: vi.fn(), warn: vi.fn() });

describe("shouldWarmOnStart", () => {
  it("warms on a Render production server", () => {
    expect(shouldWarmOnStart({ NODE_ENV: "production", RENDER: "true" })).toBe(true);
  });

  it("stays quiet locally, in CI and in dev", () => {
    expect(shouldWarmOnStart({ NODE_ENV: "production" })).toBe(false);
    expect(shouldWarmOnStart({ NODE_ENV: "development", RENDER: "true" })).toBe(false);
    expect(shouldWarmOnStart({ NODE_ENV: "test" })).toBe(false);
  });

  it("never runs inside next build, even on Render", () => {
    expect(
      shouldWarmOnStart({
        NODE_ENV: "production",
        RENDER: "true",
        NEXT_PHASE: "phase-production-build",
      })
    ).toBe(false);
  });

  it("honours the explicit override both ways", () => {
    expect(shouldWarmOnStart({ NODE_ENV: "development", WARM_IMAGES_ON_START: "true" })).toBe(
      true
    );
    expect(
      shouldWarmOnStart({ NODE_ENV: "production", RENDER: "true", WARM_IMAGES_ON_START: "false" })
    ).toBe(false);
  });
});

describe("localBaseUrl", () => {
  it("targets the instance's own port, never the public host", () => {
    expect(localBaseUrl({ PORT: "10000" })).toBe("http://127.0.0.1:10000");
    expect(localBaseUrl({})).toBe("http://127.0.0.1:3000");
  });
});

describe("acquireWarmLock", () => {
  it("grants once per boot and refuses a fresh duplicate", () => {
    const lock = join(mkdtempSync(join(tmpdir(), "warm-lock-")), "lock");
    expect(acquireWarmLock(lock)).toBe(true);
    expect(acquireWarmLock(lock)).toBe(false);
  });

  it("grants again once the previous lock is stale", () => {
    const lock = join(mkdtempSync(join(tmpdir(), "warm-lock-")), "lock");
    expect(acquireWarmLock(lock)).toBe(true);
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000);
    utimesSync(lock, old, old);
    expect(acquireWarmLock(lock)).toBe(true);
  });
});

function fakeChild() {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    unref: () => void;
  };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.unref = vi.fn();
  return child;
}

describe("startImageWarm", () => {
  const env = { NODE_ENV: "production", RENDER: "true", PORT: "10000" };

  it("probes local health, then runs the script against the local port", async () => {
    const fetchImpl = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(() =>
      Promise.resolve(new Response("ok", { status: 200 }))
    );
    const child = fakeChild();
    const spawnImpl = vi.fn(() => child);
    const log = logger();

    const result = await startImageWarm({
      env,
      logger: log,
      scriptPath: "/app/scripts/warm-image-cache.mjs",
      cwd: "/app",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      spawnImpl: spawnImpl as never,
      acquireLock: () => true,
    });

    expect(result).toBe("started");
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("http://127.0.0.1:10000/api/health");
    const [bin, args, opts] = spawnImpl.mock.calls[0] as unknown as [
      string,
      string[],
      { cwd: string; env: Record<string, string> },
    ];
    expect(bin).toBe(process.execPath);
    expect(args).toEqual(["/app/scripts/warm-image-cache.mjs"]);
    expect(opts.cwd).toBe("/app");
    expect(opts.env.BASE_URL).toBe("http://127.0.0.1:10000");
    expect(child.unref).toHaveBeenCalled();

    child.stdout.emit("data", Buffer.from("  done. ok=516 failed=0\n"));
    child.emit("exit", 0);
    expect(log.info).toHaveBeenCalledWith("[warm-images]   done. ok=516 failed=0".replace(/\s+/g, " "));
    expect(log.info).toHaveBeenCalledWith("[warm-images] warm finished");
  });

  it("does not spawn when the local server is not answering", async () => {
    const spawnImpl = vi.fn();
    const result = await startImageWarm({
      env,
      logger: logger(),
      scriptPath: "x",
      cwd: "/app",
      fetchImpl: (async () => {
        throw new Error("ECONNREFUSED");
      }) as unknown as typeof fetch,
      spawnImpl: spawnImpl as never,
      acquireLock: () => true,
    });
    expect(result).toBe("skipped");
    expect(spawnImpl).not.toHaveBeenCalled();
  });

  it("does not spawn when another warm holds the lock", async () => {
    const spawnImpl = vi.fn();
    const result = await startImageWarm({
      env,
      logger: logger(),
      scriptPath: "x",
      cwd: "/app",
      fetchImpl: (async () => new Response("ok")) as unknown as typeof fetch,
      spawnImpl: spawnImpl as never,
      acquireLock: () => false,
    });
    expect(result).toBe("skipped");
    expect(spawnImpl).not.toHaveBeenCalled();
  });
});
