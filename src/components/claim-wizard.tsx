"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Camera, Check, CheckCircle2, FileImage, PackageCheck, ShieldCheck, Upload, X } from "lucide-react";
import type { DetailedOrder } from "@/lib/portal";
import { businessConfig } from "@/lib/config";
import { formatDate, formatMoney } from "@/lib/format";
import { BackLink, LoadingLabel, PageHeader, ProductThumb, StatusBadge } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";
import type { ClaimPhoto } from "@/db/schema";

const motifs = ["Article manquant", "Erreur de découpe", "Poids incorrect", "Problème fraîcheur", "Problème conditionnement", "Autre"];
const resolutions = [
  { name: "Avoir dans ma cagnotte", text: "Montant validé par l’Atelier, utilisable pendant 12 mois." },
  { name: "Remplacement au prochain retrait", text: "Une nouvelle pièce préparée selon vos préférences, sous réserve de disponibilité." },
  { name: "Conseil de l’Atelier", text: "Une réponse personnalisée sur la découpe, la cuisson ou la conservation." },
];

export function ClaimWizard({ orders, initialOrderId, openItemKeys }: { orders: DetailedOrder[]; initialOrderId?: string; openItemKeys: string[] }) {
  const firstOrder = orders.find((order) => order.id === initialOrderId) ?? orders[0];
  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState(firstOrder?.id ?? "");
  const order = orders.find((item) => item.id === orderId) ?? orders[0];
  const availableItems = useMemo(() => order?.items ?? [], [order]);
  const [itemKey, setItemKey] = useState("");
  const [motif, setMotif] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<ClaimPhoto[]>([]);
  const [desiredResolution, setDesiredResolution] = useState(resolutions[0].name);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { notify, refresh } = usePortal();
  const item = availableItems.find((entry) => entry.key === itemKey);

  useEffect(() => {
    const firstAvailable = availableItems.find((entry) => !openItemKeys.includes(entry.key)) ?? availableItems[0];
    setItemKey(firstAvailable?.key ?? "");
  }, [availableItems, openItemKeys]);
  useEffect(() => { if (item && !quantity) setQuantity(item.quantityLabel); }, [item, quantity]);

  function selectOrder(id: string) {
    setOrderId(id);
    setQuantity("");
    setPhotos([]);
    setError("");
  }

  async function readFiles(files: File[]) {
    setError("");
    const room = businessConfig.maxClaimPhotos - photos.length;
    if (room <= 0) { setError(`Maximum ${businessConfig.maxClaimPhotos} photos par dossier.`); return; }
    const accepted = files.slice(0, room);
    if (files.length > room) setError(`Seules ${room} photo${room > 1 ? "s" : ""} supplémentaire${room > 1 ? "s" : ""} peuvent être ajoutées.`);
    for (const file of accepted) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError(`${file.name} : utilisez un JPEG, PNG ou WebP.`); continue; }
      if (file.size > businessConfig.maxClaimPhotoBytes) { setError(`${file.name} dépasse la limite de 5 Mo.`); continue; }
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Lecture impossible")); reader.readAsDataURL(file); }).catch(() => "");
      if (!dataUrl) { setError(`${file.name} n’a pas pu être lu.`); continue; }
      const photo = { name: file.name.slice(0, 120), type: file.type, size: file.size, dataUrl };
      setPhotos((current) => current.length < businessConfig.maxClaimPhotos ? [...current, photo] : current);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function validateProblem() {
    if (!motif) return "Choisissez le type de problème rencontré.";
    if (!quantity.trim()) return "Indiquez le poids ou la quantité concernée.";
    if (description.trim().length < 20) return "Ajoutez au moins 20 caractères pour aider l’Atelier à comprendre la situation.";
    if (motif === "Problème fraîcheur" && photos.length === 0) return "La garantie fraîcheur nécessite au moins une photo du produit ou de son étiquette.";
    return "";
  }

  function next() {
    if (step === 2) {
      const validation = validateProblem();
      if (validation) { setError(validation); return; }
    }
    setError("");
    setStep((current) => Math.min(3, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (!item || !consent) return;
    const validation = validateProblem();
    if (validation) { setError(validation); setStep(2); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/claims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, orderItemKey: item.key, motif, description, quantity, photos, desiredResolution }) });
      const payload = await response.json() as { id?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Création impossible.");
      setCreatedId(payload.id!);
      notify(`Dossier ${payload.id} créé et transmis à l’Atelier.`);
      refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) { const message = caught instanceof Error ? caught.message : "Création impossible."; setError(message); notify(message, "error"); }
    finally { setBusy(false); }
  }

  if (createdId) return <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}>
    <div className="card text-center py-10"><CheckCircle2 size={58} className="mx-auto text-[#365f3c] mb-4" strokeWidth={1.3} /><span className="eyebrow muted">Demande transmise</span><h1 className="mt-2">Dossier {createdId} créé</h1><p className="max-w-xl mx-auto">Votre description et vos {photos.length} photo{photos.length > 1 ? "s" : ""} sont enregistrées. L’Atelier dispose maintenant du lot {item?.lot} pour commencer son analyse. Réponse sous {businessConfig.claimResponseHours} h ouvrées dans le fil du dossier.</p><div className="notice max-w-lg mx-auto text-left"><strong>Prochaine étape</strong><br />Le statut « Dossier reçu » évoluera uniquement après prise en charge par un membre de l’Atelier. Aucun avoir n’est crédité automatiquement.</div><div className="actions justify-center mt-5"><Link href={`/reclamations/${createdId}`} className="btn btn-lg">Suivre mon dossier <ArrowRight size={17} /></Link><Link href="/reclamations" className="btn btn-outline btn-lg">Toutes mes réclamations</Link></div></div>
  </motion.div>;

  return <>
    <BackLink href="/reclamations">Retour aux réclamations</BackLink>
    <PageHeader title="Assistant de création de réclamation" description="Trois étapes pour transmettre une demande complète, sans avoir à répéter les informations déjà connues du comptoir." />
    <div className="max-w-2xl mx-auto grid grid-cols-[auto_1fr_auto_1fr_auto] items-start gap-3 mb-7">
      {[{ label: "Commande et Article", icon: PackageCheck }, { label: "Problème et Photos", icon: Camera }, { label: "Résolution", icon: ShieldCheck }].map((entry, index) => { const number = index + 1; const Icon = entry.icon; return <div key={entry.label} className="contents"><div className="text-center"><motion.span layout className={`grid place-items-center mx-auto w-11 h-11 rounded-full border ${step >= number ? "bg-[#2b0811] text-white border-[#2b0811]" : "bg-[#e9e2d3] text-[#9b907d]"}`}>{step > number ? <Check size={21} /> : <Icon size={20} />}</motion.span><span className="block mt-2 font-medium text-sm sm:text-base">{entry.label}</span></div>{number < 3 ? <div className="h-[2px] bg-[#cfc5b2] mt-5 relative overflow-hidden"><motion.div className="absolute inset-0 bg-[#2b0811] origin-left" animate={{ scaleX: step > number ? 1 : 0 }} /></div> : null}</div>; })}
    </div>

    {error ? <motion.div role="alert" className="notice border-[#b9867e] bg-[#f5e6df] text-[#702e27] mb-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>{error}</motion.div> : null}
    <AnimatePresence mode="wait">
      <motion.div key={step} initial={{ opacity: 0, x: step === 1 ? -25 : 25, scale: .985 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: step === 1 ? 25 : -25, scale: .985 }} transition={{ duration: .3 }}>
        {step === 1 ? <>
          <section className="card">
            <div className="card-title"><h2>1. Retrouver l’article concerné</h2><StatusBadge status={`${orders.length} commandes`} /></div>
            <label className="label" htmlFor="claim-order">Commande</label>
            <select id="claim-order" className="select mb-4 text-lg" value={orderId} onChange={(event) => selectOrder(event.target.value)}>{orders.map((entry) => <option value={entry.id} key={entry.id}>{entry.id} · {formatDate(entry.slotDate)} · {formatMoney(entry.totalCents)}</option>)}</select>
            <p className="label">Article dans {order?.id}</p>
            {availableItems.map((entry) => { const alreadyOpen = openItemKeys.includes(entry.key); return <button type="button" disabled={alreadyOpen} key={entry.key} onClick={() => { setItemKey(entry.key); setQuantity(entry.quantityLabel); }} className={`product-row w-full text-left border rounded-lg p-3 bg-transparent ${itemKey === entry.key ? "border-[#8e6835] bg-[#f0e5cd]" : "border-[#ddd5c4]"}`}><ProductThumb src={entry.product.image} alt={entry.product.name} size={70} /><span className="flex-1"><span className="flex justify-between gap-3"><strong>{entry.product.name} · {entry.quantityLabel}</strong>{alreadyOpen ? <span className="status status-gold">Dossier ouvert</span> : itemKey === entry.key ? <CheckCircle2 className="text-[#365f3c]" size={22} /> : null}</span><span className="small block">Lot : {entry.lot} | DLC : {formatDate(entry.dlc)}</span><span className="small muted block">{entry.notes}</span></span></button>; })}
          </section>
          <div className="flex justify-end mt-4"><button className="btn btn-lg" disabled={!item} onClick={next}>Décrire le problème <ArrowRight size={17} /></button></div>
        </> : null}

        {step === 2 && item ? <>
          <section className="card mb-4"><span className="eyebrow muted">Article sélectionné · {orderId}</span><div className="product-row mt-2"><ProductThumb src={item.product.image} alt={item.product.name} size={74} /><div><h2 className="m-0">{item.product.name} · {item.quantityLabel}</h2><span>Lot : {item.lot} | DLC : {formatDate(item.dlc)}</span><button className="text-button small block" onClick={() => setStep(1)}>Changer d’article</button></div></div></section>
          <section className="card">
            <h2>{item.product.name}</h2>
            <fieldset className="field"><legend className="label">Type de problème</legend><div className="border border-[#cfc5b2] rounded-md overflow-hidden">{motifs.map((entry) => <label key={entry} className={`check-row px-3 py-2 ${motif === entry ? "bg-[#5c5048] text-white" : ""}`}><input type="radio" name="motif" checked={motif === entry} onChange={() => setMotif(entry)} /><span>{entry}</span>{motif === entry ? <X size={15} className="ml-auto" /> : null}</label>)}</div></fieldset>
            <label className="label" htmlFor="claim-quantity">Poids ou quantité concernée</label><div className="relative mb-4"><input id="claim-quantity" className="input" value={quantity} maxLength={60} onChange={(event) => setQuantity(event.target.value)} placeholder="Ex. 800 g ou 2 pièces" /><span className="absolute right-3 top-2.5 muted">poids / qté</span></div>
            <label className="label" htmlFor="claim-description">Description détaillée</label><textarea id="claim-description" className="textarea min-h-32" value={description} maxLength={1000} onChange={(event) => setDescription(event.target.value)} placeholder="Précisez la date d’ouverture, la conservation, l’aspect ou l’écart constaté…" /><div className="text-right small muted">{description.length}/1000 · 20 caractères minimum</div>
            <div className="divider" />
            <h3>Joindre des photos {motif === "Problème fraîcheur" ? "(obligatoire pour la garantie fraîcheur)" : "(utile pour l’analyse)"}</h3>
            <div className="actions mb-3"><button className="btn" type="button" onClick={() => fileRef.current?.click()} disabled={photos.length >= businessConfig.maxClaimPhotos}><Upload size={16} />Joindre un fichier</button><span>Max {businessConfig.maxClaimPhotos} photos, 5 Mo chacune</span></div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => readFiles(Array.from(event.target.files ?? []))} />
            {photos.length ? <div className="grid gap-2 mb-3">{photos.map((photo, index) => <motion.div layout className="flex items-center gap-3 bg-[#e6e8de] rounded-md p-2" key={`${photo.name}-${index}`} initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}><img src={photo.dataUrl} alt={`Aperçu ${photo.name}`} className="w-16 h-14 object-cover rounded" /><span className="flex-1 min-w-0"><strong className="block truncate">{photo.name}</strong><span className="small muted">{(photo.size / 1024).toFixed(0)} Ko · prête à être transmise</span></span><button className="close-button" onClick={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))} aria-label={`Retirer ${photo.name}`}><X size={18} /></button></motion.div>)}</div> : null}
            <button type="button" className={`w-full h-28 grid place-items-center border border-dashed rounded-lg transition-colors ${dragging ? "bg-[#e3d3ae] border-[#7e5d30]" : "bg-[#eee9dc] border-[#bfb39d]"}`} onClick={() => fileRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event: DragEvent) => { event.preventDefault(); setDragging(false); readFiles(Array.from(event.dataTransfer.files)); }}><span className="text-center"><Upload size={28} className="mx-auto mb-1" /><span className="block">Glissez vos photos ici ou cliquez pour parcourir</span><span className="small muted">Les originaux sont conservés dans le dossier sécurisé</span></span></button>
          </section>
          <div className="flex justify-between mt-4"><button className="btn btn-outline" onClick={() => setStep(1)}><ArrowLeft size={16} />Retour</button><button className="btn btn-lg" onClick={next}>Choisir la résolution <ArrowRight size={17} /></button></div>
        </> : null}

        {step === 3 && item ? <>
          <section className="card"><div className="card-title"><h2>3. Vérifier et choisir la résolution souhaitée</h2><StatusBadge status="Prêt à envoyer" /></div><div className="product-row"><ProductThumb src={item.product.image} alt={item.product.name} size={80} /><div><h3 className="m-0">{orderId} · {item.product.name}</h3><span>{motif} · {quantity}</span><span className="small muted block">Lot {item.lot} · DLC {formatDate(item.dlc)}</span></div></div><div className="divider" /><p className="whitespace-pre-wrap">{description}</p><span className="chip"><FileImage size={15} />{photos.length} photo{photos.length > 1 ? "s" : ""} jointe{photos.length > 1 ? "s" : ""}</span><button className="text-button small ml-3" onClick={() => setStep(2)}>Modifier la description</button></section>
          <section className="card"><h2>Résolution souhaitée</h2><p className="small muted">Votre choix guide l’Atelier ; la solution définitive est confirmée après analyse du lot.</p><div className="grid gap-2">{resolutions.map((resolution) => <label key={resolution.name} className={`check-row border rounded-lg p-3 ${desiredResolution === resolution.name ? "border-[#8e6835] bg-[#f0e5cd]" : "border-[#ddd5c4]"}`}><input type="radio" name="resolution" checked={desiredResolution === resolution.name} onChange={() => setDesiredResolution(resolution.name)} /><span><strong>{resolution.name}</strong><span className="small block muted">{resolution.text}</span></span></label>)}</div><label className="check-row notice mt-4"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>Je confirme l’exactitude des informations transmises et accepte que l’Atelier utilise les photos et le numéro de lot pour analyser cette demande.</span></label></section>
          <div className="flex justify-between mt-4"><button className="btn btn-outline" disabled={busy} onClick={() => setStep(2)}><ArrowLeft size={16} />Retour</button><button className="btn btn-lg" disabled={!consent || busy} onClick={submit}>{busy ? <LoadingLabel>Création du dossier…</LoadingLabel> : <>Envoyer à l’Atelier <ArrowRight size={17} /></>}</button></div>
        </> : null}
      </motion.div>
    </AnimatePresence>
    <p className="small muted text-center mt-5">Les éléments détaillés sont analysés par l’Atelier. Une réponse vous sera apportée dans la messagerie sous {businessConfig.claimResponseHours} h ouvrées. En cas d’écart, la traçabilité du lot et les justificatifs sont indispensables.</p>
  </>;
}
