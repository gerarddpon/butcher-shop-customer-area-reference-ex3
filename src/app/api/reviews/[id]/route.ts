import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { loyaltyEntries, reviews } from "@/db/schema";
import { businessConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeed();
  const { id } = await params;
  const reviewId = Number(id);
  if (!Number.isInteger(reviewId)) return NextResponse.json({ error: "Avis invalide." }, { status: 400 });
  const review = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!review[0]) return NextResponse.json({ error: "Avis introuvable." }, { status: 404 });
  await db.delete(reviews).where(eq(reviews.id, reviewId));
  await db.insert(loyaltyEntries).values({ entryKey: `review-delete-${reviewId}-${Date.now()}`, label: "Retrait · Avis supprimé", kind: "adjustment", points: -businessConfig.reviewPoints, occurredAt: new Date().toISOString().slice(0, 10), orderId: null, reviewId });
  return NextResponse.json({ ok: true });
}
