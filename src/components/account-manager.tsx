"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell, CalendarDays, Pause, Play, Download, FileDown, Heart,
  MapPin, Pencil, Plus, ShieldCheck, ShoppingBag, Trash2, UserRound,
} from "lucide-react";
import type { PortalData } from "@/lib/portal";
import type { Address } from "@/db/schema";
import { businessConfig, customer } from "@/lib/config";
import { formatDate, formatDateLong, formatMoney } from "@/lib/format";
import { EmptyState, LoadingLabel, Modal, PageHeader, ProductThumb, StatusBadge, Toggle } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";
import { NotificationsPanel } from "@/components/account/notifications-panel";
import { AtelierPanel } from "@/components/account/atelier-panel";
import { SecurityPanel } from "@/components/account/security-panel";
import { PrivacyPanel } from "@/components/account/privacy-panel";
import { ProfessionalPanel } from "@/components/account/professional-panel";

export type AccountSection = "abonnements" | "factures" | "paiements" | "avoirs" | "preferences" | "atelier" | "favoris" | "adresses" | "notifications" | "securite" | "professionnel" | "confidentialite" | "maison";

const headers: Record<AccountSection, { title: string; description: string }> = {
  abonnements: { title: "Vos abonnements", description: "Le panier habituel reste flexible : mettez-le en pause, reprenez-le ou arrêtez-le avant la prochaine préparation." },
  factures: { title: "Factures & documents", description: "Bons de commande, factures d’acompte et avoirs, générés à partir des montants et des lots réellement enregistrés." },
  paiements: { title: "Paiements", description: "Suivez chaque acompte et chaque solde. En démonstration, les règlements sont explicitement simulés et ne provoquent aucun débit." },
  avoirs: { title: "Avoirs & consignes", description: "Retrouvez vos crédits disponibles, les avoirs déjà utilisés et les consignes de bacs isothermes à restituer." },
  preferences: { title: "Préférences du compte", description: "Réglez votre confort d’utilisation et retrouvez les informations rattachées à votre espace client." },
  atelier: { title: "Préférences d’atelier", description: "Enregistrez vos exigences de découpe, de cuisson et d’étiquetage : nos bouchers les appliquent automatiquement à chaque commande." },
  favoris: { title: "Vos favoris", description: "Votre sélection habituelle, synchronisée avec l’étal et le panier." },
  adresses: { title: "Vos adresses", description: "Gérez les adresses proposées pour vos livraisons en bac isotherme." },
  notifications: { title: "Mes préférences de Notifications", description: "Ce que vous déclarez est lu par l’Atelier avant chaque commande — pas par un algorithme. Les allergènes restent une information de sécurité." },
  securite: { title: "Sécurité et accès", description: "Gérez vos identifiants de connexion, sécurisez votre compte et contrôlez vos données personnelles en toute autonomie." },
  professionnel: { title: "Espace Professionnel & Entreprise", description: "Gérez vos informations de facturation B2B, vos devis traiteur et vos commandes groupées pour vos événements." },
  confidentialite: { title: "Vie privée", description: "Contrôlez l’utilisation de vos données personnelles, vos préférences de communication et vos consentements RGPD en toute transparence." },
  maison: { title: "La Maison Annoix", description: "Une boucherie de quartier, une cave de maturation et une équipe qui connaît la provenance de chaque pièce." },
};

const emptyAddress: Address = { id: "", label: "", recipient: customer.name, line1: "", postalCode: "", city: "", isDefault: false };

