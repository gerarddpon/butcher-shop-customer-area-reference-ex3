import { NextResponse } from "next/server";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { professionalQuotes } from "@/db/schema";
import { businessConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await ensureSeed();
  try {
    const body = await request.json() as { subject?: string; details?: string; headcount?: number; eventDate?: string };
    const subject = String(body.subject ?? "").trim().slice(0, 180);
    const details = String(body.details ?? "").trim().slice(0, 1500);
    const headcount = Math.max(1, Math.min(5000, Math.floor(Number(body.headcount ?? 0))));
    const eventDate = String(body.eventDate ?? "");
    if (subject.length < 3) return NextResponse.json({ error: "Donnez un intitulé à votre devis." }, { status: 400 });
    if (details.length < 20) return NextResponse.json({ error: "Décrivez votre besoin en au moins 20 caractères." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || eventDate < businessConfig.businessDate) return NextResponse.json({ error: "Choisissez une date d’événement valide." }, { status: 400 });
    const existing = await db.select({ id: professionalQuotes.id }).from(professionalQuotes);
    const highest = existing.reduce((max, row) => Math.max(max, Number(row.id.match(/(\d+)$/)?.[1] ?? 0)), 0);
    const id = `DEV-${new Date().getUTCFullYear()}-${String(highest + 1).padStart(2, "0")}`;
    await db.insert(professionalQuotes).values({ id, subject, details, headcount, eventDate, status: "Demande envoyée", totalCents: 0, createdAt: new Date().toISOString().slice(0, 10) });
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ error: "La demande de devis n’a pas pu être enregistrée." }, { status: 500 });
  }
}
