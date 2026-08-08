import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    list: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

import { GET, POST } from "@/app/api/lists/route";

function uniqueUserId() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

beforeEach(() => {
  mockAuth.mockReset();
  mockFindMany.mockReset();
  mockCreate.mockReset();
});

describe("GET /api/lists", () => {
  it("returns 401 when signed out", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/lists"));
    expect(res.status).toBe(401);
  });

  it("returns the signed-in user's lists", async () => {
    const userId = uniqueUserId();
    mockAuth.mockResolvedValue({ user: { id: userId } });
    mockFindMany.mockResolvedValue([{ id: "l1", name: "Team A", items: [] }]);

    const res = await GET(new Request("http://localhost/api/lists"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.lists).toHaveLength(1);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId } })
    );
  });
});

describe("POST /api/lists", () => {
  it("returns 401 when signed out", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(
      new Request("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: "x", items: [] }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid body instead of touching the database", async () => {
    mockAuth.mockResolvedValue({ user: { id: uniqueUserId() } });

    const res = await POST(
      new Request("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({ items: [] }), // missing `name`
      })
    );

    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.error).toBe("Invalid request body");
  });

  it("creates a list for a valid body", async () => {
    const userId = uniqueUserId();
    mockAuth.mockResolvedValue({ user: { id: userId } });
    mockCreate.mockResolvedValue({ id: "l1", name: "Team A", items: [] });

    const res = await POST(
      new Request("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({
          name: "Team A",
          items: [{ id: "1", text: "Alex" }],
        }),
      })
    );

    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Team A", userId }),
      })
    );
  });

  it("rejects an item with empty text nested in the list", async () => {
    mockAuth.mockResolvedValue({ user: { id: uniqueUserId() } });

    const res = await POST(
      new Request("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({
          name: "Team A",
          items: [{ id: "1", text: "" }],
        }),
      })
    );

    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
