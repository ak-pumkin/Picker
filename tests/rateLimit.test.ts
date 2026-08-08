import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rateLimit";

// No UPSTASH_* env vars are set in the test environment, so these exercise
// the in-memory fallback path. Each test uses a unique identifier so the
// shared in-process store doesn't leak state between tests.
function uniqueId(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

describe("checkRateLimit (in-memory fallback)", () => {
  it("allows requests under the limit", async () => {
    const id = uniqueId("standard");
    const result = await checkRateLimit(id, "standard");
    expect(result.success).toBe(true);
  });

  it("blocks requests once the write limit (20/min) is exceeded", async () => {
    const id = uniqueId("write");
    let lastResult;
    for (let i = 0; i < 25; i++) {
      lastResult = await checkRateLimit(id, "write");
    }
    expect(lastResult!.success).toBe(false);
  });

  it("tracks separate identifiers independently", async () => {
    const idA = uniqueId("a");
    const idB = uniqueId("b");
    for (let i = 0; i < 20; i++) await checkRateLimit(idA, "write");
    const resultA = await checkRateLimit(idA, "write");
    const resultB = await checkRateLimit(idB, "write");
    expect(resultA.success).toBe(false);
    expect(resultB.success).toBe(true);
  });

  it("has a higher limit for 'standard' than 'write'", async () => {
    const id = uniqueId("std-vs-write");
    let lastResult;
    // 25 requests would exceed "write" (20) but not "standard" (60).
    for (let i = 0; i < 25; i++) {
      lastResult = await checkRateLimit(id, "standard");
    }
    expect(lastResult!.success).toBe(true);
  });
});
