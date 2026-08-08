import { describe, it, expect } from "vitest";
import {
  itemSchema,
  listCreateSchema,
  historyCreateSchema,
  syncPayloadSchema,
} from "@/lib/validation";

describe("itemSchema", () => {
  it("accepts a minimal valid item and defaults weight to 1", () => {
    const result = itemSchema.safeParse({ id: "a1", text: "Alex" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.weight).toBe(1);
  });

  it("rejects an empty text field", () => {
    const result = itemSchema.safeParse({ id: "a1", text: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive weight", () => {
    const result = itemSchema.safeParse({ id: "a1", text: "Alex", weight: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed color", () => {
    const result = itemSchema.safeParse({ id: "a1", text: "Alex", color: "purple" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid hex color and a null color", () => {
    expect(itemSchema.safeParse({ id: "a1", text: "Alex", color: "#8B6CFF" }).success).toBe(true);
    expect(itemSchema.safeParse({ id: "a1", text: "Alex", color: null }).success).toBe(true);
  });
});

describe("listCreateSchema", () => {
  it("accepts a valid list", () => {
    const result = listCreateSchema.safeParse({
      name: "My list",
      items: [{ id: "1", text: "Alex" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = listCreateSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a non-array items field", () => {
    const result = listCreateSchema.safeParse({ name: "x", items: "not an array" });
    expect(result.success).toBe(false);
  });

  it("rejects more than 5000 items", () => {
    const items = Array.from({ length: 5001 }, (_, i) => ({ id: String(i), text: "x" }));
    const result = listCreateSchema.safeParse({ name: "Huge list", items });
    expect(result.success).toBe(false);
  });

  it("rejects a bad item nested inside an otherwise valid list", () => {
    const result = listCreateSchema.safeParse({
      name: "My list",
      items: [{ id: "1", text: "Alex" }, { id: "2", text: "" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("historyCreateSchema", () => {
  it("accepts a valid entry without meta", () => {
    const result = historyCreateSchema.safeParse({ type: "Coin Flip", result: "Heads" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty result", () => {
    const result = historyCreateSchema.safeParse({ type: "Coin Flip", result: "" });
    expect(result.success).toBe(false);
  });
});

describe("syncPayloadSchema", () => {
  it("accepts an empty sync payload", () => {
    const result = syncPayloadSchema.safeParse({ lists: [], history: [] });
    expect(result.success).toBe(true);
  });

  it("rejects a list missing an id", () => {
    const result = syncPayloadSchema.safeParse({
      lists: [{ name: "x", items: [] }],
      history: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects history entries missing required fields", () => {
    const result = syncPayloadSchema.safeParse({
      lists: [],
      history: [{ id: "h1", type: "Dice Roller" }], // missing `result`
    });
    expect(result.success).toBe(false);
  });

  it("rejects an oversized payload", () => {
    const lists = Array.from({ length: 501 }, (_, i) => ({
      id: String(i),
      name: "x",
      items: [],
    }));
    const result = syncPayloadSchema.safeParse({ lists, history: [] });
    expect(result.success).toBe(false);
  });
});
