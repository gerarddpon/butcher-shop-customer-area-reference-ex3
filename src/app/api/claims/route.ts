import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { claimMessages, claims, orderItems, orders, type ClaimPhoto } from "@/db/schema";
import { businessConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await ensureSeed();
  try {
    const body = await request.json() as { orderId?: string; orderItemKey?: string; motif?: string; description?: string; quantity?: string; photos?: ClaimPhoto[]; desiredResolution?: string };
    if (!body.orderId || !body.orderItemKey) return NextResponse.json({ error: "Sélectionnez une commande et un article." }, { status: 400 });
    const order = await db.select().from(orders).where(eq(orders.id, body.orderId)).limit(1);
    const item = await db.select().from(orderItems).where(eq(orderItems.key, body.orderItemKey)).limit(1);
    if (!order[0] || !item[0] || item[0].orderId !== order[0].id) return NextResponse.json({ error: "Cet article n’appartient pas à la commande sélectionnée." }, { status: 400 });
    const allowedMotifs = ["Article manquant", "Erreur de découpe", "Poids incorrect", "Problème fraîcheur", "Problème conditionnement", "Autre"];
    if (!body.motif || !allowedMotifs.includes(body.motif)) return NextResponse.json({ error: "Choisissez un type de problème." }, { status: 400 });
    const description = String(body.description ?? "").trim();
    if (description.length < 20 || description.length > 1000) return NextResponse.json({ error: "Décrivez la situation en 20 à 1 000 caractères." }, { status: 400 });
    const quantity = String(body.quantity ?? "").trim().slice(0, 60);
    if (!quantity) return NextResponse.json({ error: "Indiquez le poids ou la quantité concernée." }, { status: 400 });
    const existing = await db.select().from(claims).where(eq(claims.orderItemKey, item[0].key));
    const open = existing.find((claim) => !claim.status.includes("Résolu"));
    if (open) return NextResponse.json({ error: `Le dossier ${open.id} est déjà ouvert pour cet article. Retrouvez-le dans vos réclamations.` }, { status: 409 });
    const photos = Array.isArray(body.photos) ? body.photos : [];
    if (photos.length > businessConfig.maxClaimPhotos) return NextResponse.json({ error: `Maximum ${businessConfig.maxClaimPhotos} photos.` }, { status: 400 });
    for (const photo of photos) {
      if (!photo || !["image/jpeg", "image/png", "image/webp"].includes(photo.type) || photo.size > businessConfig.maxClaimPhotoBytes || !String(photo.dataUrl).startsWith("data:image/")) return NextResponse.json({ error: "Chaque photo doit être un JPEG, PNG ou WebP de 5 Mo maximum." }, { status: 400 });
    }
    if (body.motif === "Problème fraîcheur" && photos.length === 0) return NextResponse.json({ error: "Ajoutez au moins une photo pour une demande de garantie fraîcheur." }, { status: 400 });
    const allClaims = await db.select({ id: claims.id }).from(claims);
    const highest = allClaims.reduce((max, row) => Math.max(max, Number(row.id.match(/(\d+)$/)?.[1] ?? 0)), 0);
    const id = `SAV-${new Date().getUTCFullYear()}-${String(highest + 1).padStart(3, "0")}`;
    const now = new Date().toISOString();
    const desired = ["Avoir dans ma cagnotte", "Remplacement au prochain retrait", "Conseil de l’Atelier"].includes(body.desiredResolution ?? "") ? body.desiredResolution! : "Avoir dans ma cagnotte";
    await db.insert(claims).values({ id, orderId: order[0].id, orderItemKey: item[0].key, motif: body.motif, description, quantity, status: "Dossier reçu", resolution: `En attente · ${desired}`, creditCents: 0, createdAt: now, updatedAt: now, photos });
    await db.insert(claimMessages).values({ claimId: id, author: "client", body: description, attachment: photos[0]?.name ?? null, createdAt: now });
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ error: "Le dossier n’a pas pu être créé. Vos informations n’ont pas été perdues : réessayez." }, { status: 500 });
  }
}
