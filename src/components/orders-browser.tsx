"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type { DetailedOrder } from "@/lib/portal";
import { businessConfig } from "@/lib/config";
import { formatDate, formatMoney } from "@/lib/format";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";

const closed = ["Retirée", "Livrée", "Annulée"];
type Filters = { query: string; status: string; period: string; sort: string };

export function OrdersBrowser({ orders }: { orders: DetailedOrder[] }) {
  const [draft, setDraft] = useState<Filters>({ query: "", status: "Toutes", period: "Tout l’historique", sort: "Récentes d’abord" });
  const [filters, setFilters] = useState(draft);
  const [reordering, setReordering] = useState<string | null>(null);
  const { notify, refresh, setCartOpen } = usePortal();

  const filtered = useMemo(() => {
    const needle = draftSafe(filters.query);
    const result = orders.filter((order) => {
      const matchesQuery = !needle || draftSafe(`${order.id} ${order.items.map((item) => `${item.product.name} ${item.lot}`).join(" ")}`).includes(needle);
      const matchesStatus = filters.status === "Toutes" || order.status === filters.status;
      let matchesPeriod = true;
      if (filters.period === "30 derniers jours") matchesPeriod = order.placedAt >= "2026-10-17";
      if (filters.period === "3 derniers mois") matchesPeriod = order.placedAt >= "2026-08-16";
      return matchesQuery && matchesStatus && matchesPeriod;
    });
    return result.sort((a, b) => filters.sort === "Montant décroissant" ? b.totalCents - a.totalCents : filters.sort === "Anciennes d’abord" ? a.placedAt.localeCompare(b.placedAt) : b.placedAt.localeCompare(a.placedAt));
  }, [orders, filters]);

  const current = filtered.filter((order) => !closed.includes(order.status) && order.slotDate >= businessConfig.businessDate);
  const finished = filtered.filter((order) => !current.includes(order));

  async function reorder(order: DetailedOrder) {
    setReordering(order.id);
    try {
      const response = await fetch(`/api/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reorder" }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error);
      notify(`${order.items.length} article${order.items.length > 1 ? "s" : ""} de ${order.id} ajouté${order.items.length > 1 ? "s" : ""} au panier.`);
      refresh();
      setCartOpen(true);
    } catch (error) { notify(error instanceof Error ? error.message : "Recommande impossible.", "error"); }
    finally { setReordering(null); }
  }

  function card(order: DetailedOrder) {
    return (
      <motion.article layout key={order.id} className="card m-0 overflow-hidden" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .98 }}>
        <div className="flex justify-between items-start gap-4">
          <div><div className="flex items-center flex-wrap gap-2"><h2 className="m-0">{order.id}</h2><StatusBadge status={order.status} /></div><p className="my-2 font-medium">{order.fulfillment} · {order.shop}</p></div>
          <div className="text-right"><strong>Total {formatMoney(order.totalCents)}</strong><span className="block small">{order.balanceCents > 0 ? `Reste à régler : ${formatMoney(order.balanceCents)}` : order.paymentStatus}</span></div>
        </div>
        <p className="mb-1">{order.fulfillment} · {formatDate(order.slotDate, { weekday: "short", day: "2-digit", month: "short" })} · {order.slotLabel}</p>
        <p className="small muted">Commandé le {formatDate(order.placedAt)}</p>
        <p className="mb-3 truncate">{order.items.map((item) => item.product.name).slice(0, 3).join(" · ")}{order.items.length > 3 ? ` · +${order.items.length - 3}` : ""}</p>
        <div className="divider my-3" />
        <div className="actions"><button className="btn btn-sm" disabled={reordering === order.id || order.status === "Annulée"} onClick={() => reorder(order)}><RotateCcw size={14} className={reordering === order.id ? "spin" : ""} />{reordering === order.id ? "Ajout en cours…" : "Recommander ces articles"}</button><Link href={`/commandes/${order.id}`} className="btn btn-sm">Voir le détail <ArrowRight size={14} /></Link></div>
      </motion.article>
    );
  }

  return (
    <>
      <PageHeader title="Vos commandes" description="Chaque commande garde son détail : ce qui a été pesé, d’où vient la pièce, quel lot, quelle facture. C’est ce qui permet de traiter une réclamation sans vous demander de tout réexpliquer." />
      <form className="card" onSubmit={(event) => { event.preventDefault(); setFilters(draft); }}>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
          <label><span className="label">Numéro, produit ou lot</span><span className="relative block"><Search size={16} className="absolute left-3 top-3 muted" /><input className="input pl-9" value={draft.query} onChange={(e) => setDraft({ ...draft, query: e.target.value })} placeholder="CMD-2452, côte de bœuf…" /></span></label>
          <label><span className="label">État</span><select className="select" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option>Toutes</option>{[...new Set(orders.map((order) => order.status))].map((status) => <option key={status}>{status}</option>)}</select></label>
          <label><span className="label">Période</span><select className="select" value={draft.period} onChange={(e) => setDraft({ ...draft, period: e.target.value })}><option>Tout l’historique</option><option>30 derniers jours</option><option>3 derniers mois</option></select></label>
          <label><span className="label">Tri</span><select className="select" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: e.target.value })}><option>Récentes d’abord</option><option>Anciennes d’abord</option><option>Montant décroissant</option></select></label>
        </div>
        <div className="flex items-center gap-3 mt-4"><button className="btn btn-light" type="submit"><SlidersHorizontal size={15} />Filtrer</button><span className="muted">{filtered.length} commande{filtered.length > 1 ? "s" : ""} au total</span>{JSON.stringify(draft) !== JSON.stringify(filters) ? <span className="status status-gold">Filtres modifiés</span> : null}</div>
      </form>

      {filtered.length === 0 ? <div className="card"><EmptyState title="Aucune commande ne correspond" text="Modifiez les critères ou revenez à tout l’historique." action={<button className="btn btn-outline" onClick={() => { const reset = { query: "", status: "Toutes", period: "Tout l’historique", sort: "Récentes d’abord" }; setDraft(reset); setFilters(reset); }}>Réinitialiser les filtres</button>} /></div> : (
        <div className="mt-6 space-y-7">
          {current.length ? <section><div className="flex items-baseline flex-wrap gap-3 mb-3"><h2 className="m-0">En cours</h2><span>{current.length} commande{current.length > 1 ? "s" : ""}</span><span className="muted small">Commandes à préparer, prêtes ou à retirer</span></div><motion.div layout className="grid gap-3"><AnimatePresence>{current.map(card)}</AnimatePresence></motion.div></section> : null}
          {finished.length ? <section><div className="flex items-baseline flex-wrap gap-3 mb-3"><h2 className="m-0">Terminées & historique</h2><span>{finished.length} commande{finished.length > 1 ? "s" : ""}</span><span className="muted small">Vos documents restent disponibles dix ans</span></div><motion.div layout className="grid gap-3"><AnimatePresence>{finished.map(card)}</AnimatePresence></motion.div></section> : null}
        </div>
      )}
    </>
  );
}

function draftSafe(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
