import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { cartItems, orderItems, orderMessages, orders } from "@/db/schema";
import { businessConfig } from "@/lib/config";
import { addDays, dayInfo, PICKUP_TIMES, SLOT_CAPACITY, slotCountKey, slotIsReserved } from "@/lib/slots";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  await ensureSeed();
  const { id } = await context.params;
  const order = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order[0]) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  try {
    const body = await request.json() as {
      action?: string;
      slotDate?: string;
      slotLabel?: string;
      body?: string;
      subject?: string;
      attachment?: { name?: string; type?: string; size?: number; dataUrl?: string } | null;
    };
    const now = new Date().toISOString();
    if (body.action === "pay") {
      if (order[0].balanceCents <= 0) return NextResponse.json({ error: "Cette commande est déjà réglée." }, { status: 400 });
      const label = businessConfig.paymentMode === "mock" ? "Réglé · simulation" : "Réglée";
      await db.update(orders).set({ balanceCents: 0, depositCents: order[0].totalCents, paymentStatus: label }).where(eq(orders.id, id));
      await db.insert(orderMessages).values({ orderId: id, author: "system", body: businessConfig.paymentMode === "mock" ? `Règlement simulé de ${(order[0].balanceCents / 100).toFixed(2)} €. Aucun débit réel n’a été effectué.` : "Règlement du solde confirmé.", createdAt: now });
      return NextResponse.json({ ok: true, mode: businessConfig.paymentMode });
    }
    if (body.action === "slot") {
      if (["Retirée", "Livrée", "Annulée"].includes(order[0].status)) return NextResponse.json({ error: "Le créneau d’une commande terminée ne peut plus être modifié." }, { status: 400 });
      if (!body.slotDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.slotDate) || body.slotDate < addDays(businessConfig.businessDate, 1)) return NextResponse.json({ error: "Choisissez une date de retrait à venir, hors journée en cours." }, { status: 400 });
      if (!body.slotLabel || !PICKUP_TIMES.includes(body.slotLabel)) return NextResponse.json({ error: "Créneau horaire invalide." }, { status: 400 });
      if (dayInfo(body.slotDate).closed) return NextResponse.json({ error: "La boutique est fermée ce jour-là. Choisissez un autre jour." }, { status: 400 });
      if (slotIsReserved(body.slotLabel)) return NextResponse.json({ error: "Ce créneau est réservé à l’Atelier. Choisissez un autre horaire." }, { status: 400 });
      const sameSlotOrders = await db.select({ id: orders.id, slotDate: orders.slotDate, slotLabel: orders.slotLabel, status: orders.status }).from(orders);
      const occupancy = sameSlotOrders.filter((entry) => entry.id !== order[0].id && entry.status !== "Annulée" && slotCountKey(entry.slotDate, entry.slotLabel) === slotCountKey(body.slotDate!, body.slotLabel!)).length;
      if (occupancy >= SLOT_CAPACITY) return NextResponse.json({ error: "Ce créneau vient d’être complet. Choisissez un autre horaire." }, { status: 409 });
      await db.update(orders).set({ slotDate: body.slotDate, slotLabel: body.slotLabel, status: order[0].status === "Pesée" ? "Pesée" : "Confirmée" }).where(eq(orders.id, id));
      await db.insert(orderMessages).values({ orderId: id, author: "system", body: `Créneau modifié : ${body.slotDate}, ${body.slotLabel}.`, createdAt: now });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "cancel") {
      if (["Retirée", "Livrée", "Annulée"].includes(order[0].status)) return NextResponse.json({ error: "Cette commande ne peut plus être annulée en ligne." }, { status: 400 });
      await db.update(orders).set({ status: "Annulée" }).where(eq(orders.id, id));
      await db.insert(orderMessages).values({ orderId: id, author: "system", body: businessConfig.paymentMode === "mock" ? "Commande annulée dans l’environnement de démonstration. Aucun remboursement réel n’est traité." : "Commande annulée. Le comptoir traite le remboursement de l’acompte selon le moyen de paiement initial.", createdAt: now });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "message") {
      const message = String(body.body ?? "").trim();
      const subject = String(body.subject ?? "").trim().slice(0, 120);
      if (subject.length > 0 && subject.length < 3) return NextResponse.json({ error: "Le sujet du message est trop court." }, { status: 400 });
      if (message.length < 2 || message.length > 1000) return NextResponse.json({ error: "Votre message doit contenir entre 2 et 1 000 caractères." }, { status: 400 });
      let attachment = null;
      if (body.attachment) {
        const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowed.includes(String(body.attachment.type)) || !String(body.attachment.dataUrl).startsWith("data:")) {
          return NextResponse.json({ error: "La pièce jointe doit être une image JPEG, PNG, WebP ou un PDF." }, { status: 400 });
        }
        if (Number(body.attachment.size) > 5 * 1024 * 1024) return NextResponse.json({ error: "La pièce jointe dépasse la limite de 5 Mo." }, { status: 400 });
        attachment = {
          name: String(body.attachment.name ?? "piece-jointe").slice(0, 120),
          type: String(body.attachment.type),
          size: Number(body.attachment.size),
          dataUrl: String(body.attachment.dataUrl),
          kind: String(body.attachment.type).startsWith("image/") ? "image" as const : "document" as const,
        };
      }
      await db.insert(orderMessages).values({ orderId: id, author: "client", subject, body: message, attachment, createdAt: now });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "reorder") {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
      if (!items.length) return NextResponse.json({ error: "Aucun article à recommander." }, { status: 400 });
      for (const item of items) {
        const quantity = Math.max(1, Math.min(12, item.grams > 0 ? Math.round(item.grams / 500) : 1));
        const existing = await db.select().from(cartItems).where(eq(cartItems.productId, item.productId)).limit(1);
        const nextQuantity = Math.min(12, (existing[0]?.quantity ?? 0) + quantity);
        await db.insert(cartItems).values({ productId: item.productId, quantity: nextQuantity, cutNote: item.notes }).onConflictDoUpdate({ target: cartItems.productId, set: { quantity: nextQuantity, cutNote: item.notes } });
      }
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "L’action n’a pas pu être enregistrée." }, { status: 500 });
  }
}
