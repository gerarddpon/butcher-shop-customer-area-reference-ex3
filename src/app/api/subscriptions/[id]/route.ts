import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { subscriptions } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const body = await request.json() as { status?: string };
  if (!body.status || !["Actif", "En pause", "Annulé"].includes(body.status)) return NextResponse.json({ error: "Statut d’abonnement invalide." }, { status: 400 });
  const updated = await db.update(subscriptions).set({ status: body.status }).where(eq(subscriptions.id, id)).returning({ id: subscriptions.id });
  if (!updated[0]) return NextResponse.json({ error: "Abonnement introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
