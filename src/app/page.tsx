import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import { businessConfig } from "@/lib/config";
import { getPortalData } from "@/lib/portal";
import { qrCodeDataUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Votre maison" };

export default async function HomePage() {
  const data = await getPortalData();
  const active = data.orders
    .filter((order) => !["Retirée", "Livrée", "Annulée"].includes(order.status) && order.slotDate >= businessConfig.businessDate)
    .sort((a, b) => a.slotDate.localeCompare(b.slotDate));
  const nextOrder = active[0];
  const qrCode = nextOrder ? await qrCodeDataUrl(`MAISON-ANNOIX|${nextOrder.id}|${nextOrder.pickupCode}`) : undefined;
  return <Dashboard data={data} nextOrder={nextOrder} qrCode={qrCode} />;
}
