"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Minus, Plus, Save, Snowflake, Tag, Trash2, X } from "lucide-react";
import type { PortalSettings } from "@/lib/portal";
import type { AtelierConfig } from "@/db/schema";
import { saveSettings } from "@/lib/client-api";
import { LoadingLabel, Modal, Toggle } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";

const categoryOptions = [
  { name: "Steaks", image: "/images/cote-boeuf.jpg" },
  { name: "Rôtis", image: "/images/roti-veau.jpg" },
  { name: "Volaille", image: "/images/merguez.jpg" },
  { name: "Agneau / Veau", image: "/images/roti-veau.jpg" },
  { name: "Hachés", image: "/images/merguez.jpg" },
];
const cutOptions = ["Fine (10 mm)", "Moyenne (20 mm)", "Épaisse (25–30 mm)", "Haché au couteau"];
const preparationOptions = ["Parée (sans excès de gras)", "Ficelée", "Bardée", "Désossée", "Salée au point à fond", "Sans gras"];
const allergenOptions = ["Gluten", "Lactose", "Sulfites", "Porc", "Poissons & crustacés", "Céleri", "Sans épices fortes"];

export function AtelierPanel({ settings }: { settings: PortalSettings }) {
  const defaults: AtelierConfig = {
    enabled: true,
    categories: ["Steaks", "Rôtis", "Ficelé", "Hachés"],
    packaging: { individualVacuum: true, kraft: true, coolerCount: 1 },
    detailedLabel: true,
    allergens: ["Gluten", "Sulfites", "Porc", "Sans épices fortes"],
    allergyNotes: "Éviter les préparations avec crème et les traces de fruits à coque.",
    savedAt: null,
  };
  const [preferences, setPreferences] = useState(settings.atelierPreferences);
  const [config, setConfig] = useState<AtelierConfig>(settings.atelierConfig ?? defaults);
  const [addOpen, setAddOpen] = useState(false);
  const [category, setCategory] = useState(categoryOptions[0].name);
  const [cut, setCut] = useState(cutOptions[2]);
  const [preparations, setPreparations] = useState<string[]>(["Parée (sans excès de gras)", "Ficelée"]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { notify, refresh } = usePortal();

  function togglePrep(value: string) {
    setPreparations((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function addPreference() {
    const cleanedNotes = notes.trim().slice(0, 220);
    const instruction = `${category} · ${cut}${preparations.length ? ` · ${preparations.join(", ")}` : ""}${cleanedNotes ? ` — ${cleanedNotes}` : ""}`;
    if (preferences.some((item) => item.toLowerCase() === instruction.toLowerCase())) { setError("Cette consigne existe déjà dans votre cahier."); return; }
    if (preferences.length >= 20) { setError("Vous pouvez conserver 20 consignes au maximum. Supprimez-en une avant d’en ajouter."); return; }
    setPreferences((current) => [...current, instruction]);
    setConfig((current) => ({ ...current, categories: [...new Set([...current.categories, category])] }));
    setNotes(""); setError(""); setAddOpen(false);
    notify("Consigne ajoutée. Enregistrez pour la synchroniser avec le comptoir.");
  }

  async function save() {
    setBusy(true); setError("");
    try {
      await saveSettings({ atelierPreferences: preferences, atelierConfig: config });
      setConfig((current) => ({ ...current, savedAt: new Date().toISOString() }));
      notify("Préférences d’atelier synchronisées avec le comptoir.");
      refresh();
    } catch (caught) { const message = caught instanceof Error ? caught.message : "Enregistrement impossible."; setError(message); notify(message, "error"); }
    finally { setBusy(false); }
  }

  function toggleAllergen(value: string) {
    setConfig((current) => ({ ...current, allergens: current.allergens.includes(value) ? current.allergens.filter((item) => item !== value) : [...current.allergens, value] }));
  }

  return <>
    <div className="info-strip flex items-center justify-between gap-3 flex-wrap"><span className="status status-green">{config.enabled ? `${preferences.length} préférences actives · Synchronisées avec le comptoir` : "Préférences d’atelier en pause"}</span><span className="small muted">Dernière synchronisation : {config.savedAt ? new Date(config.savedAt).toLocaleDateString("fr-FR") : "à enregistrer"}</span></div>

    <section className="card">
      <div className="card-title"><h2>Vos tailles & découpes</h2><div className="flex items-center gap-2"><span className="small muted">Actives</span><Toggle checked={config.enabled} onChange={(enabled) => setConfig({ ...config, enabled })} label="Activer les préférences d’atelier" /></div></div>
      {preferences.length === 0 ? <p className="muted">Aucune consigne enregistrée. Ajoutez votre première exigence de découpe.</p> : <div className="grid md:grid-cols-[290px_1fr] gap-5 items-start">
        <div className="grid grid-cols-2 gap-2">
          {categoryOptions.slice(0, 4).map((entry) => <div key={entry.name} className={`rounded-md overflow-hidden border ${config.categories.includes(entry.name) ? "border-[#6e4d2b]" : "border-[#d8ccb9]"}`}><div className="relative h-[92px]"><Image src={entry.image} alt={entry.name} fill sizes="140px" className="object-cover" /></div><span className="block text-center bg-[#f6ecd8] py-1 text-sm font-medium">{entry.name}</span></div>)}
          <div className={`rounded-md overflow-hidden border col-span-2 ${config.categories.includes("Hachés") ? "border-[#6e4d2b]" : "border-[#d8ccb9]"}`}><div className="relative h-[72px]"><Image src={categoryOptions[4].image} alt="Préparations hachées" fill sizes="280px" className="object-cover" /></div><span className="block text-center bg-[#f6ecd8] py-1 text-sm font-medium">Hachés & préparations</span></div>
        </div>
        <div>
          {preferences.map((preference, index) => <div className="flex gap-2 items-start py-2 border-b border-[#e5ddce]" key={`${preference}-${index}`}><Check size={20} className="text-[#2b0811] shrink-0 mt-0.5" /><span className="flex-1">{preference}</span><button className="close-button" disabled={!config.enabled} onClick={() => setPreferences((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Supprimer la consigne ${preference}`}><X size={17} /></button></div>)}
          <button className="btn mt-4" disabled={!config.enabled} onClick={() => setAddOpen(true)}><Plus size={17} />Ajouter une consigne de découpe</button>
        </div>
      </div>}
      {!config.enabled ? <p className="notice small mt-4">L’Atelier prépare actuellement vos pièces selon ses standards habituels. Réactivez le cahier pour appliquer immédiatement vos consignes à la prochaine commande.</p> : null}
    </section>

    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 mb-4">
      <section className="card m-0">
        <h2>Conditionnement & étiquetage</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button className={`rounded-md overflow-hidden border text-center bg-[#f8f1e2] ${config.packaging.individualVacuum ? "border-[#6e4d2b] ring-1 ring-[#b2925d]" : "border-[#d8ccb9]"}`} onClick={() => setConfig({ ...config, packaging: { ...config.packaging, individualVacuum: !config.packaging.individualVacuum } })}><div className="relative h-20"><Image src="/images/cote-boeuf.jpg" alt="Sous-vide individuel" fill sizes="150px" className="object-cover" /></div><span className="block bg-[#f0e5cd] px-1 py-1.5 text-sm">Sous-vide<br />individuel</span></button>
          <button className={`rounded-md overflow-hidden border text-center bg-[#f8f1e2] ${config.packaging.kraft ? "border-[#6e4d2b] ring-1 ring-[#b2925d]" : "border-[#d8ccb9]"}`} onClick={() => setConfig({ ...config, packaging: { ...config.packaging, kraft: !config.packaging.kraft } })}><div className="relative h-20"><Image src="/images/carte-cadeau.jpg" alt="Papier boucher traditionnel" fill sizes="150px" className="object-cover" /></div><span className="block bg-[#f0e5cd] px-1 py-1.5 text-sm">Papier boucher<br />traditionnel</span></button>
          <div className="rounded-md border border-[#d8ccb9] bg-[#f8f1e2] text-center"><div className="h-20 grid place-items-center bg-[#eee2c7]"><Snowflake size={38} strokeWidth={1.2} /></div><span className="block bg-[#f0e5cd] px-1 py-1 text-[.8rem] leading-tight">Bac isotherme<br /><strong>5,00 € remboursés</strong></span><span className="inline-flex items-center gap-1 p-1"><button className="tool-button w-7 h-7" disabled={config.packaging.coolerCount <= 0} onClick={() => setConfig({ ...config, packaging: { ...config.packaging, coolerCount: config.packaging.coolerCount - 1 } })} aria-label="Réduire le nombre de bacs"><Minus size={14} /></button><strong>{config.packaging.coolerCount}</strong><button className="tool-button w-7 h-7" disabled={config.packaging.coolerCount >= 5} onClick={() => setConfig({ ...config, packaging: { ...config.packaging, coolerCount: config.packaging.coolerCount + 1 } })} aria-label="Augmenter le nombre de bacs"><Plus size={14} /></button></span></div>
        </div>
        <label className="check-row"><input type="checkbox" checked={config.detailedLabel} onChange={(event) => setConfig({ ...config, detailedLabel: event.target.checked })} /><span><strong>Étiquette détaillée</strong> avec poids net, numéro de lot et conseils de cuisson <span className="small muted">(coché/actif)</span></span></label>
      </section>

      <section className="card m-0">
        <h2>Allergènes & restrictions alimentaires</h2>
        <p className="small">Signalez vos allergies ou préférences pour adapter les préparations.</p>
        <div className="flex flex-wrap gap-2">{allergenOptions.map((allergen) => { const active = config.allergens.includes(allergen); return <button key={allergen} className={`chip chip-button ${active ? "bg-[#d6c39b] border-[#82683f]" : ""}`} aria-pressed={active} onClick={() => toggleAllergen(allergen)}>{active ? <Check size={14} /> : null}{allergen}</button>; })}</div>
        <label className="label mt-4" htmlFor="allergy-notes">Notes</label><textarea id="allergy-notes" className="textarea min-h-20" maxLength={500} value={config.allergyNotes} onChange={(event) => setConfig({ ...config, allergyNotes: event.target.value })} placeholder="Précisez vos allergies spécifiques…" />
        <p className="small muted mb-0">Ces informations sont contrôlées par l’Atelier. En cas de doute sur une trace, le boucher vous appelle avant préparation.</p>
      </section>
    </div>

    {error ? <p role="alert" className="notice border-[#b9867e] bg-[#f5e6df] text-[#702e27] mb-3">{error}</p> : null}
    <div className="flex justify-end"><button className="btn btn-lg" disabled={busy} onClick={save}>{busy ? <LoadingLabel>Enregistrement…</LoadingLabel> : <><Save size={18} />Enregistrer mes préférences</>}</button></div>

    <Modal open={addOpen} onClose={() => !busy && setAddOpen(false)} title="Ajouter une consigne de découpe" wide>
      <fieldset className="mb-4"><legend className="font-semibold text-lg mb-2">Catégorie de viande ou morceau</legend><div className="grid grid-cols-5 gap-2">{categoryOptions.map((entry) => <button key={entry.name} onClick={() => setCategory(entry.name)} className={`relative rounded-md overflow-hidden border text-center ${category === entry.name ? "border-[#2b0811] ring-1 ring-[#2b0811]" : "border-[#d8ccb9]"}`}><div className="relative h-[62px]"><Image src={entry.image} alt={entry.name} fill sizes="120px" className="object-cover" /></div><span className="block text-xs px-1 py-1.5 leading-tight min-h-[37px]">{entry.name}{category === entry.name ? <Check size={12} className="inline ml-1" /> : null}</span></button>)}</div></fieldset>
      <fieldset className="mb-4"><legend className="font-semibold text-lg mb-2">Épaisseur ou type de coupe</legend><div className="flex flex-wrap gap-2">{cutOptions.map((option) => <button key={option} className={`chip chip-button ${cut === option ? "bg-[#365f3c] text-white border-[#365f3c]" : "bg-[#fffdf8]"}`} onClick={() => setCut(option)}>{cut === option ? <Check size={14} /> : null}{option}</button>)}</div></fieldset>
      <fieldset className="mb-4"><legend className="font-semibold text-lg mb-2">Préparation & finition</legend><div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">{preparationOptions.map((option) => <label key={option} className="check-row"><input type="checkbox" checked={preparations.includes(option)} onChange={() => togglePrep(option)} /><span>{option}</span></label>)}</div></fieldset>
      <label className="label" htmlFor="consigne-notes">Notes complémentaires pour le boucher</label><textarea id="consigne-notes" className="textarea min-h-16" maxLength={220} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ex. : Tranches régulières pour cuisson au gril, conserver les os à part…" /><div className="text-right small muted">{notes.length}/220</div>
      {error ? <p role="alert" className="small text-[#702e27]">{error}</p> : null}
      <div className="flex gap-3 mt-4"><button className="btn btn-light flex-1" onClick={() => setAddOpen(false)}>Annuler</button><button className="btn flex-1" onClick={addPreference}><Tag size={16} />Ajouter la consigne</button></div>
    </Modal>
  </>;
}
