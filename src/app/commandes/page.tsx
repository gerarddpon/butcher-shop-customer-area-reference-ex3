import type { Metadata } from "next";
import { OrdersBrowser } from "@/components/orders-browser";
import { getPortalData } from "@/lib/portal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vos commandes" };

export default async function OrdersPage() {
  const data = await getPortalData();
  return <OrdersBrowser orders={data.orders} />;
}
