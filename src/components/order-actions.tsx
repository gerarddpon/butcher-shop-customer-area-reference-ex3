"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, MessageSquareText, Phone, X } from "lucide-react";
import type { DetailedOrder } from "@/lib/portal";
import { businessConfig } from "@/lib/config";
import { formatDateLong, formatMoney } from "@/lib/format";
import { LoadingLabel, Modal } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";
import { PickupSlotModal } from "@/components/slot-picker";

async function mutate(id: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json() as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Action impossible.");
}

export function PayBalanceButton({ order }: { order: DetailedOrder }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { notify, refresh } = usePortal();
  if (order.balanceCents <= 0) return <span className="status status-green"><Check size={14} />{order.paymentStatus}</span>;
  async function pay() {
    setBusy(true);
    try {
      await mutate(order.id, { action: "pay" });
      notify(businessConfig.paymentMode === "mock" ? "Règlement simulé enregistré. Aucun débit réel." : "Solde réglé.");
      setOpen(false);
      refresh();
    } catch (error) { notify(error instanceof Error ? error.message : "Paiement impossible.", "error"); }
    finally { setBusy(false); }
  }
  return <>
    <button className="btn" onClick={() => setOpen(true)}>Régler le solde ({formatMoney(order.balanceCents)})</button>
    <Modal open={open} onClose={() => !busy && setOpen(false)} title="Règlement du solde">
      <div className="notice mb-4"><span className="eyebrow">Commande {order.id}</span><div className="big-number mt-2">{formatMoney(order.balanceCents)}</div><span>Solde TTC après pesée</span></div>
      {businessConfig.paymentMode === "mock" ? <p className="notice small"><strong>Environnement de démonstration</strong><br />Cette action met à jour le suivi de commande mais ne contacte aucune banque et n’effectue aucun débit.</p> : <p>Vous allez être redirigé vers le prestataire de paiement sécurisé configuré par la boutique.</p>}
      <div className="actions mt-5"><button className="btn flex-1" disabled={busy} onClick={pay}>{busy ? <LoadingLabel>Enregistrement…</LoadingLabel> : businessConfig.paymentMode === "mock" ? "Confirmer le règlement simulé" : "Procéder au paiement"}</button><button className="btn btn-outline" disabled={busy} onClick={() => setOpen(false)}>Annuler</button></div>
    </Modal>
  </>;
}

export function OrderActions({ order, occupancy }: { order: DetailedOrder; occupancy: Record<string, number> }) {
  const [modal, setModal] = useState<"slot" | "cancel" | null>(null);
  const [busy, setBusy] = useState(false);
  const { notify, refresh } = usePortal();
  const isClosed = ["Retirée", "Livrée", "Annulée"].includes(order.status) || order.slotDate < businessConfig.businessDate;

  async function cancel() {
    setBusy(true);
    try {
      await mutate(order.id, { action: "cancel" });
      notify("Commande annulée dans le suivi.");
      setModal(null);
      refresh();
    } catch (error) { notify(error instanceof Error ? error.message : "Action impossible.", "error"); }
    finally { setBusy(false); }
  }

  return <>
    <section className="card" id="actions">
      <h2>Agir sur cette commande</h2>
      <button className="btn btn-dark w-full justify-start mb-2" disabled={isClosed} onClick={() => setModal("slot")}><CalendarDays size={17} /><span className="text-left">Modifier le créneau de retrait<span className="block small font-normal">{isClosed ? "Modification en ligne indisponible" : "Possible jusqu’à 24 h avant le retrait"}</span></span></button>
      <a className="btn btn-dark w-full justify-start mb-2" href={businessConfig.phoneHref}><Phone size={17} /><span className="text-left">Contacter la boutique<span className="block small font-normal">({businessConfig.phone})</span></span></a>
      <Link className="btn btn-outline w-full justify-start mb-3" href={`/reclamations/nouvelle?commande=${order.id}`}><MessageSquareText size={17} />Signaler un problème</Link>
      <button className="text-button inline-flex items-center gap-2" disabled={isClosed} onClick={() => setModal("cancel")}><X size={16} />Annuler la commande</button>
      <div><Link href="/compte/maison#conditions" className="small muted underline underline-offset-2">Conditions de rétractation et d’annulation</Link></div>
    </section>

    <PickupSlotModal order={order} open={modal === "slot"} occupancy={occupancy} onClose={() => setModal(null)} />

    <Modal open={modal === "cancel"} onClose={() => !busy && setModal(null)} title="Annuler cette commande ?">
      <p>La commande <strong>{order.id}</strong> et son créneau du {formatDateLong(order.slotDate)} seront annulés.</p>
      <p className="notice small">{businessConfig.paymentMode === "mock" ? "Démonstration : aucun remboursement bancaire ne sera réellement exécuté." : "L’acompte est recrédité sur le moyen de paiement initial sous 3 à 5 jours ouvrés."}</p>
      <div className="actions"><button className="btn" disabled={busy} onClick={cancel}>{busy ? <LoadingLabel>Annulation…</LoadingLabel> : "Confirmer l’annulation"}</button><button className="btn btn-outline" onClick={() => setModal(null)}>Conserver ma commande</button></div>
    </Modal>
  </>;
}
