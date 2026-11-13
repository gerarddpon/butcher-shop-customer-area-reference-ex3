import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, FileDown, MapPin, PackageCheck, Phone, Snowflake } from "lucide-react";
import { getPortalData } from "@/lib/portal";
import { qrCodeDataUrl } from "@/lib/qr";
import { capitalize, cn, formatDate, formatDateLong, formatMoney, formatTime } from "@/lib/format";
import { BackLink, PageHeader, ProductThumb, Reveal, StatusBadge } from "@/components/ui";
import { OrderActions, PayBalanceButton } from "@/components/order-actions";
import { OrderMessageButton } from "@/components/order-atelier-message";
import { slotCountKey } from "@/lib/slots";
import { Paperclip } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Détail de la commande" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPortalData();
  const order = data.orders.find((item) => item.id === decodeURIComponent(id));
  if (!order) notFound();
  const qr = await qrCodeDataUrl(`MAISON-ANNOIX|${order.id}|${order.pickupCode}`);
  const occupancy: Record<string, number> = {};
  for (const entry of data.orders) {
    if (entry.status === "Annulée") continue;
    const key = slotCountKey(entry.slotDate, entry.slotLabel);
    occupancy[key] = (occupancy[key] ?? 0) + 1;
  }
  const timeline = [
    { label: "Commande reçue", date: formatDate(order.placedAt), done: true },
    { label: "Paiement de l’acompte", date: order.depositCents > 0 ? formatDate(order.placedAt) : "Au retrait", done: order.depositCents > 0 },
    { label: "Confirmée", date: order.status !== "Annulée" ? "Créneau réservé" : "Non confirmée", done: order.status !== "Annulée" },
    { label: order.status, date: `${capitalize(formatDateLong(order.slotDate))}, ${order.slotLabel} · ${order.shop}`, done: !["Confirmée", "Annulée"].includes(order.status), current: !["Retirée", "Livrée", "Annulée"].includes(order.status) },
    { label: "Prête au retrait", date: order.status === "Prête au retrait" ? "Vous pouvez venir au comptoir" : "À venir", done: ["Prête au retrait", "Retirée", "Livrée"].includes(order.status) },
  ];

  return <>
    <BackLink href="/commandes">Retour aux commandes</BackLink>
    <PageHeader title={<h1>Commande {order.id} <StatusBadge status={order.status} /></h1>} description={<>Passée le {formatDate(order.placedAt)} · {order.fulfillment.toLowerCase()} prévu le {formatDateLong(order.slotDate)} ({order.slotLabel})</>} />
    <div className="grid xl:grid-cols-[1.75fr_1fr] gap-4 items-start">
      <div>
        <Reveal><section className="card m-0">
          <div className="grid sm:grid-cols-[1fr_150px] gap-4">
            <div><h2>Votre {order.fulfillment.toLowerCase()}</h2><p className="muted">Détails de votre {order.fulfillment.toLowerCase()}</p><h3 className="capitalize">{formatDateLong(order.slotDate)} ·<br />{order.slotLabel}</h3><p><MapPin size={15} className="inline mr-1" />{order.shop} · Code retrait : <strong>{order.pickupCode}</strong></p><PayBalanceButton order={order} /></div>
            <div className="text-center"><img src={qr} alt={`QR code ${order.pickupCode}`} className="w-[140px] max-w-full mx-auto" /><span className="small">Présenter au comptoir</span></div>
          </div>
        </section></Reveal>

        <Reveal delay={.08}><section className="card mt-4">
          <h2>Ce que contient la commande</h2>
          {order.items.map((item) => <article className="product-row" key={item.key}>
            <ProductThumb src={item.product.image} alt={item.product.name} size={78} />
            <div className="flex-1 min-w-0"><div className="flex justify-between gap-3"><h3 className="m-0">{item.product.name} · {item.quantityLabel}</h3><span className="price">{formatMoney(item.totalCents)}</span></div>
              <div className="grid sm:grid-cols-2 gap-x-4 small mt-1"><span><strong>Origine :</strong> {item.product.origin}</span><span><strong>DLC :</strong> {formatDate(item.dlc)}</span><span><strong>Lot :</strong> {item.lot}</span><span><strong>Allergène :</strong> {item.product.allergens}</span><span><strong>Conservation :</strong> {item.product.conservation}</span><span><strong>Découpe :</strong> {item.notes || "Standard"}</span></div>
              <p className="notice notice-green small mt-2 mb-0"><strong>Conseils de préparation :</strong> {item.product.preparation}</p>
            </div>
          </article>)}
          <div className="max-w-md ml-auto mt-5 space-y-1"><div className="flex justify-between"><span>Total TTC</span><strong>{formatMoney(order.totalCents)}</strong></div><div className="flex justify-between"><span>Dont TVA (5,5 %)</span><span>{formatMoney(order.tvaCents)}</span></div><div className="flex justify-between"><span>Acompte versé</span><span>−{formatMoney(order.depositCents)}</span></div><div className="divider" /><div className="flex justify-between text-xl"><strong>Solde à régler au retrait :</strong><strong>{formatMoney(order.balanceCents)}</strong></div></div>
          <Link href="/compte/factures" className="btn mt-4"><FileDown size={16} />Voir mes documents</Link>
        </section></Reveal>
      </div>

      <aside>
        <Reveal delay={.04}><section className="card m-0"><h2>Suivi de la commande</h2><div className="timeline">{timeline.map((step, index) => <div className={cn("timeline-item", step.done && "timeline-done", step.current && "timeline-current")} key={`${step.label}-${index}`}><span className="timeline-dot">{step.done ? <Check size={16} /> : <PackageCheck size={15} />}</span><div><strong>{step.label}</strong><p className="small m-0">{step.date}</p></div></div>)}</div></section></Reveal>
        <div className="mt-4"><OrderActions order={order} occupancy={occupancy} /></div>
        <Reveal delay={.08}><section className="card mt-4"><h2>Documents</h2><a className="btn w-full mb-2" href={`/api/documents/${order.id}/commande`}><FileDown size={16} />Télécharger le bon de commande (PDF)</a><a className="btn w-full" href={`/api/documents/${order.id}/facture`}><FileDown size={16} />Télécharger la facture d’acompte (PDF)</a></section></Reveal>
        <Reveal delay={.1}><section className="card mt-4"><h2>Messages envoyés pour cette commande</h2>{order.messages.length === 0 ? <p>Aucun message envoyé pour cette commande.</p> : <div className="scroll-area max-h-64 mb-3">{order.messages.map((message) => <div className="notice small mb-2" key={message.id}><strong>{message.author === "client" ? "Vous" : message.author === "system" ? "Suivi automatique" : "L’Atelier"} · {formatDate(message.createdAt)} {formatTime(message.createdAt)}</strong>{message.subject ? <span className="status status-green ml-1">{message.subject}</span> : null}<p className="m-0 mt-1">{message.body}</p>{message.attachment ? <a href={message.attachment.dataUrl} download={message.attachment.name} className="inline-flex items-center gap-1 mt-1 underline text-[#2b0811]"><Paperclip size={13} />{message.attachment.name}</a> : null}</div>)}</div>}<OrderMessageButton order={order} /></section></Reveal>
        <Reveal delay={.12}><section className="card mt-4"><h2>Archives et consignes</h2><p className="small"><Snowflake size={15} className="inline mr-1" /><strong>Rappel des consignes de fraîcheur :</strong> conservez vos produits entre 0 °C et +4 °C.</p><p className="small"><strong>Consigne bac isotherme :</strong> 5,00 € remboursés au retour.</p><Link href="/compte/avoirs" className="text-button">Voir le détail des consignes</Link></section></Reveal>
      </aside>
    </div>
  </>;
}
