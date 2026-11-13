"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCircle2, Heart, Minus, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";
import type { PortalData, Product } from "@/lib/portal";
import { loyaltyBalance } from "@/lib/portal-utils";
import { businessConfig } from "@/lib/config";
import { cartLineTotal, cartQuantityLabel } from "@/lib/cart";
import { formatDateLong, formatMoney } from "@/lib/format";
import { EmptyState, LoadingLabel, Modal, PageHeader, ProductThumb, Toggle } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";

const slots = [
  { date: "2026-11-19", label: "10h00 – 10h30" }, { date: "2026-11-19", label: "17h00 – 17h30" },
  { date: "2026-11-20", label: "09h30 – 10h00" }, { date: "2026-11-20", label: "18h00 – 18h30" },
  { date: "2026-11-21", label: "10h00 – 10h30" }, { date: "2026-11-21", label: "17h00 – 17h30" },
  { date: "2026-11-24", label: "12h00 – 12h30" }, { date: "2026-11-25", label: "17h30 – 18h00" },
];

export function OrderComposer({ data, focusProduct }: { data: PortalData; focusProduct?: string }) {
  const [category, setCategory] = useState("Tout l’étal");
  const [query, setQuery] = useState("");
  const [fulfillment, setFulfillment] = useState("Retrait");
  const [slot, setSlot] = useState(`${slots[0].date}|${slots[0].label}`);
  const [usePoints, setUsePoints] = useState(data.settings.applyPoints);
  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const { cart, setCartOpen, notify, refresh } = usePortal();
  const points = loyaltyBalance(data);
  const categories = ["Tout l’étal", ...new Set(data.products.map((product) => product.category))];
  const products = useMemo(() => data.products.filter((product) => (category === "Tout l’étal" || product.category === category) && `${product.name} ${product.description} ${product.origin}`.toLowerCase().includes(query.toLowerCase().trim())), [data.products, category, query]);
  const subtotal = cart.reduce((sum, line) => sum + cartLineTotal(line.product, line.quantity), 0);
  const delivery = fulfillment === "Livraison" && cart.length ? 600 : 0;
  const pointsUsed = usePoints ? Math.min(points, Math.floor((subtotal + delivery) / 10)) : 0;
  const total = subtotal + delivery - pointsUsed * 10;
  const deposit = Math.round(total * .3);

  async function submit() {
    setBusy(true);
    try {
      const [slotDate, slotLabel] = slot.split("|");
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fulfillment, slotDate, slotLabel, usePoints, note }) });
      const payload = await response.json() as { id?: string; error?: string; pointsUsed?: number };
      if (!response.ok) throw new Error(payload.error ?? "Création impossible.");
      setCreatedId(payload.id!); setConfirmOpen(false); notify(`Commande ${payload.id} confirmée dans votre espace.`); refresh(); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) { notify(error instanceof Error ? error.message : "Création impossible.", "error"); }
    finally { setBusy(false); }
  }

  if (createdId) return <motion.section className="card text-center py-10" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}><CheckCircle2 size={62} className="mx-auto text-[#365f3c] mb-4" strokeWidth={1.2} /><span className="eyebrow muted">Commande enregistrée</span><h1 className="mt-2">Merci Marie, votre commande {createdId} est confirmée</h1><p className="max-w-xl mx-auto">Le bon de commande, le suivi du créneau et les préférences de découpe sont disponibles dès maintenant. Le montant reste une estimation jusqu’à la pesée réelle à l’Atelier.</p>{businessConfig.paymentMode === "mock" ? <p className="notice max-w-lg mx-auto"><strong>Démonstration :</strong> l’acompte enregistré est une simulation, aucun débit bancaire n’a été effectué.</p> : null}<div className="actions justify-center mt-5"><Link href={`/commandes/${createdId}`} className="btn btn-lg">Voir ma commande et mon QR code</Link><button className="btn btn-outline btn-lg" onClick={() => setCreatedId("")}>Composer une autre commande</button></div></motion.section>;

  return <>
    <PageHeader title="Composer une commande" description="Choisissez vos pièces au poids, indiquez la découpe et réservez votre passage. Le prix définitif est toujours celui de la pesée au comptoir." action={<button className="btn btn-outline" onClick={() => setCartOpen(true)}><ShoppingBag size={17} />Voir le panier ({cart.length})</button>} />
    <div className="info-strip flex flex-wrap items-center gap-x-6 gap-y-2"><span><strong>1.</strong> Vos pièces</span><span><strong>2.</strong> Vos découpes</span><span><strong>3.</strong> Votre créneau</span><span className="ml-auto small">Retrait offert · Livraison 6 €</span></div>
    <section className="card"><div className="flex flex-wrap gap-2 justify-between items-center mb-4"><div className="flex flex-wrap gap-2">{categories.map((item) => <button key={item} className={`chip chip-button ${category === item ? "chip-selected" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="relative block"><Search size={16} className="absolute left-3 top-2.5 muted" /><input className="input pl-9 py-1.5" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une pièce…" /></label></div>
      {products.length === 0 ? <EmptyState title="Aucune pièce trouvée" text="Essayez une autre famille ou un autre mot-clé." /> : <motion.div layout className="grid md:grid-cols-2 gap-4">{products.map((product) => <ProductCard key={product.id} product={product} focused={focusProduct === product.id} />)}</motion.div>}
    </section>

    <section className="card" id="validation"><div className="card-title"><h2>Votre commande et votre retrait</h2><span className="chip">{cart.reduce((sum, line) => sum + line.quantity, 0)} portion(s)</span></div>
      {cart.length === 0 ? <EmptyState title="Votre composition est vide" text="Ajoutez une pièce depuis l’étal pour choisir ensuite votre créneau." /> : <>
        <div>{cart.map((line) => <CartLine key={line.productId} product={line.product} quantity={line.quantity} initialNote={line.cutNote} />)}</div>
        <div className="grid lg:grid-cols-2 gap-5 mt-5"><div><h3>Mode de réception</h3><div className="grid grid-cols-2 gap-2 mb-4">{["Retrait", "Livraison"].map((mode) => <button key={mode} className={`btn ${fulfillment === mode ? "" : "btn-outline"}`} onClick={() => setFulfillment(mode)}>{mode}{mode === "Livraison" ? " · 6 €" : ""}</button>)}</div>{fulfillment === "Livraison" ? <p className="notice small">Livraison à <strong>{data.settings.addresses.find((address) => address.isDefault)?.line1}, {data.settings.addresses.find((address) => address.isDefault)?.postalCode} {data.settings.addresses.find((address) => address.isDefault)?.city}</strong>. <Link href="/compte/adresses" className="text-button">Modifier</Link></p> : <p className="notice small">{businessConfig.shop}<br />{businessConfig.address}</p>}<label className="label mt-4">Créneau</label><select className="select" value={slot} onChange={(event) => setSlot(event.target.value)}>{slots.map((entry) => <option key={`${entry.date}-${entry.label}`} value={`${entry.date}|${entry.label}`}>{formatDateLong(entry.date)} · {entry.label}</option>)}</select><label className="label mt-4" htmlFor="order-note">Note générale pour l’Atelier</label><textarea id="order-note" className="textarea min-h-20" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Occasion, nombre de convives, conditionnement…" /></div>
          <div className="bg-[#f1eadb] rounded-lg p-4 h-fit"><h3>Récapitulatif</h3><div className="flex justify-between py-1"><span>Sous-total estimé</span><span>{formatMoney(subtotal)}</span></div><div className="flex justify-between py-1"><span>{fulfillment}</span><span>{delivery ? formatMoney(delivery) : "Offert"}</span></div>{points > 0 ? <div className="notice flex items-center justify-between gap-3 my-3"><span><strong>Utiliser mes {points} points</strong><span className="small block">−{formatMoney(pointsUsed * 10)} sur cette commande</span></span><Toggle checked={usePoints} onChange={setUsePoints} label="Utiliser mes points" /></div> : null}<div className="divider" /><div className="flex justify-between text-xl"><strong>Total TTC estimé</strong><strong>{formatMoney(total)}</strong></div><div className="flex justify-between py-1"><span>Acompte de 30 %</span><span>{formatMoney(deposit)}</span></div><div className="flex justify-between py-1"><span>Solde après pesée</span><span>{formatMoney(total - deposit)}</span></div><button className="btn btn-lg w-full mt-4" onClick={() => setConfirmOpen(true)}>Vérifier et confirmer</button><p className="small muted mt-2 mb-0">Aucune commande n’est créée avant votre confirmation explicite.</p></div></div>
      </>}
    </section>

    <Modal open={confirmOpen} onClose={() => !busy && setConfirmOpen(false)} title="Confirmer votre commande"><div className="notice"><strong>{fulfillment} · {formatDateLong(slot.split("|")[0])}</strong><br />{slot.split("|")[1]} · {businessConfig.shop}</div><div className="my-4">{cart.map((line) => <div className="flex justify-between py-1" key={line.productId}><span>{line.product.name} · {cartQuantityLabel(line.product, line.quantity)}</span><span>{formatMoney(cartLineTotal(line.product, line.quantity))}</span></div>)}</div><div className="flex justify-between text-xl border-t border-[#ddd5c4] pt-3"><strong>Total estimé</strong><strong>{formatMoney(total)}</strong></div>{pointsUsed ? <p className="text-[#365f3c]">{pointsUsed} points seront débités de votre cagnotte.</p> : null}<p className="notice small">{businessConfig.paymentMode === "mock" ? `Démonstration : l’acompte de ${formatMoney(deposit)} sera enregistré comme simulé. Aucun débit réel ne sera effectué.` : `Vous allez régler un acompte de ${formatMoney(deposit)}.`} Le total final dépendra de la pesée.</p><button className="btn btn-lg w-full mt-3" disabled={busy} onClick={submit}>{busy ? <LoadingLabel>Création de la commande…</LoadingLabel> : businessConfig.paymentMode === "mock" ? "Confirmer avec acompte simulé" : "Confirmer et payer l’acompte"}</button><button className="btn btn-outline w-full mt-2" disabled={busy} onClick={() => setConfirmOpen(false)}>Revenir à ma composition</button></Modal>
  </>;
}

function ProductCard({ product, focused }: { product: Product; focused: boolean }) {
  const [quantity, setQuantity] = useState(1);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const { addToCart, busy, favorites, toggleFavorite } = usePortal();
  return <motion.article layout id={`produit-${product.id}`} className={`border rounded-lg p-3 bg-[#fffdf8] ${focused ? "border-[#9a753b] ring-2 ring-[#c6a66b]" : "border-[#ddd5c4]"}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
    <div className="flex gap-3"><div className="relative"><ProductThumb src={product.image} alt={product.name} size={112} /><button className={`absolute top-1 right-1 tool-button bg-white/85 ${favorites.includes(product.id) ? "text-[#6b1727]" : ""}`} onClick={() => toggleFavorite(product.id)} aria-label={favorites.includes(product.id) ? "Retirer des favoris" : "Ajouter aux favoris"}><Heart size={18} fill={favorites.includes(product.id) ? "currentColor" : "none"} /></button></div><div className="flex-1 min-w-0"><span className="eyebrow muted">{product.category}</span><h3 className="my-1">{product.name}</h3><strong className="text-xl">{formatMoney(product.priceCents)} <span className="text-sm font-normal">/ {product.unit}</span></strong><p className="small muted mb-1">{product.origin}</p><p className="small line-clamp-2">{product.description}</p></div></div>
    {noteOpen ? <textarea className="textarea min-h-16 mt-3" value={note} maxLength={240} onChange={(event) => setNote(event.target.value)} placeholder="Épaisseur, ficelage, nombre de pièces…" autoFocus /> : null}
    <div className="flex items-center gap-2 mt-3 flex-wrap"><div className="inline-flex items-center border border-[#cfc5b2] rounded-md"><button className="p-2 border-0 bg-transparent" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Diminuer"><Minus size={15} /></button><span className="w-7 text-center">{quantity}</span><button className="p-2 border-0 bg-transparent" onClick={() => setQuantity(Math.min(12, quantity + 1))} aria-label="Augmenter"><Plus size={15} /></button></div><span className="small muted flex-1">{cartQuantityLabel(product, quantity)} · {formatMoney(cartLineTotal(product, quantity))}</span><button className="text-button small" onClick={() => setNoteOpen((open) => !open)}>{noteOpen ? "Masquer la découpe" : "+ Découpe"}</button><button className="btn btn-sm" disabled={busy || !product.available} onClick={() => addToCart(product.id, quantity, note)}><Plus size={14} />Ajouter</button></div>
  </motion.article>;
}

function CartLine({ product, quantity, initialNote }: { product: Product; quantity: number; initialNote: string }) {
  const [note, setNote] = useState(initialNote);
  const { updateCart, removeFromCart, busy } = usePortal();
  return <div className="product-row"><ProductThumb src={product.image} alt={product.name} size={62} /><div className="flex-1"><div className="flex justify-between gap-3"><strong>{product.name}</strong><span className="price">{formatMoney(cartLineTotal(product, quantity))}</span></div><div className="flex items-center gap-2 flex-wrap"><div className="inline-flex items-center"><button className="tool-button" disabled={busy} onClick={() => updateCart(product.id, quantity - 1)}><Minus size={14} /></button><span>{quantity} · {cartQuantityLabel(product, quantity)}</span><button className="tool-button" disabled={busy} onClick={() => updateCart(product.id, quantity + 1)}><Plus size={14} /></button></div><button className="text-button small inline-flex items-center gap-1" onClick={() => removeFromCart(product.id)}><Trash2 size={13} />Retirer</button></div><input className="input py-1.5 mt-2 small" value={note} maxLength={240} onChange={(event) => setNote(event.target.value)} onBlur={() => { if (note !== initialNote) updateCart(product.id, quantity, note); }} placeholder="Instruction de découpe (enregistrée à la sortie du champ)" /></div></div>;
}
