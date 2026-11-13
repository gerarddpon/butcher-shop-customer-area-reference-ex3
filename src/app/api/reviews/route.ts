import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { loyaltyEntries, orderItems, reviews } from "@/db/schema";
import { businessConfig } from "@/lib/config";

export const dynamic = "force-dynamic";
const allowedCriteria = ["Qualité de la découpe", "Fraîcheur & conservation", "Tendreté / Maturation", "Préférences respectées", "Conseils de cuisson", "Conditionnement"];

export async function POST(request: Request) {
  await ensureSeed();
  try {
    const body = await request.json() as { reviewId?: number; orderItemKey?: string; rating?: number; criteria?: string[]; comment?: string; anonymous?: boolean };
    const rating = Number(body.rating);
    if (!body.orderItemKey || !Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Choisissez une note globale entre 1 et 5 étoiles." }, { status: 400 });
    const item = await db.select().from(orderItems).where(eq(orderItems.key, body.orderItemKey)).limit(1);
    if (!item[0]) return NextResponse.json({ error: "Article à évaluer introuvable." }, { status: 404 });
    const criteria = Array.isArray(body.criteria) ? body.criteria.filter((criterion) => allowedCriteria.includes(criterion)).slice(0, 6) : [];
    const comment = String(body.comment ?? "").trim().slice(0, 1000);
    if (body.reviewId) {
      const existing = await db.select().from(reviews).where(eq(reviews.id, body.reviewId)).limit(1);
      if (!existing[0] || existing[0].orderItemKey !== item[0].key) return NextResponse.json({ error: "Avis introuvable." }, { status: 404 });
      await db.update(reviews).set({ rating, criteria, comment, anonymous: Boolean(body.anonymous) }).where(eq(reviews.id, body.reviewId));
      return NextResponse.json({ ok: true, id: body.reviewId, pointsAwarded: 0 });
    }
    const duplicate = await db.select({ id: reviews.id }).from(reviews).where(eq(reviews.orderItemKey, item[0].key)).limit(1);
    if (duplicate[0]) return NextResponse.json({ error: "Cet article a déjà été évalué. Modifiez votre avis publié." }, { status: 409 });
    const inserted = await db.insert(reviews).values({ orderItemKey: item[0].key, rating, criteria, comment, anonymous: Boolean(body.anonymous), publishedAt: new Date().toISOString().slice(0, 10), atelierReply: null, replyDate: null }).returning({ id: reviews.id });
    await db.insert(loyaltyEntries).values({ entryKey: `review-${inserted[0].id}`, label: "Gagnés · Avis vérifié publié", kind: "review", points: businessConfig.reviewPoints, occurredAt: new Date().toISOString().slice(0, 10), orderId: item[0].orderId, reviewId: inserted[0].id });
    return NextResponse.json({ ok: true, id: inserted[0].id, pointsAwarded: businessConfig.reviewPoints });
  } catch {
    return NextResponse.json({ error: "Votre avis n’a pas pu être publié." }, { status: 500 });
  }
}
