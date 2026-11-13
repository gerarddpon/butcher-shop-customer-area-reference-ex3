import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountManager, type AccountSection } from "@/components/account-manager";
import { getPortalData } from "@/lib/portal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Votre compte" };
const sections: AccountSection[] = ["abonnements", "factures", "paiements", "avoirs", "preferences", "atelier", "favoris", "adresses", "notifications", "securite", "professionnel", "confidentialite", "maison"];

export default async function AccountPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as AccountSection)) notFound();
  const data = await getPortalData();
  return <AccountManager section={section as AccountSection} data={data} />;
}
