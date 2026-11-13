import type { Metadata } from "next";
import { ReviewsManager } from "@/components/reviews-manager";
import { getPortalData } from "@/lib/portal";
import { businessConfig } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes avis" };

export default async function ReviewsPage() {
  const data = await getPortalData();
  const cutoff = new Date(`${businessConfig.businessDate}T12:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 45);
  const openClaimItems = data.claims.filter((claim) => !claim.status.includes("Résolu")).map((claim) => claim.orderItemKey);
  const pending = data.orders
    .filter((order) => ["Retirée", "Livrée", "En préparation"].includes(order.status) && order.slotDate >= cutoff.toISOString().slice(0, 10))
    .flatMap((order) => order.items
      .filter((item) => item.key !== "9001-carte" && !data.reviews.some((review) => review.orderItemKey === item.key) && !openClaimItems.includes(item.key))
      .map((item) => ({ item, order })));
  return <ReviewsManager reviews={data.reviews} pending={pending} />;
}
