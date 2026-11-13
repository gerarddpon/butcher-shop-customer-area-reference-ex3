"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCircle2, MessageSquareReply, ShieldCheck, Trash2, X } from "lucide-react";
import type { Order, DetailedItem, DetailedReview } from "@/lib/portal";
import { businessConfig, customer } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { EmptyState, LoadingLabel, Modal, PageHeader, ProductThumb, Stars, StatusBadge } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";

const criteriaOptions = ["Qualité de la découpe", "Fraîcheur & conservation", "Tendreté / Maturation", "Préférences respectées", "Conseils de cuisson", "Conditionnement"];
type Pending = { item: DetailedItem; order: Order };
type Selected = Pending & { review?: DetailedReview };

export function ReviewsManager({ reviews, pending }: { reviews: DetailedReview[]; pending: Pending[] }) {
  const [tab, setTab] = useState<"pending" | "published">(pending.length ? "pending" : "published");
  const [selected, setSelected] = useState<Selected | null>(null);
  const [deleting, setDeleting] = useState<DetailedReview | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const { notify, refresh } = usePortal();
  const average = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1).replace(".", ",") : "—";

  async function remove() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const response = await fetch(`/api/reviews/${deleting.id}`, { method: "DELETE" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Suppression impossible.");
      notify(`Avis supprimé. ${businessConfig.reviewPoints} points ont été retirés de la cagnotte.`);
      setDeleting(null); refresh();
    } catch (error) { notify(error instanceof Error ? error.message : "Suppression impossible.", "error"); }
    finally { setDeleteBusy(false); }
  }

  return <>
    <PageHeader title="Mes avis" description="Vos retours aident l’Atelier à ajuster les découpes et les conseils. Seuls les articles effectivement commandés peuvent être évalués." />
    <div className="info-strip">Publiez un avis vérifié et recevez <strong>+{businessConfig.reviewPoints} points fidélité</strong> directement dans votre cagnotte !</div>
    <p><strong>{pending.length} article{pending.length > 1 ? "s" : ""} à évaluer</strong> · {reviews.length} avis publiés · Note moyenne donnée : <strong>{average}/5</strong></p>
    <div className="tabs"><button className={`tab ${tab === "pending" ? "tab-active" : ""}`} onClick={() => setTab("pending")}>À évaluer ({pending.length})</button><button className={`tab ${tab === "published" ? "tab-active" : ""}`} onClick={() => setTab("published")}>Avis publiés ({reviews.length})</button></div>
    <AnimatePresence mode="wait">
      <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
        {tab === "pending" ? <div className="grid gap-3">{pending.length === 0 ? <div className="card"><EmptyState title="Tout est évalué" text="Vos prochains articles éligibles apparaîtront ici après leur retrait ou leur livraison." /></div> : pending.map(({ item, order }) => <motion.article layout className="card m-0" key={item.key}><div className="product-row"><ProductThumb src={item.product.image} alt={item.product.name} size={76} /><div className="flex-1"><h3 className="m-0">{item.product.name} · {item.quantityLabel}</h3><p className="small m-0">{order.id} · {order.status === "Livrée" ? "Livrée" : "Retirée"} le {formatDate(order.slotDate)}</p><div className="flex items-center gap-3 flex-wrap my-1"><Stars value={0} onChange={(rating) => setSelected({ item, order, review: undefined })} /><span className="muted">Cliquez pour noter</span></div><button className="btn btn-sm" onClick={() => setSelected({ item, order })}>Évaluer ce produit</button></div></div></motion.article>)}</div> : (
          <div className="scroll-area max-h-[700px] pr-2 grid gap-3">{reviews.length === 0 ? <div className="card"><EmptyState title="Aucun avis publié" text="Votre premier avis vérifié vous fera gagner des points fidélité." /></div> : reviews.map((review) => <motion.article layout className="card m-0" key={review.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-start gap-3"><div className="product-row flex-1"><ProductThumb src={review.item.product.image} alt={review.item.product.name} size={76} /><div><h3 className="m-0">{review.item.product.name} · {review.item.quantityLabel}</h3><p className="small m-0">{review.order.id} · {formatDate(review.order.slotDate)}</p><Stars value={review.rating} /></div></div><StatusBadge status="Publié" /></div>
            <div className="flex flex-wrap gap-2 my-3">{review.criteria.map((criterion) => <span className="chip" key={criterion}>{criterion}</span>)}</div>
            {review.comment ? <p>{review.comment}</p> : <p className="muted italic">Avis publié sans commentaire.</p>}
            <p className="small muted">Publié sous : {review.anonymous ? "Anonyme" : customer.shortName} · {formatDate(review.publishedAt)}</p>
            {review.atelierReply ? <div className="notice"><strong>Réponse de l’Atelier de Sannois{review.replyDate ? ` · ${formatDate(review.replyDate)}` : ""} :</strong><p className="m-0">« {review.atelierReply} »</p></div> : null}
            <div className="actions mt-3"><button className="btn" onClick={() => setSelected({ item: review.item, order: review.order, review })}>Modifier mon avis</button><button className="text-button inline-flex items-center gap-1" onClick={() => setDeleting(review)}><Trash2 size={15} />Supprimer</button></div>
          </motion.article>)}</div>
        )}
      </motion.div>
    </AnimatePresence>

    <AnimatePresence>
      {selected ? <>
        <motion.button className="modal-backdrop border-0" aria-label="Fermer l’évaluation" onClick={() => setSelected(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        <ReviewDrawer key={`${selected.item.key}-${selected.review?.id ?? "new"}`} selected={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); setTab("published"); refresh(); }} />
      </> : null}
    </AnimatePresence>
    <Modal open={Boolean(deleting)} onClose={() => !deleteBusy && setDeleting(null)} title="Supprimer cet avis ?"><p>Le commentaire et les critères seront définitivement retirés de votre espace. Les <strong>{businessConfig.reviewPoints} points</strong> associés seront également déduits de la cagnotte.</p><div className="actions mt-4"><button className="btn" disabled={deleteBusy} onClick={remove}>{deleteBusy ? <LoadingLabel>Suppression…</LoadingLabel> : "Supprimer définitivement"}</button><button className="btn btn-outline" onClick={() => setDeleting(null)}>Conserver mon avis</button></div></Modal>
  </>;
}

