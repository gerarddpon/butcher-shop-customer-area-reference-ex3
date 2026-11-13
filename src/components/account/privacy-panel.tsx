"use client";

import { useState } from "react";
import { Check, Cookie, Download, FileText, LockKeyhole, Save, ShieldCheck } from "lucide-react";
import type { PortalSettings } from "@/lib/portal";
import type { PrivacySettings } from "@/db/schema";
import { saveSettings } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import { LoadingLabel, Modal, Toggle } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";

const defaultPrivacy: PrivacySettings = {
  orderUpdates: true,
  novelties: true,
  loyalty: true,
  events: false,
  analytics: false,
  personalization: false,
  updatedAt: null,
  policyVersion: "2026-11",
};

export function PrivacyPanel({ settings }: { settings: PortalSettings }) {
  const [privacy, setPrivacy] = useState<PrivacySettings>(settings.privacy ?? defaultPrivacy);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const { notify, refresh } = usePortal();

  function set<K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) {
    setPrivacy((current) => ({ ...current, [key]: value }));
  }

  async function persist(next: PrivacySettings, success: string) {
    setBusy(true); setMessage("");
    try {
      await saveSettings({ privacy: next });
      const saved = { ...next, updatedAt: new Date().toISOString() };
      setPrivacy(saved);
      notify(success);
      refresh();
    } catch (error) { const text = error instanceof Error ? error.message : "Enregistrement impossible."; setMessage(text); notify(text, "error"); }
    finally { setBusy(false); }
  }

  async function saveChoices() {
    await persist(privacy, "Vos choix de confidentialité sont enregistrés.");
  }

  async function refuseAll() {
    const next = { ...privacy, novelties: false, loyalty: false, events: false, analytics: false, personalization: false, orderUpdates: true };
    setPrivacy(next);
    await persist(next, "Tous les traceurs et communications non essentiels ont été refusés.");
  }

  const communication = [
    { key: "orderUpdates" as const, title: "Suivi des commandes et retraits (SMS & E-mail)", text: "alertes de préparation, créneau et code retrait", locked: true },
    { key: "novelties" as const, title: "Nouveautés de l’atelier & arrivages de saison", text: "e-mail mensuel sur les pièces d’exception et élevages partenaires", locked: false },
    { key: "loyalty" as const, title: "Offres fidélité, cagnotte & avantages membres", text: "notifications lors du déblocage d’un bon d’achat ou cadeau", locked: false },
    { key: "events" as const, title: "Invitations aux dégustations & événements en boutique", text: "quelques invitations par an, sur inscription", locked: false },
  ];

  return <>
    <div className="flex items-center gap-2 flex-wrap mb-4"><span className="status status-green"><Check size={14} />Vos choix sont enregistrés · Dernière mise à jour : {privacy.updatedAt ? formatDate(privacy.updatedAt) : "à enregistrer"}</span><span className="small muted">Politique {privacy.policyVersion}</span></div>

    <section className="card">
      <h2>Préférences de communication</h2>
      {communication.map((entry) => <div className="flex justify-between items-start gap-4 border-b border-[#e5ddce] py-4" key={entry.key}><div className="flex-1"><h3 className="text-xl m-0">{entry.title}</h3><p className="small muted m-0">{entry.text}</p></div>{entry.locked ? <span className="status bg-[#d8c49c] text-[#503b1f]"><LockKeyhole size={13} />Indispensable</span> : <Toggle checked={privacy[entry.key]} onChange={(value) => set(entry.key, value)} label={entry.title} />}</div>)}
      <p className="small muted mt-3 mb-0">Les alertes indispensables sont liées à l’exécution de votre commande et ne peuvent pas être désactivées. Aucun usage publicitaire n’en est fait.</p>
    </section>

    <section className="card mt-4">
      <div className="card-title"><h2>Gestion des cookies et traceurs</h2><Cookie size={24} /></div>
      <div className="flex justify-between items-start gap-4 border-b border-[#e5ddce] py-4"><div><h3 className="text-xl m-0">Cookies strictement nécessaires</h3><p className="small muted m-0">panier, connexion sécurisée, choix de boutique</p></div><span className="status bg-[#d8c49c] text-[#503b1f]"><LockKeyhole size={13} />Toujours actifs</span></div>
      <div className="flex justify-between items-start gap-4 border-b border-[#e5ddce] py-4"><div><h3 className="text-xl m-0">Mesure d’audience & amélioration du site</h3><p className="small muted m-0">statistiques anonymisées pour fluidifier la commande</p></div><Toggle checked={privacy.analytics} onChange={(value) => set("analytics", value)} label="Mesure d’audience" /></div>
      <div className="flex justify-between items-start gap-4 py-4"><div><h3 className="text-xl m-0">Personnalisation des suggestions produits</h3><p className="small muted m-0">recommandations basées sur vos préférences d’atelier</p></div><Toggle checked={privacy.personalization} onChange={(value) => set("personalization", value)} label="Personnalisation des suggestions" /></div>
    </section>

    <section className="card mt-4">
      <h2>Vos droits RGPD & registre des consentements</h2>
      <div className="grid sm:grid-cols-2 gap-3"><div className="notice"><strong>Base légale</strong><p className="small m-0">Exécution du contrat & consentement explicite</p></div><div className="notice"><strong>Durée de conservation</strong><p className="small m-0">3 ans après votre dernière commande pour les données de relation client. Les pièces comptables et de traçabilité sont conservées selon les obligations légales.</p></div></div>
      <p className="small mt-3">Vous pouvez retirer votre consentement à tout moment. Les choix sont horodatés et téléchargeables pour garder une trace de votre décision.</p>
      <a className="chip chip-button" href="/api/documents/consents"><ShieldCheck size={15} />Télécharger mon attestation de consentement explicite</a>
      <div className="flex flex-wrap gap-2 mt-4"><button className="btn btn-outline flex-1" onClick={() => setPolicyOpen(true)}>Consulter notre politique de confidentialité</button><a className="btn btn-outline flex-1" href="/api/documents/consents"><Download size={16} />Télécharger mon attestation de consentements (PDF)</a></div>
      <div className="flex flex-wrap gap-2 mt-3"><button className="btn btn-light flex-1" disabled={busy} onClick={refuseAll}>Tout refuser (hors essentiels)</button><button className="btn flex-1" disabled={busy} onClick={saveChoices}>{busy ? <LoadingLabel>Enregistrement…</LoadingLabel> : <><Save size={16} />Enregistrer mes choix</>}</button></div>
      {message ? <p role="alert" className="notice border-[#b9867e] bg-[#f5e6df] text-[#702e27] mt-3">{message}</p> : null}
    </section>

    <Modal open={policyOpen} onClose={() => setPolicyOpen(false)} title="Politique de confidentialité" wide>
      <div className="space-y-4 text-[#4e4338]">
        <div><h3>1. Responsable du traitement</h3><p>Maison Annoix, boucherie-charcuterie, {`Sannois`}. Les données sont utilisées pour préparer, tracer et documenter vos commandes, gérer le service après-vente et votre fidélité.</p></div>
        <div><h3>2. Données et finalités</h3><p>Identité, coordonnées, commandes, lots, poids, réclamations et consentements. Les photos de réclamation servent uniquement à analyser le produit concerné. Les préférences d’atelier sont lues par le boucher avant préparation.</p></div>
        <div><h3>3. Durées et destinataires</h3><p>Les données de relation client sont conservées trois ans après la dernière commande. Les pièces comptables et de traçabilité alimentaire suivent leurs durées légales. Aucun data broker n’a accès à vos données.</p></div>
        <div><h3>4. Vos droits</h3><p>Vous pouvez accéder, rectifier, exporter, demander la limitation ou la suppression de vos données, et retirer un consentement. Les demandes sont enregistrées dans votre espace. En démonstration, aucun e-mail externe n’est envoyé.</p></div>
        <div><h3>5. Cookies</h3><p>Le panier et la session sont nécessaires au service. La mesure d’audience et la personnalisation sont facultatives et désactivées tant que vous ne les acceptez pas.</p></div>
        <div className="notice"><FileText size={17} className="inline mr-2" />Cette politique est fournie à titre de démonstration produit et devra être validée par le responsable de traitement avant mise en production.</div>
        <div className="actions"><button className="btn" onClick={() => setPolicyOpen(false)}>J’ai compris</button><a className="btn btn-outline" href="/api/documents/consents"><Download size={16} />Attestation PDF</a></div>
      </div>
    </Modal>
  </>;
}
