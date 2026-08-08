import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, getClientIdentifier } from "@/lib/rateLimit";

// DELETE /api/history/:id — remove one history entry.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(getClientIdentifier(req, session.user.id), "write");
  if (!rl.success) return rateLimitResponse(rl);

  const existing = await prisma.historyEntry.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.historyEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
