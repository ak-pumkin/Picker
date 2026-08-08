import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, getClientIdentifier } from "@/lib/rateLimit";
import { listCreateSchema, validate } from "@/lib/validation";

// GET /api/lists — every saved list belonging to the signed-in user.
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(getClientIdentifier(req, session.user.id), "standard");
  if (!rl.success) return rateLimitResponse(rl);

  const lists = await prisma.list.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ lists });
}

// POST /api/lists  { name: string, items: Array<{id,text,weight,color}> }
// Creates a list directly (outside the bulk /api/sync flow) — gets its own
// server-generated clientId since the caller isn't required to supply one.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(getClientIdentifier(req, session.user.id), "write");
  if (!rl.success) return rateLimitResponse(rl);

  const body = await req.json().catch(() => null);
  const parsed = validate(listCreateSchema, body);
  if (parsed.error) return parsed.error;

  const list = await prisma.list.create({
    data: {
      clientId: randomUUID(),
      name: parsed.data.name,
      items: parsed.data.items,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ list }, { status: 201 });
}
