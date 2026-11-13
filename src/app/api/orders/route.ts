import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { cartItems, loyaltyEntries, orderItems, orderMessages, orders, products, settings } from "@/db/schema";
import { businessConfig } from "@/lib/config";
import { cartLineTotal, cartQuantityLabel } from "@/lib/cart";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await ensureSeed();
  try {
    const body = await request.json() as { fulfillment?: string; slotDate?: string; slotLabel?: string; usePoints?: boolean; note?: string };
    if (!["Retrait", "Livraison"].includes(body.fulfillment ?? "")) return NextResponse.json({ error: "Choisissez un mode de réception." }, { status: 400 });
    if (!body.slotDate || body.slotDate < businessConfig.businessDate || !body.slotLabel) return NextResponse.json({ error: "Choisissez un créneau valide." }, { status: 400 });
    const cart = await db.select().from(cartItems);
    if (!cart.length) return NextResponse.json({ error: "Votre panier est vide." }, { status: 400 });
    const productRows = await db.select().from(products);
    const productMap = new Map(productRows.map((product) => [product.id, product]));
    const lines = cart.flatMap((line) => { const product = productMap.get(line.productId); return product ? [{ ...line, product, total: cartLineTotal(product, line.quantity) }] : []; });
    if (lines.length !== cart.length) return NextResponse.json({ error: "Un article du panier n’est plus disponible." }, { status: 409 });
    const subtotal = lines.reduce((sum, line) => sum + line.total, 0) + (body.fulfillment === "Livraison" ? 600 : 0);
    let pointsUsed = 0;
    if (body.usePoints) {
      const result = await db.select({ total: sql<number>`coalesce(sum(${loyaltyEntries.points}), 0)::int` }).from(loyaltyEntries);
      pointsUsed = Math.max(0, Math.min(result[0]?.total ?? 0, Math.floor(subtotal / 10)));
    }
    const totalCents = subtotal - pointsUsed * 10;
    const depositCents = Math.round(totalCents * .3);
    const allOrders = await db.select({ id: orders.id }).from(orders);
    const highest = allOrders.reduce((max, row) => Math.max(max, Number(row.id.match(/(\d+)$/)?.[1] ?? 0)), 9000);
    const id = `CMD-${highest + 1}`;
    const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
    const tvaCents = Math.round(totalCents - totalCents / 1.055);
    const dlc = new Date(`${body.slotDate}T12:00:00Z`); dlc.setUTCDate(dlc.getUTCDate() + 3);
    const note = String(body.note ?? "").trim().slice(0, 500);
    await db.transaction(async (tx) => {
      await tx.insert(orders).values({ id, status: "Confirmée", placedAt: businessConfig.businessDate, fulfillment: body.fulfillment!, shop: businessConfig.shop, slotDate: body.slotDate!, slotLabel: body.slotLabel!.slice(0, 40), totalCents, depositCents, tvaCents, balanceCents: totalCents - depositCents, pickupCode: `MA-${highest + 1}-${suffix}`, paymentStatus: businessConfig.paymentMode === "mock" ? "Acompte simulé" : "Acompte versé", note });
      await tx.insert(orderItems).values(lines.map((line) => ({ key: `${id}-${line.productId}`, orderId: id, productId: line.productId, quantityLabel: cartQuantityLabel(line.product, line.quantity), grams: line.product.unit === "kg" ? line.quantity * 500 : 0, unitPriceCents: line.product.priceCents, totalCents: line.total, lot: `AT-${body.slotDate!.replaceAll("-", "").slice(2)}-${line.productId.slice(0, 3).toUpperCase()}`, dlc: dlc.toISOString().slice(0, 10), notes: line.cutNote })));
      if (pointsUsed > 0) await tx.insert(loyaltyEntries).values({ entryKey: `points-${id}`, label: `Utilisés · Commande ${id}`, kind: "redemption", points: -pointsUsed, occurredAt: businessConfig.businessDate, orderId: id });
      await tx.insert(orderMessages).values({ orderId: id, author: "system", body: businessConfig.paymentMode === "mock" ? `Commande créée avec acompte simulé de ${(depositCents / 100).toFixed(2)} €. Aucun débit réel. ${pointsUsed ? `${pointsUsed} points fidélité utilisés.` : ""}` : "Commande confirmée et acompte enregistré.", createdAt: new Date().toISOString() });
      await tx.delete(cartItems);
      await tx.update(settings).set({ applyPoints: false }).where(eq(settings.id, 1));
    });
    return NextResponse.json({ ok: true, id, pointsUsed });
  } catch {
    return NextResponse.json({ error: "La commande n’a pas pu être créée. Votre panier est conservé." }, { status: 500 });
  }
}
