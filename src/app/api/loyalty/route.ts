import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { loyaltyEntries, vouchers } from "@/db/schema";
import { businessConfig } from "@/lib/config";

export const dynamic = "force-dynamic";
const demoGiftCards: Record<string, number> = { "MAISON-25-2026": 2500, "MAISON-50-2026": 5000 };

export async function POST(request: Request) {
  await ensureSeed();
  try {
    const body = await request.json() as { action?: string; code?: string };
    if (body.action === "convert") {
      const result = await db.select({ total: sql<number>`coalesce(sum(${loyaltyEntries.points}), 0)::int` }).from(loyaltyEntries);
      if ((result[0]?.total ?? 0) < 100) return NextResponse.json({ error: "Il faut au moins 100 points pour créer un bon de 10 €." }, { status: 400 });
      const id = `BD-10-${Date.now().toString().slice(-8)}`;
      const expiry = new Date(`${businessConfig.businessDate}T12:00:00Z`); expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);
      await db.transaction(async (tx) => {
        await tx.insert(vouchers).values({ id, label: "Bon d’achat 10 €", kind: "Bon d’achat", valueCents: 1000, expiresAt: expiry.toISOString().slice(0, 10), status: "Actif" });
        await tx.insert(loyaltyEntries).values({ entryKey: `conversion-${id}`, label: "Convertis · Bon d’achat 10 €", kind: "conversion", points: -100, occurredAt: businessConfig.businessDate, orderId: null });
      });
      return NextResponse.json({ ok: true, id });
    }
    if (body.action === "activate") {
      if (process.env.GIFT_CARD_MODE !== "mock" && process.env.GIFT_CARD_MODE) return NextResponse.json({ error: "Le service de cartes-cadeaux externe n’est pas configuré." }, { status: 503 });
      const code = String(body.code ?? "").trim().toUpperCase();
      const value = demoGiftCards[code];
      if (!value) return NextResponse.json({ error: "Code inconnu. En démonstration, utilisez MAISON-25-2026 ou MAISON-50-2026." }, { status: 400 });
      const existing = await db.select().from(vouchers);
      if (existing.some((voucher) => voucher.id === code)) return NextResponse.json({ error: "Cette carte-cadeau a déjà été activée." }, { status: 409 });
      const expiry = new Date(`${businessConfig.businessDate}T12:00:00Z`); expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);
      await db.insert(vouchers).values({ id: code, label: `Carte-cadeau ${value / 100} €`, kind: "Carte-cadeau", valueCents: value, expiresAt: expiry.toISOString().slice(0, 10), status: "Actif" });
      return NextResponse.json({ ok: true, id: code });
    }
    return NextResponse.json({ error: "Action de fidélité inconnue." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "L’opération n’a pas pu être enregistrée." }, { status: 500 });
  }
}