export function AccountManager({ section, data }: { section: AccountSection; data: PortalData }) {
  const { notify, refresh, comfort, setComfort, addToCart, toggleFavorite } = usePortal();
  const [busy, setBusy] = useState("");
  const [preferences, setPreferences] = useState(data.settings.atelierPreferences);
  const [newPreference, setNewPreference] = useState("");
  const [addresses, setAddresses] = useState(data.settings.addresses);
  const [addressOpen, setAddressOpen] = useState(false);
  const [addressDraft, setAddressDraft] = useState<Address>(emptyAddress);
  const [notifications, setNotifications] = useState(data.settings.notificationPrefs);
  const [professional, setProfessional] = useState({ company: data.settings.professional.company ?? "", siret: data.settings.professional.siret ?? "", vat: data.settings.professional.vat ?? "", billingEmail: data.settings.professional.billingEmail ?? customer.email });

  async function savePrefs(payload: Record<string, unknown>, message: string, key = "preferences") {
    setBusy(key);
    try {
      const response = await fetch("/api/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Enregistrement impossible.");
      notify(message); refresh(); return true;
    } catch (error) { notify(error instanceof Error ? error.message : "Enregistrement impossible.", "error"); return false; }
    finally { setBusy(""); }
  }

  async function subscriptionStatus(id: string, status: string) {
    setBusy(id);
    try {
      const response = await fetch(`/api/subscriptions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error("Modification impossible.");
      notify(status === "Actif" ? "Abonnement repris." : status === "En pause" ? "Abonnement mis en pause." : "Abonnement annulé."); refresh();
    } catch (error) { notify(error instanceof Error ? error.message : "Modification impossible.", "error"); }
    finally { setBusy(""); }
  }

  async function saveAddressList(next: Address[], message: string) {
    const saved = await savePrefs({ addresses: next }, message, "addresses");
    if (saved) setAddresses(next);
    return saved;
  }

  async function submitAddress() {
    if (!addressDraft.label.trim() || !addressDraft.line1.trim() || !/^\d{5}$/.test(addressDraft.postalCode) || !addressDraft.city.trim()) { notify("Complétez le libellé, la rue, le code postal à 5 chiffres et la ville.", "error"); return; }
    const id = addressDraft.id || `address-${Date.now()}`;
    const exists = addresses.some((address) => address.id === id);
    let next = exists ? addresses.map((address) => address.id === id ? { ...addressDraft, id } : address) : [...addresses, { ...addressDraft, id }];
    if (addressDraft.isDefault || next.length === 1) next = next.map((address) => ({ ...address, isDefault: address.id === id }));
    if (await saveAddressList(next, exists ? "Adresse modifiée." : "Adresse ajoutée.")) { setAddressOpen(false); setAddressDraft(emptyAddress); }
  }

  const favoriteProducts = data.products.filter((product) => data.settings.favoriteProductIds.includes(product.id));

  function content() {
    if (section === "notifications") return <NotificationsPanel settings={data.settings} />;
    if (section === "atelier") return <AtelierPanel settings={data.settings} />;
    if (section === "securite") return <SecurityPanel data={data} />;
    if (section === "confidentialite") return <PrivacyPanel settings={data.settings} />;
    if (section === "professionnel") return <ProfessionalPanel data={data} />;
    if (section === "abonnements") return <div className="grid md:grid-cols-2 gap-4">{data.subscriptions.map((subscription) => <section className="card m-0" key={subscription.id}><div className="card-title"><span className="eyebrow muted">{subscription.cadence}</span><StatusBadge status={subscription.status} /></div><h2>{subscription.name}</h2><p>{subscription.description}</p><div className="divider" /><p><strong>Prochaine préparation :</strong><br />{formatDateLong(subscription.nextDate)}</p><div className="big-number">{formatMoney(subscription.amountCents)}</div><p className="small muted">Montant estimé, confirmé après pesée. Composition modifiable jusqu’à 48 h avant.</p><div className="actions">{subscription.status !== "Actif" ? <button className="btn" disabled={busy === subscription.id} onClick={() => subscriptionStatus(subscription.id, "Actif")}><Play size={16} />Reprendre</button> : <button className="btn btn-outline" disabled={busy === subscription.id} onClick={() => subscriptionStatus(subscription.id, "En pause")}><Pause size={16} />Mettre en pause</button>}{subscription.status !== "Annulé" ? <button className="text-button" disabled={busy === subscription.id} onClick={() => subscriptionStatus(subscription.id, "Annulé")}>Annuler l’abonnement</button> : null}</div></section>)}</div>;

    if (section === "factures") return <><section className="card"><div className="card-title"><h2>Documents de commande</h2><span className="chip">{data.orders.length} commandes</span></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Commande</th><th>Date</th><th>Total TTC</th><th>Paiement</th><th>Documents</th></tr></thead><tbody>{data.orders.map((order) => <tr key={order.id}><td><Link className="text-button" href={`/commandes/${order.id}`}>{order.id}</Link></td><td>{formatDate(order.placedAt)}</td><td>{formatMoney(order.totalCents)}</td><td><StatusBadge status={order.paymentStatus} /></td><td><div className="actions"><a className="btn btn-sm" href={`/api/documents/${order.id}/commande`}><FileDown size={14} />Bon PDF</a><a className="btn btn-outline btn-sm" href={`/api/documents/${order.id}/facture`}><Download size={14} />Facture PDF</a></div></td></tr>)}</tbody></table></div></section><section className="card"><h2>Avoirs et résolutions</h2>{data.claims.filter((claim) => claim.creditCents > 0).map((claim) => <div className="flex justify-between items-center gap-3 flex-wrap border-b border-[#e5ddce] py-3" key={claim.id}><div><strong>{claim.id} · {claim.item.product.name}</strong><span className="small muted block">{claim.motif} · {formatMoney(claim.creditCents)}</span></div><a className="btn btn-sm" href={`/api/documents/${claim.orderId}/avoir-${claim.id}`}><Download size={14} />Avoir PDF</a></div>)}</section></>;

    if (section === "paiements") { const paid = data.orders.reduce((sum, order) => sum + order.depositCents, 0); const due = data.orders.reduce((sum, order) => sum + order.balanceCents, 0); return <><div className="grid sm:grid-cols-2 gap-4 mb-4"><div className="kraft p-5"><h2>Acomptes enregistrés</h2><div className="big-number">{formatMoney(paid)}</div><p className="small">Dont montants explicitement simulés dans cet environnement.</p></div><div className="kraft p-5"><h2>Soldes au comptoir</h2><div className="big-number">{formatMoney(due)}</div><p className="small">Le montant final dépend toujours de la pesée.</p></div></div><section className="card"><div className="table-wrap"><table className="data-table"><thead><tr><th>Commande</th><th>Total</th><th>Acompte</th><th>Solde</th><th>État</th><th>Action</th></tr></thead><tbody>{data.orders.map((order) => <tr key={order.id}><td>{order.id}</td><td>{formatMoney(order.totalCents)}</td><td>{formatMoney(order.depositCents)}</td><td>{formatMoney(order.balanceCents)}</td><td><StatusBadge status={order.paymentStatus} /></td><td><Link className="btn btn-sm" href={`/commandes/${order.id}#actions`}>{order.balanceCents > 0 ? "Régler / suivre" : "Voir le reçu"}</Link></td></tr>)}</tbody></table></div></section></>; }

    if (section === "avoirs") return <><div className="info-strip">Les bons et avoirs sont utilisables au comptoir selon leur date de validité. La consigne du bac est restituée séparément lors de son retour.</div><div className="grid md:grid-cols-2 gap-4">{data.vouchers.map((voucher) => { const claim = data.claims.find((entry) => voucher.id.includes(entry.id.replace("SAV-", ""))); return <section className="card m-0" key={voucher.id}><div className="card-title"><span className="eyebrow muted">{voucher.kind}</span><StatusBadge status={voucher.status} /></div><h2>{voucher.label}</h2><div className="big-number">{formatMoney(voucher.valueCents)}</div><p className="mt-2">Code : <strong>{voucher.id}</strong></p><p className="small muted">{voucher.kind === "Consigne" ? "Restitution au comptoir contre remboursement." : `Valable jusqu’au ${formatDate(voucher.expiresAt)}`}</p><div className="actions">{claim ? <a className="btn btn-sm" href={`/api/documents/${claim.orderId}/avoir-${claim.id}`}><Download size={14} />Document PDF</a> : null}<Link href="/cagnotte" className="btn btn-outline btn-sm">Voir dans la cagnotte</Link></div></section>; })}</div></>;

    if (section === "preferences") return <div className="grid md:grid-cols-2 gap-4"><section className="card m-0"><div className="card-title"><h2>Votre profil</h2><UserRound /></div><dl><dt className="font-semibold">Nom au comptoir</dt><dd>{customer.name}</dd><dt className="font-semibold">Adresse e-mail</dt><dd>{customer.email}</dd><dt className="font-semibold">Boutique principale</dt><dd>{businessConfig.shop}</dd><dt className="font-semibold">Cliente depuis</dt><dd>{customer.memberSince}</dd></dl><p className="notice small">Pour modifier votre identité ou votre e-mail de connexion, contactez le comptoir afin de préserver le rapprochement avec vos anciennes factures.</p></section><section className="card m-0"><h2>Affichage et fidélité</h2><div className="flex justify-between items-center gap-3 border-b border-[#e5ddce] py-4"><span><strong>Confort de lecture</strong><span className="small muted block">Texte agrandi et interligne renforcé.</span></span><Toggle checked={comfort} onChange={setComfort} label="Confort de lecture" /></div><div className="flex justify-between items-center gap-3 py-4"><span><strong>Proposer mes points au prochain panier</strong><span className="small muted block">Vous garderez le choix avant la validation.</span></span><Toggle checked={data.settings.applyPoints} onChange={(value) => savePrefs({ applyPoints: value }, "Préférence fidélité enregistrée.")} label="Proposer mes points" /></div><Link href="/compte/notifications" className="btn btn-outline">Régler mes notifications</Link></section></div>;


    if (section === "favoris") return favoriteProducts.length ? <div className="grid md:grid-cols-2 gap-4">{favoriteProducts.map((product) => <section className="card m-0" key={product.id}><div className="product-row"><ProductThumb src={product.image} alt={product.name} size={92} /><div><h2>{product.name}</h2><p className="small muted">{product.origin}</p><strong>{formatMoney(product.priceCents)} / {product.unit}</strong></div></div><p>{product.description}</p><div className="actions"><button className="btn" onClick={() => addToCart(product.id)}><ShoppingBag size={16} />Ajouter au panier</button><button className="btn btn-outline" onClick={() => toggleFavorite(product.id)}><Heart size={16} fill="currentColor" />Retirer des favoris</button></div></section>)}</div> : <div className="card"><EmptyState title="Aucun favori" text="Ajoutez des pièces depuis l’étal pour les retrouver ici." action={<Link className="btn" href="/composer">Voir l’étal</Link>} /></div>;

    if (section === "adresses") return <><div className="actions mb-4"><button className="btn" onClick={() => { setAddressDraft({ ...emptyAddress, isDefault: addresses.length === 0 }); setAddressOpen(true); }}><Plus size={16} />Ajouter une adresse</button></div><div className="grid md:grid-cols-2 gap-4">{addresses.map((address) => <section className="card m-0" key={address.id}><div className="card-title"><h2><MapPin size={20} className="inline mr-1" />{address.label}</h2>{address.isDefault ? <StatusBadge status="Par défaut" /> : null}</div><p><strong>{address.recipient}</strong><br />{address.line1}<br />{address.postalCode} {address.city}</p><div className="actions"><button className="btn btn-sm" onClick={() => { setAddressDraft(address); setAddressOpen(true); }}><Pencil size={14} />Modifier</button>{!address.isDefault ? <button className="btn btn-outline btn-sm" onClick={() => saveAddressList(addresses.map((item) => ({ ...item, isDefault: item.id === address.id })), "Adresse par défaut modifiée.")}>Utiliser par défaut</button> : null}<button className="text-button" onClick={() => { const remaining = addresses.filter((item) => item.id !== address.id); if (address.isDefault && remaining[0]) remaining[0] = { ...remaining[0], isDefault: true }; saveAddressList(remaining, "Adresse supprimée."); }}><Trash2 size={14} />Supprimer</button></div></section>)}</div>{addresses.length === 0 ? <div className="card"><EmptyState title="Aucune adresse" text="Ajoutez une adresse pour proposer la livraison." /></div> : null}</>;





    return <div className="space-y-4"><section className="kraft p-7"><span className="eyebrow">Boucherie de caractère · Sannois</span><h2 className="text-4xl mt-2">Une maison de découpe, pas un rayon.</h2><p className="max-w-3xl text-lg">Depuis 1987, la Maison Annoix choisit des carcasses auprès d’éleveurs identifiés, mature ses pièces sur os et découpe à la commande. Le comptoir numérique prolonge ce geste : vous savez qui a préparé la viande, d’où elle vient et comment la conserver.</p></section><div className="grid md:grid-cols-3 gap-4"><section className="card m-0"><h2>Le comptoir</h2><p>{businessConfig.address}</p><p>Mardi – vendredi · 8h30–13h / 15h–19h<br />Samedi · 8h–19h<br />Dimanche · 9h–12h30</p><a className="btn" href={businessConfig.phoneHref}>{businessConfig.phone}</a></section><section className="card m-0"><h2>Nos éleveurs</h2><p><strong>Ferme des Coteaux · Val-d’Oise</strong><br />Limousine, maturation Maison.</p><p><strong>Ferme de Belair · Corrèze</strong><br />Veau fermier élevé sous la mère.</p><p><strong>Domaine d’En Clarens · Gers</strong><br />Canards fermiers IGP Sud-Ouest.</p></section><section className="card m-0" id="garantie"><h2>Garantie fraîcheur</h2><p>Un doute à l’ouverture ? Ne consommez pas le produit. Conservez l’étiquette, prenez une photo et ouvrez un dossier sous 48 h.</p><p>L’Atelier contrôle le lot, les températures et le conditionnement avant toute résolution.</p><Link href="/reclamations/nouvelle" className="btn">Ouvrir une réclamation</Link></section></div><section className="card" id="a-propos"><h2>Notre manière de travailler</h2><div className="grid md:grid-cols-3 gap-5"><div><h3>Découpe au couteau</h3><p>Le haché est préparé à la commande, jamais stocké pré-haché. Vos épaisseurs et ficelages sont inscrits sur le bon de travail.</p></div><div><h3>Poids juste</h3><p>Les estimations en ligne sont remplacées par le poids réel à la préparation. Vous voyez le détail de chaque ligne avant de régler le solde.</p></div><div><h3>Anti-gaspillage</h3><p>Les pièces sont valorisées en fonction de leur maturité. Les abonnements sont composés selon les arrivages plutôt que sur une liste rigide.</p></div></div></section><section className="card" id="conditions"><h2>Retrait, annulation et rétractation</h2><p>Le créneau peut être modifié en ligne jusqu’à 24 h avant le retrait. Pour un délai plus court, appelez le comptoir : une pièce déjà découpée ne peut pas toujours être réaffectée.</p><p>Les produits alimentaires frais, découpés ou pesés à votre demande ne bénéficient pas du droit de rétractation de 14 jours. Cette règle ne limite jamais la garantie fraîcheur ni le traitement d’un article non conforme.</p><p>Les cartes-cadeaux sont valables douze mois. Les avoirs ne sont pas remboursables en espèces. La consigne d’un bac isotherme est restituée à son retour en bon état.</p></section></div>;
  }

  return <><PageHeader title={headers[section].title} description={headers[section].description} />{content()}
    <Modal open={addressOpen} onClose={() => setAddressOpen(false)} title={addressDraft.id ? "Modifier l’adresse" : "Ajouter une adresse"}><div className="grid sm:grid-cols-2 gap-3"><label><span className="label">Libellé</span><input className="input" value={addressDraft.label} onChange={(e) => setAddressDraft({ ...addressDraft, label: e.target.value })} placeholder="Maison, bureau…" /></label><label><span className="label">Destinataire</span><input className="input" value={addressDraft.recipient} onChange={(e) => setAddressDraft({ ...addressDraft, recipient: e.target.value })} /></label></div><label className="label mt-3">Adresse</label><input className="input" value={addressDraft.line1} onChange={(e) => setAddressDraft({ ...addressDraft, line1: e.target.value })} placeholder="Numéro et rue" /><div className="grid sm:grid-cols-2 gap-3 mt-3"><label><span className="label">Code postal</span><input className="input" inputMode="numeric" maxLength={5} value={addressDraft.postalCode} onChange={(e) => setAddressDraft({ ...addressDraft, postalCode: e.target.value.replace(/\D/g, "") })} /></label><label><span className="label">Ville</span><input className="input" value={addressDraft.city} onChange={(e) => setAddressDraft({ ...addressDraft, city: e.target.value })} /></label></div><label className="check-row mt-4"><input type="checkbox" checked={addressDraft.isDefault} onChange={(e) => setAddressDraft({ ...addressDraft, isDefault: e.target.checked })} />Utiliser comme adresse de livraison par défaut</label><button className="btn w-full mt-4" disabled={busy === "addresses"} onClick={submitAddress}>{busy === "addresses" ? <LoadingLabel>Enregistrement…</LoadingLabel> : "Enregistrer l’adresse"}</button></Modal>
  </>;
}
