import { Cache } from "@/web/price-check/trade/Cache";
import { RateLimiter } from "@/web/price-check/trade/RateLimiter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("borrows and releases capacity", async () => {
    const limiter = new RateLimiter(2, 1);

    await limiter.wait();
    expect(limiter.available).toBe(1);
    expect(limiter.isFullyUtilized).toBe(false);

    await limiter.wait();
    expect(limiter.available).toBe(0);
    expect(limiter.isFullyUtilized).toBe(true);

    await vi.advanceTimersByTimeAsync(1000);
    expect(limiter.available).toBe(2);
  });

  it("queues callers until capacity is released", async () => {
    const limiter = new RateLimiter(1, 1);
    await limiter.wait();

    const queued = limiter.wait();
    expect(limiter.queue.value).toBe(1);

    await vi.advanceTimersByTimeAsync(1000);
    await queued;
    expect(limiter.queue.value).toBe(0);
    expect(limiter.isFullyUtilized).toBe(true);
  });

  it("can wait without borrowing capacity", async () => {
    const limiter = new RateLimiter(1, 1);
    await limiter.wait(false);
    expect(limiter.stack).toHaveLength(0);
  });

  it("waits on multiple available limiters and borrows from each", async () => {
    const first = new RateLimiter(1, 1);
    const second = new RateLimiter(2, 2);

    await RateLimiter.waitMulti([first, second]);

    expect(first.stack).toHaveLength(1);
    expect(second.stack).toHaveLength(1);
  });

  it("estimates queued time with and without current state", async () => {
    const limiter = new RateLimiter(1, 2);
    await limiter.wait();

    expect(RateLimiter.estimateTime(2, [limiter])).toBe(4000);
    expect(RateLimiter.estimateTime(2, [limiter], true)).toBe(2000);
    expect(RateLimiter.estimateTime(0, [limiter])).toBe(0);
  });

  it("compares, formats, and destroys limits", async () => {
    const limiter = new RateLimiter(1, 5);
    expect(limiter.isEqualLimit({ max: 1, window: 5 })).toBe(true);
    expect(limiter.isEqualLimit({ max: 2, window: 5 })).toBe(false);
    expect(limiter.toString()).toBe(
      "RateLimiter<max=1:window=5>: (stack=0,queue=0)",
    );

    limiter.destroy();
    await expect(limiter.wait()).rejects.toThrow(
      "RateLimiter is no longer active",
    );
  });

  it("rejects queued callers when destroyed", async () => {
    const limiter = new RateLimiter(1, 5);
    await limiter.wait();
    const queued = limiter.wait();

    limiter.destroy();

    await expect(queued).rejects.toThrow("RateLimiter is no longer active");
    expect(limiter.stack).toHaveLength(0);
  });
});

describe("Cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("uses stable object keys and expires entries", () => {
    const cache = new Cache();
    cache.set({ query: "test", values: [1, 2] }, "result", 2);

    expect(cache.get({ values: [1, 2], query: "test" })).toBe("result");
    vi.advanceTimersByTime(2000);
    expect(cache.get({ query: "test", values: [1, 2] })).toBeUndefined();
  });

  it("derives a TTL only when rate limits are present", () => {
    expect(Cache.deriveTtl()).toBe(0);
    expect(Cache.deriveTtl(new RateLimiter(1, 1))).toBe(300);
  });
});
