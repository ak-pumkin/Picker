import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockDeleteMany = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    historyEntry: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    },
  },
}));

import { GET, POST, DELETE } from "@/app/api/history/route";

function uniqueUserId() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

beforeEach(() => {
  mockAuth.mockReset();
  mockFindMany.mockReset();
  mockCreate.mockReset();
  mockDeleteMany.mockReset();
});

describe("/api/history", () => {
  it("GET returns 401 when signed out", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/history"));
    expect(res.status).toBe(401);
  });

  it("POST rejects a body missing `result`", async () => {
    mockAuth.mockResolvedValue({ user: { id: uniqueUserId() } });
    const res = await POST(
      new Request("http://localhost/api/history", {
        method: "POST",
        body: JSON.stringify({ type: "Dice Roller" }),
      })
    );
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("POST creates an entry for a valid body", async () => {
    const userId = uniqueUserId();
    mockAuth.mockResolvedValue({ user: { id: userId } });
    mockCreate.mockResolvedValue({ id: "h1" });

    const res = await POST(
      new Request("http://localhost/api/history", {
        method: "POST",
        body: JSON.stringify({ type: "Dice Roller", result: "4, 6" }),
      })
    );

    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "Dice Roller", result: "4, 6", userId }),
      })
    );
  });

  it("DELETE clears all history for the signed-in user only", async () => {
    const userId = uniqueUserId();
    mockAuth.mockResolvedValue({ user: { id: userId } });
    mockDeleteMany.mockResolvedValue({ count: 3 });

    const res = await DELETE(new Request("http://localhost/api/history", { method: "DELETE" }));

    expect(res.status).toBe(200);
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { userId } });
  });
});
