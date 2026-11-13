"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, Gift, Minus, Plus, Ticket, WalletCards } from "lucide-react";
import type { PortalData, Voucher } from "@/lib/portal";
import { loyaltyBalance } from "@/lib/portal-utils";
import { businessConfig } from "@/lib/config";
import { formatDate, formatMoney } from "@/lib/format";
import { LoadingLabel, Modal, PageHeader, StatusBadge, Toggle } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";

export function LoyaltyManager({ data }: { data: PortalData }) {
  const points = loyaltyBalance(data);
  const [modal, setModal] = useState<"convert" | "activate" | null>(null);
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [filter, setFilter] = useState("Tous");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const { notify, refresh } = usePortal();
  const movements = useMemo(() => data.loyalty.filter((entry) => filter === "Tous" || (filter === "Gains" ? entry.points > 0 : entry.points < 0)), [data.loyalty, filter]);

  async function togglePoints(value: boolean) {
    try {
      const response = await fetch("/api/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applyPoints: value }) });
      if (!response.ok) throw new Error();
      notify(value ? "Vos points seront proposés à la prochaine commande." : "Utilisation des points désactivée."); refresh();
    } catch { notify("La préférence n’a pas pu être enregistrée.", "error"); }
  }

  async function operation(action: "convert" | "activate") {
    setBusy(true);
    try {
      const response = await fetch("/api/loyalty", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, code }) });
      const payload = await response.json() as { error?: string; id?: string };
      if (!response.ok) throw new Error(payload.error ?? "Opération impossible.");
      notify(action === "convert" ? "100 points convertis : votre bon de 10 € est disponible." : `Carte ${payload.id} activée.`);
      setModal(null); setCode(""); refresh();
    } catch (error) { notify(error instanceof Error ? error.message : "Opération impossible.", "error"); }
    finally { setBusy(false); }
  }

  async function copyCode(value: string) {
    try { await navigator.clipboard.writeText(value); setCopied(true); notify("Code copié dans le presse-papiers."); window.setTimeout(() => setCopied(false), 1800); }
    catch { notify(`Code : ${value}`, "success"); }
  }

  return <>
    <PageHeader title="Cagnotte" description="Vos points, avoirs et cartes-cadeaux sont réunis ici, avec chaque mouvement et chaque date de validité." />
    <div className="info-strip"><p>Gagnez des points à chaque achat (<strong>1 € dépensé = 1 point</strong>) et profitez de vos bons d’achat et cartes-cadeaux !</p><p className="m-0 text-xl">Votre solde de points : <strong>{points} points</strong> (équivalent à {formatMoney(points * 10)})</p></div>
    <div className="grid lg:grid-cols-2 gap-4 mb-4">
      <section className="card m-0"><div className="flex justify-between"><span className="chip">{data.settings.applyPoints ? "Utilisation activée" : "En cours"}</span><Check className="text-[#2b0811]" /></div><h2 className="mt-4">Solde récapitulatif</h2><div className="text-4xl font-semibold mb-4">{points} points · {formatMoney(points * 10)}</div><div className="notice flex items-center justify-between gap-3"><span><strong>Utiliser à la prochaine commande</strong><span className="small muted block">Déduction proposée avant validation, dans la limite du total.</span></span><Toggle checked={data.settings.applyPoints} onChange={togglePoints} label="Utiliser les points à la prochaine commande" /></div><div className="actions mt-4"><button className="btn" disabled={points < 100} onClick={() => setModal("convert")}>Convertir 100 pts en bon 10 €</button><button className="btn btn-outline" onClick={() => setModal("activate")}><Gift size={16} />Activer une carte-cadeau</button></div></section>
      <section className="card m-0"><div className="card-title"><h2>Bons et cartes-cadeaux</h2><Check /></div><div className="scroll-area max-h-[360px] pr-1">{data.vouchers.filter((item) => item.kind !== "Consigne").map((item) => <div className="flex gap-3 py-3 border-b border-[#e5ddce]" key={item.id}><div className="grid place-items-center w-16 h-16 shrink-0 rounded-lg bg-[#e9dfc5]">{item.kind === "Carte-cadeau" ? <Gift size={34} strokeWidth={1.4} /> : <Ticket size={34} strokeWidth={1.4} />}</div><div className="flex-1"><div className="flex justify-between gap-2"><h3 className="m-0">{item.label}</h3><StatusBadge status={item.status} /></div><p className="m-0">{item.id}</p><p className="small muted">Validité : {formatDate(item.expiresAt)} · {formatMoney(item.valueCents)}</p><button className="btn btn-outline btn-sm" onClick={() => setVoucher(item)}>Afficher</button></div></div>)}</div></section>
    </div>
    <section className="card"><div className="card-title flex-wrap"><h2>Historique des mouvements</h2><div className="tabs m-0">{["Tous", "Gains", "Utilisations"].map((item) => <button className={`tab ${filter === item ? "tab-active" : ""}`} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="grid md:grid-cols-2 gap-x-5">{movements.map((entry, index) => <motion.div layout className="flex items-center gap-3 py-4 border-b border-[#e5ddce]" key={entry.entryKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .035, .25) }}><div className="grid place-items-center w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-[#e9dfc5]">{entry.kind === "order" || entry.kind === "review" ? <img src={entry.kind === "review" ? "/images/merguez.jpg" : "/images/cote-boeuf.jpg"} alt="" className="w-full h-full object-cover" /> : entry.kind === "gift" ? <Gift size={32} /> : <Ticket size={32} />}</div><div className="flex-1"><strong>{entry.label}</strong><p className={`m-0 text-lg font-semibold ${entry.points >= 0 ? "text-[#365f3c]" : "text-[#4a1320]"}`}>{entry.points > 0 ? "+" : ""}{entry.points} pts · {formatDate(entry.occurredAt)}</p></div><span className={`grid place-items-center w-6 h-6 rounded-full text-white ${entry.points >= 0 ? "bg-[#365f3c]" : "bg-[#2b0811]"}`}>{entry.points >= 0 ? <Plus size={15} /> : <Minus size={15} />}</span></motion.div>)}</div>{movements.length === 0 ? <p className="muted text-center py-5">Aucun mouvement dans cette catégorie.</p> : null}</section>

    <Modal open={modal === "convert"} onClose={() => !busy && setModal(null)} title="Convertir vos points"><div className="text-center notice"><WalletCards size={34} className="mx-auto mb-2" /><div className="big-number">100 points</div><p>deviennent un bon d’achat de <strong>10,00 €</strong>, valable un an.</p></div><p className="small muted">Le solde passera de {points} à {points - 100} points. Cette conversion est définitive ; le bon apparaîtra immédiatement dans votre liste.</p><div className="actions"><button className="btn" disabled={busy} onClick={() => operation("convert")}>{busy ? <LoadingLabel>Conversion…</LoadingLabel> : "Confirmer la conversion"}</button><button className="btn btn-outline" onClick={() => setModal(null)}>Annuler</button></div></Modal>
    <Modal open={modal === "activate"} onClose={() => !busy && setModal(null)} title="Activer une carte-cadeau"><p>Saisissez le code figurant au dos de votre carte. Le montant sera ajouté à vos moyens de paiement en boutique.</p><label className="label" htmlFor="gift-code">Code de la carte</label><input id="gift-code" className="input uppercase tracking-widest" value={code} onChange={(event) => setCode(event.target.value)} placeholder="MAISON-25-2026" /><p className="notice small mt-3"><strong>Service de démonstration local</strong><br />Codes acceptés : MAISON-25-2026 (25 €) et MAISON-50-2026 (50 €). Aucun service bancaire externe n’est contacté.</p><button className="btn w-full mt-3" disabled={busy || !code.trim()} onClick={() => operation("activate")}>{busy ? <LoadingLabel>Vérification…</LoadingLabel> : "Vérifier et activer"}</button></Modal>
    <Modal open={Boolean(voucher)} onClose={() => setVoucher(null)} title={voucher?.label ?? "Votre bon"}>{voucher ? <div className="text-center"><div className="kraft p-6"><Ticket size={42} className="mx-auto mb-2" /><div className="big-number">{formatMoney(voucher.valueCents)}</div><p className="mb-0">Valable jusqu’au {formatDate(voucher.expiresAt)}</p></div><div className="border border-dashed border-[#8f7a55] rounded-md text-xl tracking-[.12em] font-semibold p-4 my-4 break-all">{voucher.id}</div><StatusBadge status={voucher.status} /><p className="small muted mt-3">Présentez ce code au comptoir ou indiquez-le dans le message de votre prochaine commande. Un bon utilisé ne peut pas être réactivé.</p><button className="btn" onClick={() => copyCode(voucher.id)}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Code copié" : "Copier le code"}</button></div> : null}</Modal>
  </>;
}
