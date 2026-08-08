import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, getClientIdentifier } from "@/lib/rateLimit";
import { syncPayloadSchema, validate } from "@/lib/validation";

// GET /api/sync — everything the signed-in user has saved, in the shape the
// frontend already understands (so it can merge straight into local state).
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(getClientIdentifier(req, session.user.id), "standard");
  if (!rl.success) return rateLimitResponse(rl);

  const [lists, history] = await Promise.all([
    prisma.list.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.historyEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return NextResponse.json({
    lists: lists.map((l) => ({
      id: l.clientId,
      name: l.name,
      items: l.items,
      createdAt: l.createdAt.getTime(),
    })),
    history: history.map((h) => ({
      id: h.clientId,
      type: h.type,
      result: h.result,
      meta: h.meta ?? "",
      ts: h.createdAt.getTime(),
    })),
  });
}

// POST /api/sync  { lists: [...], history: [...] }
// Full-replace sync for lists (simple, correct for one person's own small
// dataset), append/upsert for history (append-only from the client's POV).
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sync fires on every save (debounced client-side to 1.5s), so it gets
  // its own generous-but-bounded limit rather than sharing the strict
  // "write" bucket meant for deliberate one-off actions.
  const rl = await checkRateLimit(getClientIdentifier(req, session.user.id), "standard");
  if (!rl.success) return rateLimitResponse(rl);

  const body = await req.json().catch(() => null);
  const parsed = validate(syncPayloadSchema, body);
  if (parsed.error) return parsed.error;

  const userId = session.user.id;
  const { lists, history } = parsed.data;

  await prisma.$transaction([
    prisma.list.deleteMany({ where: { userId } }),
    ...(lists.length
      ? [
          prisma.list.createMany({
            data: lists.map((l) => ({
              clientId: l.id,
              name: l.name,
              items: l.items,
              userId,
            })),
          }),
        ]
      : []),
  ]);

  for (const h of history) {
    await prisma.historyEntry.upsert({
      where: { userId_clientId: { userId, clientId: h.id } },
      update: {},
      create: {
        clientId: h.id,
        type: h.type,
        result: h.result,
        meta: h.meta ?? null,
        userId,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
