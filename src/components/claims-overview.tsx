"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { BellRing, CheckCircle2, MessageSquarePlus, Search, TicketCheck, WalletCards } from "lucide-react";
import type { DetailedClaim, PortalData } from "@/lib/portal";
import { activeVoucherTotal } from "@/lib/portal-utils";
import { formatDate, formatMoney } from "@/lib/format";
import { BackLink, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export function ClaimsOverview({ claims, data }: { claims: DetailedClaim[]; data: PortalData }) {
  const [filter, setFilter] = useState("Tous");
  const [query, setQuery] = useState("");
  const active = claims.filter((claim) => !claim.status.includes("Résolu"));
  const resolved = claims.filter((claim) => claim.status.includes("Résolu"));
  const visible = useMemo(() => claims.filter((claim) => {
    const statusMatch = filter === "Tous" || (filter === "En cours" ? !claim.status.includes("Résolu") : claim.status.includes("Résolu"));
    const text = `${claim.id} ${claim.orderId} ${claim.item.product.name} ${claim.motif}`.toLowerCase();
    return statusMatch && text.includes(query.toLowerCase().trim());
  }), [claims, filter, query]);

  return <>
    <BackLink href="/commandes">Retour aux commandes</BackLink>
    <PageHeader title="Mes réclamations & SAV" description="Un dossier unique pour chaque article concerné, avec le lot, les photos, les échanges et la résolution. L’Atelier répond sous 24 h ouvrées." />
    <div className="grid sm:grid-cols-2 gap-4 mb-5">
      <motion.section className="kraft p-5" initial={{ opacity: 0, rotate: -1.5, y: 20 }} animate={{ opacity: 1, rotate: 0, y: 0 }}><div className="flex justify-between"><h2>Dossiers en cours</h2><BellRing size={28} strokeWidth={1.4} /></div><div className="big-number mt-3">{active.length}</div><p className="text-lg">dossiers actifs</p><div className="divider border-[#a98f60]" />{active.slice(0, 3).map((claim) => <Link href={`/reclamations/${claim.id}`} key={claim.id} className="block small py-1 hover:underline">{claim.id} · {claim.motif} ({claim.orderId})</Link>)}{active.length === 0 ? <p className="small">Aucun dossier en attente.</p> : null}</motion.section>
      <motion.section className="kraft p-5" initial={{ opacity: 0, rotate: 1.5, y: 20 }} animate={{ opacity: 1, rotate: 0, y: 0 }} transition={{ delay: .06 }}><div className="flex justify-between"><h2>Dossiers résolus</h2><CheckCircle2 size={28} strokeWidth={1.4} /></div><div className="big-number mt-3">{resolved.length}</div><p className="text-lg">dossiers clos</p><div className="divider" /><p className="small mb-0">Vos résolutions et échanges restent consultables avec les documents de commande.</p></motion.section>
      <motion.section className="kraft p-5" initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}><div className="flex justify-between"><h2>Avoirs disponibles</h2><WalletCards size={28} strokeWidth={1.4} /></div><div className="big-number mt-3">{formatMoney(data.vouchers.filter((voucher) => voucher.kind === "Avoir" && voucher.status === "Actif").reduce((sum, voucher) => sum + voucher.valueCents, 0))}</div><p>dans votre cagnotte</p><Link href="/cagnotte" className="btn btn-outline">Voir ma cagnotte</Link></motion.section>
      <motion.section className="kraft p-5" initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: .06 }}><div className="flex justify-between"><h2>Action principale</h2><TicketCheck size={28} strokeWidth={1.4} /></div><p className="mt-4 mb-0">Nouveau problème ?</p><div className="text-4xl font-semibold leading-none my-2">Signaler<br />un problème</div><Link href="/reclamations/nouvelle" className="btn w-full mt-3"><MessageSquarePlus size={17} />Ouvrir une réclamation</Link></motion.section>
    </div>

    <section className="card">
      <div className="card-title flex-wrap"><h2>Mes dernières demandes</h2><span className="status status-burgundy">{claims.length} dossiers</span></div>
      <div className="flex flex-wrap gap-2 justify-between mb-3"><div className="tabs m-0">{["Tous", "En cours", "Résolus"].map((item) => <button key={item} className={`tab ${filter === item ? "tab-active" : ""}`} onClick={() => setFilter(item)}>{item}</button>)}</div><label className="relative block"><Search size={15} className="absolute left-3 top-2.5 muted" /><input className="input pl-9 py-1.5" placeholder="Dossier, commande, produit…" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
      {visible.length === 0 ? <EmptyState title="Aucun dossier dans cette vue" text="Modifiez votre recherche ou affichez tous les dossiers." /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>N° Dossier</th><th>Commande</th><th>Produit</th><th>Motif</th><th>Date</th><th>Statut</th></tr></thead><tbody>{visible.map((claim) => <tr key={claim.id}><td><Link className="text-button" href={`/reclamations/${claim.id}`}>{claim.id}</Link></td><td><Link className="text-button" href={`/commandes/${claim.orderId}`}>{claim.orderId}</Link></td><td>{claim.item.product.name}<span className="small muted block">Lot {claim.item.lot}</span></td><td>{claim.motif}</td><td>{formatDate(claim.createdAt)}</td><td><StatusBadge status={claim.status} /></td></tr>)}</tbody></table></div>}
    </section>
    <p className="small muted mt-4">Les avoirs proposés ne sont crédités qu’après validation de la résolution. Le solde disponible dans la cagnotte tient compte des bons déjà utilisés : {formatMoney(activeVoucherTotal(data))} au total, tous supports confondus.</p>
  </>;
}
