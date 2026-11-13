import type { Metadata } from "next";
import { LoyaltyManager } from "@/components/loyalty-manager";
import { getPortalData } from "@/lib/portal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cagnotte" };

export default async function LoyaltyPage() {
  const data = await getPortalData();
  return <LoyaltyManager data={data} />;
}
