import { NextResponse } from "next/server";
import { getPortalData } from "@/lib/portal";
import { customer } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getPortalData();
  const payload = {
    exportedAt: new Date().toISOString(),
    customer,
    orders: data.orders,
    claims: data.claims.map((claim) => ({ ...claim, photos: claim.photos.map((photo) => ({ ...photo, dataUrl: "[contenu image non dupliqué dans cet export]" })) })),
    reviews: data.reviews,
    loyalty: data.loyalty,
    vouchers: data.vouchers,
    subscriptions: data.subscriptions,
    preferences: data.settings,
  };
  return new NextResponse(JSON.stringify(payload, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="maison-annoix-donnees-marie-dupont.json"`, "Cache-Control": "private, no-store" } });
}
