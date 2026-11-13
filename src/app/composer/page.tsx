import type { Metadata } from "next";
import { OrderComposer } from "@/components/order-composer";
import { getPortalData } from "@/lib/portal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Composer une commande" };

export default async function ComposerPage({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  const [{ produit }, data] = await Promise.all([searchParams, getPortalData()]);
  return <OrderComposer data={data} focusProduct={produit} />;
}
