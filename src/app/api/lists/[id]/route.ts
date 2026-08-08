import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, getClientIdentifier } from "@/lib/rateLimit";
import { listUpdateSchema, validate } from "@/lib/validation";

async function getOwnedList(id: string, userId: string) {
  const list = await prisma.list.findUnique({ where: { id } });
  if (!list || list.userId !== userId) return null;
  return list;
}

// PUT /api/lists/:id  { name?: string, items?: Array<...> }
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(getClientIdentifier(req, session.user.id), "write");
  if (!rl.success) return rateLimitResponse(rl);

  const existing = await getOwnedList(params.id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = validate(listUpdateSchema, body);
  if (parsed.error) return parsed.error;

  const list = await prisma.list.update({
    where: { id: params.id },
    data: {
      name: parsed.data.name ?? existing.name,
      items: parsed.data.items ?? (existing.items as any),
    },
  });

  return NextResponse.json({ list });
}

// DELETE /api/lists/:id
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(getClientIdentifier(req, session.user.id), "write");
  if (!rl.success) return rateLimitResponse(rl);

  const existing = await getOwnedList(params.id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.list.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
