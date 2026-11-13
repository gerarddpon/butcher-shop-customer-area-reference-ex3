import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { claimMessages, claims } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  try {
    const body = await request.json() as { body?: string };
    const message = String(body.body ?? "").trim();
    if (message.length < 2 || message.length > 1500) return NextResponse.json({ error: "Votre message doit contenir entre 2 et 1 500 caractères." }, { status: 400 });
    const claim = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
    if (!claim[0]) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
    const now = new Date().toISOString();
    await db.insert(claimMessages).values({ claimId: id, author: "client", body: message, createdAt: now });
    if (claim[0].status.includes("Résolu")) {
      await db.update(claims).set({ status: "En cours d’analyse", resolution: "Dossier rouvert à la suite de votre message", updatedAt: now }).where(eq(claims.id, id));
    } else {
      await db.update(claims).set({ updatedAt: now }).where(eq(claims.id, id));
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Le message n’a pas pu être envoyé." }, { status: 500 });
  }
}
