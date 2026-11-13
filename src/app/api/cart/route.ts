import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { cartItems, products } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await ensureSeed();
  try {
    const body = await request.json() as { action?: string; productId?: string; quantity?: number; cutNote?: string };
    const action = body.action;
    if (action === "clear") {
      await db.delete(cartItems);
      return NextResponse.json({ ok: true });
    }
    if (!body.productId) return NextResponse.json({ error: "Article manquant." }, { status: 400 });
    const product = await db.select().from(products).where(eq(products.id, body.productId)).limit(1);
    if (!product[0] || !product[0].available) return NextResponse.json({ error: "Cet article n’est pas disponible." }, { status: 404 });
    const cutNote = String(body.cutNote ?? "").trim().slice(0, 240);

    if (action === "remove") {
      await db.delete(cartItems).where(eq(cartItems.productId, body.productId));
      return NextResponse.json({ ok: true });
    }
    const quantity = Math.floor(Number(body.quantity));
    if (!Number.isFinite(quantity)) return NextResponse.json({ error: "Quantité invalide." }, { status: 400 });
    if (action === "update") {
      if (quantity <= 0) {
        await db.delete(cartItems).where(eq(cartItems.productId, body.productId));
      } else {
        if (quantity > 12) return NextResponse.json({ error: "Maximum 12 portions par article." }, { status: 400 });
        await db.insert(cartItems).values({ productId: body.productId, quantity, cutNote }).onConflictDoUpdate({ target: cartItems.productId, set: { quantity, cutNote } });
      }
      return NextResponse.json({ ok: true });
    }
    if (action === "add") {
      if (quantity < 1 || quantity > 12) return NextResponse.json({ error: "Choisissez entre 1 et 12 portions." }, { status: 400 });
      const existing = await db.select().from(cartItems).where(eq(cartItems.productId, body.productId)).limit(1);
      const nextQuantity = Math.min(12, (existing[0]?.quantity ?? 0) + quantity);
      await db.insert(cartItems).values({ productId: body.productId, quantity: nextQuantity, cutNote: cutNote || existing[0]?.cutNote || "" }).onConflictDoUpdate({ target: cartItems.productId, set: { quantity: nextQuantity, cutNote: cutNote || existing[0]?.cutNote || "" } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Action de panier inconnue." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Le panier n’a pas pu être enregistré." }, { status: 500 });
  }
}
