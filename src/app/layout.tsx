import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/barlow-condensed/400.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "./globals.css";
import { getPortalData } from "@/lib/portal";
import { PortalProvider, type SearchRecord } from "@/components/portal-provider";
import { PortalShell } from "@/components/portal-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Espace client · Maison Annoix", template: "%s · Maison Annoix" },
  description: "Commandes, retraits, traçabilité, réclamations et fidélité de votre boucher Maison Annoix à Sannois.",
};

export const viewport: Viewport = {
  themeColor: "#f3efe3",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const data = await getPortalData();
  const staticLinks: SearchRecord[] = [
    { kind: "Service", title: "Composer une commande", subtitle: "Choisir les pièces, les quantités et le créneau de retrait", href: "/composer", keywords: "boutique étal panier acheter" },
    { kind: "Service", title: "Ouvrir une réclamation", subtitle: "Signaler un article, un poids ou une fraîcheur", href: "/reclamations/nouvelle", keywords: "aide sav problème fraîcheur" },
    { kind: "Service", title: "Ma cagnotte", subtitle: "Points fidélité, bons et cartes-cadeaux", href: "/cagnotte", keywords: "avoir points fidélité bon" },
    { kind: "Service", title: "Mes documents", subtitle: "Factures et bons de commande PDF", href: "/compte/factures", keywords: "facture paiement pdf" },
  ];
  const searchIndex: SearchRecord[] = [
    ...staticLinks,
    ...data.products.map((product) => ({ kind: "Produit", title: product.name, subtitle: `${product.category} · ${product.origin}`, href: `/composer?produit=${product.id}`, keywords: `${product.id} ${product.description}` })),
    ...data.orders.map((order) => ({ kind: "Commande", title: order.id, subtitle: `${order.status} · ${order.items.map((item) => item.product.name).join(", ")}`, href: `/commandes/${order.id}`, keywords: order.items.map((item) => `${item.lot} ${item.product.name}`).join(" ") })),
    ...data.claims.map((claim) => ({ kind: "SAV", title: claim.id, subtitle: `${claim.motif} · ${claim.item.product.name}`, href: `/reclamations/${claim.id}`, keywords: `${claim.status} ${claim.item.lot} ${claim.orderId}` })),
    ...data.professionalQuotes.map((quote) => ({ kind: "Devis", title: quote.id, subtitle: `${quote.subject} · ${quote.status}`, href: "/compte/professionnel", keywords: `${quote.headcount} convives ${quote.details}` })),
  ];

  return (
    <html lang="fr">
      <body>
        <PortalProvider initialCart={data.cart} initialComfort={data.settings.comfort} initialFavorites={data.settings.favoriteProductIds} searchIndex={searchIndex}>
          <PortalShell orderCount={data.orders.length} notificationCount={data.claims.filter((claim) => !claim.status.includes("Résolu")).length}>{children}</PortalShell>
        </PortalProvider>
      </body>
    </html>
  );
}
