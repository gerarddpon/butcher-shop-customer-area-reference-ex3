import type { Metadata } from "next";
import { ClaimsOverview } from "@/components/claims-overview";
import { getPortalData } from "@/lib/portal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Réclamations & SAV" };

export default async function ClaimsPage() {
  const data = await getPortalData();
  return <ClaimsOverview claims={data.claims} data={data} />;
}
