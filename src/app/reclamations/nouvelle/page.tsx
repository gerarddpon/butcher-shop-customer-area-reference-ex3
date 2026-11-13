import type { Metadata } from "next";
import { ClaimWizard } from "@/components/claim-wizard";
import { getPortalData } from "@/lib/portal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nouvelle réclamation" };

export default async function NewClaimPage({ searchParams }: { searchParams: Promise<{ commande?: string }> }) {
  const [{ commande }, data] = await Promise.all([searchParams, getPortalData()]);
  const openItemKeys = data.claims.filter((claim) => !claim.status.includes("Résolu")).map((claim) => claim.orderItemKey);
  return <ClaimWizard orders={data.orders.filter((order) => order.items.length > 0 && order.status !== "Annulée")} initialOrderId={commande} openItemKeys={openItemKeys} />;
}
