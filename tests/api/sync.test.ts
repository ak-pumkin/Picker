import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockTransaction = vi.fn().mockResolvedValue(undefined);
const mockDeleteMany = vi.fn();
const mockCreateMany = vi.fn();
const mockUpsert = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    list: {
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
      createMany: (...args: unknown[]) => mockCreateMany(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    historyEntry: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import { GET, POST } from "@/app/api/sync/route";

function uniqueUserId() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

beforeEach(() => {
  mockAuth.mockReset();
  mockTransaction.mockClear();
  mockDeleteMany.mockReset();
  mockCreateMany.mockReset();
  mockUpsert.mockReset();
  mockFindMany.mockReset();
});

describe("GET /api/sync", () => {
  it("returns 401 when signed out", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/sync"));
    expect(res.status).toBe(401);
  });

  it("maps server rows back to the client's id/ts shape", async () => {
    mockAuth.mockResolvedValue({ user: { id: uniqueUserId() } });
    mockFindMany
      .mockResolvedValueOnce([
        { clientId: "l1", name: "Team A", items: [], createdAt: new Date(1000) },
      ])
      .mockResolvedValueOnce([
        {
          clientId: "h1",
          type: "Coin Flip",
          result: "Heads",
          meta: null,
          createdAt: new Date(2000),
        },
      ]);

    const res = await GET(new Request("http://localhost/api/sync"));
    const body = await res.json();

    expect(body.lists[0]).toEqual({ id: "l1", name: "Team A", items: [], createdAt: 1000 });
    expect(body.history[0]).toMatchObject({ id: "h1", type: "Coin Flip", result: "Heads" });
  });
});

describe("POST /api/sync", () => {
  it("returns 401 when signed out", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/sync", {
        method: "POST",
        body: JSON.stringify({ lists: [], history: [] }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 and never touches the database for a malformed payload", async () => {
    mockAuth.mockResolvedValue({ user: { id: uniqueUserId() } });

    const res = await POST(
      new Request("http://localhost/api/sync", {
        method: "POST",
        body: JSON.stringify({ lists: "not an array", history: [] }),
      })
    );

    expect(res.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("replaces lists and upserts history for a valid payload", async () => {
    const userId = uniqueUserId();
    mockAuth.mockResolvedValue({ user: { id: userId } });
    mockUpsert.mockResolvedValue({});

    const res = await POST(
      new Request("http://localhost/api/sync", {
        method: "POST",
        body: JSON.stringify({
          lists: [{ id: "l1", name: "Team A", items: [{ id: "1", text: "Alex" }] }],
          history: [{ id: "h1", type: "Coin Flip", result: "Heads" }],
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_clientId: { userId, clientId: "h1" } },
      })
    );
  });

  it("rejects a history entry with an empty result", async () => {
    mockAuth.mockResolvedValue({ user: { id: uniqueUserId() } });

    const res = await POST(
      new Request("http://localhost/api/sync", {
        method: "POST",
        body: JSON.stringify({
          lists: [],
          history: [{ id: "h1", type: "Coin Flip", result: "" }],
        }),
      })
    );

    expect(res.status).toBe(400);
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
