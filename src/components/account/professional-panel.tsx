"use client";

import { useState } from "react";
import { Building2, Check, ChefHat, FileDown, FileText, ReceiptText, Save, TrendingDown } from "lucide-react";
import type { PortalData } from "@/lib/portal";
import { saveSettings } from "@/lib/client-api";
import { formatDate, formatMoney } from "@/lib/format";
import { EmptyState, LoadingLabel, Modal, StatusBadge, Toggle } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";

export function ProfessionalPanel({ data }: { data: PortalData }) {
  const stored = data.settings.professional ?? {};
  const [enabled, setEnabled] = useState(stored.enabled === "true");
  const [form, setForm] = useState({
    company: stored.company ?? "",
    siret: stored.siret ?? "",
    vat: stored.vat ?? "",
    billingEmail: stored.billingEmail ?? data.settings.channels?.email ?? "marie.dupont@email.fr",
  });
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quote, setQuote] = useState({ subject: "", headcount: "20", eventDate: "", details: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { notify, refresh } = usePortal();

  async function saveProfile() {
    setError("");
    if (enabled && !form.company.trim()) { setError("Indiquez la raison sociale pour activer le profil professionnel."); return; }
    if (form.siret && !/^\d{14}$/.test(form.siret)) { setError("Le SIRET doit comporter exactement 14 chiffres."); return; }
    if (form.vat && !/^[A-Z]{2}\d{2}[A-Z0-9]{2,12}$/.test(form.vat.toUpperCase())) { setError("Le numéro de TVA intracommunautaire n’a pas un format valide."); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.billingEmail)) { setError("L’adresse e-mail de facturation est invalide."); return; }
    setBusy(true);
    try {
      await saveSettings({ professional: { ...form, vat: form.vat.toUpperCase(), enabled: String(enabled) } });
      notify(enabled ? "Profil professionnel enregistré." : "Informations professionnelles enregistrées."); refresh();
    } catch (caught) { const message = caught instanceof Error ? caught.message : "Enregistrement impossible."; setError(message); notify(message, "error"); }
    finally { setBusy(false); }
  }

  async function requestQuote() {
    setError("");
    if (quote.subject.trim().length < 3) { setError("Donnez un intitulé à votre événement ou devis."); return; }
    if (!quote.eventDate) { setError("Choisissez la date de l’événement."); return; }
    if (quote.details.trim().length < 20) { setError("Décrivez votre besoin en au moins 20 caractères."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/professional/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...quote, headcount: Number(quote.headcount) }) });
      const payload = await response.json() as { error?: string; id?: string };
      if (!response.ok) throw new Error(payload.error ?? "Demande impossible.");
      notify(`Demande de devis ${payload.id} transmise à l’Atelier.`);
      setQuoteOpen(false); setQuote({ subject: "", headcount: "20", eventDate: "", details: "" }); refresh();
    } catch (caught) { const message = caught instanceof Error ? caught.message : "Demande impossible."; setError(message); notify(message, "error"); }
    finally { setBusy(false); }
  }

  return <>
    <div className="flex items-center gap-2 flex-wrap mb-4"><span className={`status ${enabled ? "status-green" : "status-gold"}`}>{enabled ? <><Check size={14} />Profil professionnel actif</> : "Compte particulier · Passer en profil Pro"}</span><span className="small muted">Facturation, devis traiteur et commandes groupées</span></div>

    <section className="card">
      <div className="card-title"><h2>Profil & informations juridiques</h2><div className="flex items-center gap-2"><Building2 size={28} strokeWidth={1.4} /><Toggle checked={enabled} onChange={(value) => { setEnabled(value); setError(""); }} label="Activer le profil professionnel" /></div></div>
      {!enabled ? <p className="notice small">Votre compte reste un compte particulier. Activez le profil Pro pour rattacher les factures à une entreprise et préparer un devis traiteur.</p> : null}
      <div className="grid sm:grid-cols-2 gap-4 mt-3">
        <label className="sm:col-span-2"><span className="label">Raison sociale</span><input className="input" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="Votre entreprise, association ou collectivité" /></label>
        <label><span className="label">Numéro SIRET</span><input className="input" inputMode="numeric" maxLength={14} value={form.siret} onChange={(event) => setForm({ ...form, siret: event.target.value.replace(/\D/g, "") })} placeholder="ex. 842 519 034 00018" /><span className="field-help">14 chiffres, sans espace.</span></label>
        <label><span className="label">Numéro de TVA intracommunautaire</span><input className="input" value={form.vat} onChange={(event) => setForm({ ...form, vat: event.target.value.toUpperCase() })} placeholder="ex. FR42842519034" /><span className="field-help">Optionnel pour une association non assujettie.</span></label>
        <label className="sm:col-span-2"><span className="label">E-mail de facturation</span><input className="input" type="email" value={form.billingEmail} onChange={(event) => setForm({ ...form, billingEmail: event.target.value })} /></label>
      </div>
      {error ? <p role="alert" className="notice border-[#b9867e] bg-[#f5e6df] text-[#702e27] mt-3">{error}</p> : null}
      <button className="btn w-full mt-4" disabled={busy} onClick={saveProfile}>{busy ? <LoadingLabel>Enregistrement…</LoadingLabel> : <><Save size={16} />Enregistrer les informations</>}</button>
    </section>

    <section className="card mt-4">
      <h2>Avantages & Services B2B Maison Annoix</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {[{ icon: ReceiptText, title: "Factures avec TVA détaillée", text: "Paiement différé à 30 jours pour les comptes professionnels validés." }, { icon: TrendingDown, title: "Tarifs dégressifs", text: "À partir de 15 kg et pour les commandes événementielles." }, { icon: ChefHat, title: "Interlocuteur dédié", text: "L’Atelier vous accompagne pour les découpes sur mesure." }].map((advantage) => { const Icon = advantage.icon; return <div className="rounded-md border border-[#ddd5c4] p-4 text-center bg-[#fffdf8]" key={advantage.title}><Icon size={38} className="mx-auto mb-2" strokeWidth={1.3} /><strong className="block">{advantage.title}</strong><p className="small muted mb-0">{advantage.text}</p></div>; })}
      </div>
    </section>

    <section className="card mt-4">
      <div className="card-title"><h2>Devis & commandes groupées</h2><span className="status status-burgundy">{data.professionalQuotes.length} devis</span></div>
      {data.professionalQuotes.length === 0 ? <EmptyState title="Aucun devis" text="Demandez une proposition adaptée à votre événement ou à votre collectivité." /> : <div className="space-y-2">{data.professionalQuotes.map((entry) => <div className="flex justify-between items-center gap-3 flex-wrap border border-[#ddd5c4] rounded-md p-3" key={entry.id}><div><div className="flex items-center gap-2 flex-wrap"><strong>{entry.id} · {entry.subject}</strong><StatusBadge status={entry.status} /></div><span className="small muted block">{entry.headcount} personnes · {formatDate(entry.eventDate)} · {entry.totalCents > 0 ? formatMoney(entry.totalCents) : "Montant à confirmer"}</span></div><a className="btn btn-outline btn-sm" href={`/api/professional/quotes/${entry.id}/pdf`}><FileDown size={14} />Télécharger PDF</a></div>)}</div>}
      <button className="btn w-full mt-3" onClick={() => setQuoteOpen(true)}><FileText size={16} />Demander un devis sur-mesure</button>
    </section>

    <Modal open={quoteOpen} onClose={() => !busy && setQuoteOpen(false)} title="Demander un devis pour votre événement">
      <label className="label" htmlFor="quote-subject">Intitulé du besoin</label><input id="quote-subject" className="input" value={quote.subject} onChange={(event) => setQuote({ ...quote, subject: event.target.value })} placeholder="Buffet d’entreprise, mariage, séminaire…" />
      <div className="grid sm:grid-cols-2 gap-3 mt-3"><label><span className="label">Nombre de convives</span><input className="input" type="number" min="1" max="5000" value={quote.headcount} onChange={(event) => setQuote({ ...quote, headcount: event.target.value })} /></label><label><span className="label">Date de l’événement</span><input className="input" type="date" min="2026-10-30" value={quote.eventDate} onChange={(event) => setQuote({ ...quote, eventDate: event.target.value })} /></label></div>
      <label className="label mt-3" htmlFor="quote-details">Votre besoin</label><textarea id="quote-details" className="textarea min-h-24" maxLength={1500} value={quote.details} onChange={(event) => setQuote({ ...quote, details: event.target.value })} placeholder="Produits souhaités, service, livraison, contraintes alimentaires…" /><div className="text-right small muted">{quote.details.length}/1500</div>
      <p className="notice small mt-2">La demande est enregistrée dans votre espace. L’Atelier vous recontacte sous 2 jours ouvrés. Aucun paiement n’est demandé à cette étape.</p>
      {error ? <p role="alert" className="notice border-[#b9867e] bg-[#f5e6df] text-[#702e27]">{error}</p> : null}
      <div className="actions mt-4"><button className="btn flex-1" disabled={busy} onClick={requestQuote}>{busy ? <LoadingLabel>Transmission…</LoadingLabel> : "Envoyer ma demande"}</button><button className="btn btn-outline" onClick={() => setQuoteOpen(false)}>Annuler</button></div>
    </Modal>
  </>;
}
