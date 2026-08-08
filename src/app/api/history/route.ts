import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, getClientIdentifier } from "@/lib/rateLimit";
import { historyCreateSchema, validate } from "@/lib/validation";

// GET /api/history — most recent 200 entries for the signed-in user.
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(getClientIdentifier(req, session.user.id), "standard");
  if (!rl.success) return rateLimitResponse(rl);

  const history = await prisma.historyEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ history });
}

// POST /api/history  { type: string, result: string, meta?: string }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(getClientIdentifier(req, session.user.id), "write");
  if (!rl.success) return rateLimitResponse(rl);

  const body = await req.json().catch(() => null);
  const parsed = validate(historyCreateSchema, body);
  if (parsed.error) return parsed.error;

  const entry = await prisma.historyEntry.create({
    data: {
      clientId: randomUUID(),
      type: parsed.data.type,
      result: parsed.data.result,
      meta: parsed.data.meta ?? null,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}

// DELETE /api/history — clears the signed-in user's entire history.
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(getClientIdentifier(req, session.user.id), "write");
  if (!rl.success) return rateLimitResponse(rl);

  await prisma.historyEntry.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