function ReviewDrawer({ selected, onClose, onSaved }: { selected: Selected; onClose: () => void; onSaved: () => void }) {
  const [rating, setRating] = useState(selected.review?.rating ?? 0);
  const [criteria, setCriteria] = useState<string[]>(selected.review?.criteria ?? []);
  const [comment, setComment] = useState(selected.review?.comment ?? "");
  const [anonymous, setAnonymous] = useState(selected.review?.anonymous ?? false);
  const [busy, setBusy] = useState(false);
  const { notify } = usePortal();

  async function publish() {
    if (!rating) { notify("Choisissez une note globale avant de publier.", "error"); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewId: selected.review?.id, orderItemKey: selected.item.key, rating, criteria, comment, anonymous }) });
      const payload = await response.json() as { error?: string; pointsAwarded?: number };
      if (!response.ok) throw new Error(payload.error ?? "Publication impossible.");
      notify(selected.review ? "Votre avis a été mis à jour, sans nouveaux points." : `Avis publié · +${payload.pointsAwarded} points crédités.`);
      onSaved();
    } catch (error) { notify(error instanceof Error ? error.message : "Publication impossible.", "error"); }
    finally { setBusy(false); }
  }

  return <motion.aside className="drawer flex flex-col" role="dialog" aria-modal="true" aria-label="Évaluer ce produit" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }}>
    <div className="drawer-head"><h2>{selected.review ? "Modifier mon avis" : "Évaluer ce produit"}</h2><button className="close-button" onClick={onClose} aria-label="Fermer"><X size={26} /></button></div>
    <div className="drawer-body flex-1">
      <div className="card m-0 product-row"><ProductThumb src={selected.item.product.image} alt={selected.item.product.name} size={82} /><div><h3>{selected.item.product.name} · {selected.item.quantityLabel}</h3><span className="status status-green"><ShieldCheck size={13} />Achat vérifié · {selected.order.id}</span></div></div>
      <h3 className="mt-5">Ma note globale</h3><Stars value={rating} onChange={setRating} size={36} label="Ma note globale" />
      <h3 className="mt-4">Critères d’atelier</h3><div className="flex flex-wrap items-start gap-2">{criteriaOptions.map((criterion) => { const checked = criteria.includes(criterion); return <button key={criterion} className={`chip chip-button ${checked ? "chip-selected" : ""}`} onClick={() => setCriteria((current) => checked ? current.filter((item) => item !== criterion) : [...current, criterion])} aria-pressed={checked}>{checked ? <Check size={14} /> : null}{criterion}</button>; })}</div>
      <label className="label mt-4" htmlFor="review-comment">Mon commentaire (optionnel)</label><textarea id="review-comment" className="textarea min-h-28" value={comment} maxLength={1000} onChange={(event) => setComment(event.target.value)} placeholder="Comment l’avez-vous cuisiné ? La pièce correspondait-elle à vos attentes ?" /><div className="text-right small muted">{comment.length}/1000</div>
      <div className="flex items-center gap-3 flex-wrap mt-3"><span>Publier sous : <strong>{anonymous ? "Anonyme" : customer.shortName}</strong></span><label className="check-row"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />Garder l’anonymat</label></div>
      <div className="notice mt-4 flex gap-3"><CheckCircle2 size={22} className="shrink-0" /><div><strong>Encart fidélité</strong><p className="m-0">{selected.review ? "La modification d’un avis ne crédite pas de nouveaux points." : `+${businessConfig.reviewPoints} points fidélité crédités à la publication`}</p></div></div>
    </div>
    <div className="drawer-footer"><button className="btn btn-lg w-full" disabled={busy || !rating} onClick={publish}>{busy ? <LoadingLabel>Publication…</LoadingLabel> : selected.review ? "Enregistrer les modifications" : `Publier mon avis (+${businessConfig.reviewPoints} pts)`}</button><button className="btn btn-outline w-full mt-2" disabled={busy} onClick={onClose}>Annuler</button></div>
  </motion.aside>;
}
