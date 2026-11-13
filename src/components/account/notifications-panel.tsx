"use client";

import { useState } from "react";
import { Bell, Check, Mail, MessageSquare, Newspaper, Save, Smartphone, Ticket } from "lucide-react";
import type { PortalSettings } from "@/lib/portal";
import { formatPhoneInput, saveSettings } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import { LoadingLabel, Modal, Toggle } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";

const notificationDetails = {
  creditsEmail: { title: "E-mail : avoirs, consignes et soldes", text: "Un récapitulatif lorsqu’un avoir est émis, lorsqu’une consigne doit être restituée ou lorsqu’un bon arrive à échéance." },
  newsletter: { title: "Actualités & nouveautés de l’Atelier", text: "Arrivages de saison, pièces d’exception et recettes de l’équipe. Deux envois maximum par mois, sans publicité extérieure." },
};

export function NotificationsPanel({ settings }: { settings: PortalSettings }) {
  const initialPrefs = settings.notificationPrefs ?? {};
  const initialChannels = settings.channels ?? { phone: "06 12 34 56 78", email: "marie.dupont@email.fr" };
  const [prefs, setPrefs] = useState({
    readySms: initialPrefs.readySms ?? true,
    readyEmail: initialPrefs.readyEmail ?? true,
    reminderSms: initialPrefs.reminderSms ?? true,
    reminderEmail: initialPrefs.reminderEmail ?? true,
    creditsEmail: initialPrefs.creditsEmail ?? true,
    newsletter: initialPrefs.newsletter ?? false,
    claimReply: initialPrefs.claimReply ?? true,
    loyalty: initialPrefs.loyalty ?? true,
  });
  const [channels, setChannels] = useState(initialChannels);
  const [editingChannels, setEditingChannels] = useState(false);
  const [detail, setDetail] = useState<keyof typeof notificationDetails | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { notify, refresh } = usePortal();

  function set(key: keyof typeof prefs, value: boolean) {
    setPrefs((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setBusy(true); setError("");
    try {
      await saveSettings({ notificationPrefs: prefs, channels });
      notify("Vos préférences de notifications sont enregistrées.");
      setEditingChannels(false);
      refresh();
    } catch (caught) { const message = caught instanceof Error ? caught.message : "Enregistrement impossible."; setError(message); notify(message, "error"); }
    finally { setBusy(false); }
  }

  const card = (icon: React.ReactNode, title: string, key: keyof typeof prefs, detailKey?: keyof typeof notificationDetails) => <section className="card m-0 flex flex-col">
    <div className="flex gap-3 items-start">
      <span className="grid place-items-center w-[58px] h-[58px] shrink-0 rounded-md bg-[#eadfc8]">{icon}</span>
      <div className="flex-1 min-w-0"><h3 className="m-0 text-lg leading-tight">{title}</h3>{detailKey ? <p className="small muted mt-1 mb-0">Chaque envoi peut être arrêté sans conséquence sur le suivi de vos commandes.</p> : null}</div>
    </div>
    <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-[#e3d9c7]"><span className={`inline-flex items-center gap-1 text-sm font-medium ${prefs[key] ? "text-[#365f3c]" : "text-[#9b8f7d]"}`}>{prefs[key] ? <><Check size={16} />Activé</> : "Désactivé"}</span><Toggle checked={prefs[key]} onChange={(value) => set(key, value)} label={title} /></div>
    {detailKey ? <button className="text-button self-start mt-2" onClick={() => setDetail(detailKey)}>Modifier mes choix</button> : null}
  </section>;

  return <>
    <div className="info-strip rounded-xl">
      <p className="text-[1.09rem] mb-1">Ce que vous déclarez est lu par l’Atelier avant chaque commande — pas par un algorithme.</p>
      <p className="m-0 muted">Les allergènes sont une information de sécurité : ils sont affichés sur la fiche de préparation, jamais utilisés à des fins commerciales.</p>
    </div>

    <section className="card">
      <div className="card-title"><h2>Suivi de commande & retrait</h2><span className="status status-green">Conseillé</span></div>
      <div className="border-b border-[#e3d9c7] pb-4 mb-4">
        <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl mt-1 mb-1">SMS : Commande prête pour retrait</h3><p>Une notification SMS vous est envoyée dès que vos produits frais sont préparés et prêts à être récupérés au comptoir. Pratique pour éviter les files d’attente.</p></div><Toggle checked={prefs.readySms} onChange={(value) => set("readySms", value)} label="SMS commande prête" /></div>
        <p className="small muted mt-2 mb-0">Envoyé au {channels.phone}</p>
      </div>
      <div>
        <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl mt-1 mb-1">E-mail : Commande prête pour retrait</h3><p>Un e-mail de confirmation détaillée est envoyé lorsque la commande est finalisée et prête à l’Atelier. Il contient le créneau, le code retrait et le récapitulatif des poids.</p></div><Toggle checked={prefs.readyEmail} onChange={(value) => set("readyEmail", value)} label="E-mail commande prête" /></div>
        <p className="small muted mt-2 mb-0">Envoyé à {channels.email}</p>
      </div>
    </section>

    <div className="grid sm:grid-cols-2 gap-4 mb-4">
      {card(<Smartphone size={31} strokeWidth={1.4} />, "SMS : Rappel du créneau de retrait", "reminderSms")}
      {card(<Mail size={31} strokeWidth={1.4} />, "E-mail : Rappel du créneau de retrait", "reminderEmail")}
      {card(<Ticket size={31} strokeWidth={1.4} />, "E-mail : Rappel des avoirs & consignes", "creditsEmail", "creditsEmail")}
      {card(<Newspaper size={31} strokeWidth={1.4} />, "Actualités & nouveautés de l’Atelier", "newsletter", "newsletter")}
    </div>

    <section className="card">
      <div className="card-title"><h2>Canaux de réception</h2><Bell size={22} /></div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-md bg-[#eadfc8] p-3"><span className="eyebrow muted">Mobile</span><p className="flex items-center gap-2 mt-1 mb-0 text-lg"><Smartphone size={18} />{channels.phone}</p></div>
        <div className="rounded-md bg-[#eadfc8] p-3"><span className="eyebrow muted">Adresse e-mail</span><p className="flex items-center gap-2 mt-1 mb-0 text-lg break-all"><Mail size={18} />{channels.email}</p></div>
      </div>
      <button className="btn btn-outline mt-3" onClick={() => setEditingChannels((open) => !open)}>Modifier mes coordonnées de réception</button>
      {editingChannels ? <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <label><span className="label">Numéro de mobile</span><input className="input" inputMode="tel" value={channels.phone} onChange={(event) => setChannels({ ...channels, phone: formatPhoneInput(event.target.value) })} placeholder="06 12 34 56 78" /></label>
        <label><span className="label">Adresse e-mail</span><input className="input" type="email" value={channels.email} onChange={(event) => setChannels({ ...channels, email: event.target.value })} /></label>
        <p className="small muted sm:col-span-2 mb-0">Ces coordonnées servent aux notifications de retrait et aux justificatifs. Les e-mails de connexion restent gérés dans Sécurité & accès.</p>
      </div> : null}
      {error ? <p role="alert" className="notice border-[#b9867e] bg-[#f5e6df] text-[#702e27] mt-3">{error}</p> : null}
      <div className="actions mt-4"><button className="btn btn-lg" disabled={busy} onClick={save}>{busy ? <LoadingLabel>Enregistrement…</LoadingLabel> : <><Save size={17} />Enregistrer mes préférences de notifications</>}</button><span className="small muted">Dernière prise en compte : {settings.privacy?.updatedAt ? formatDate(settings.privacy.updatedAt) : "aujourd’hui"}</span></div>
    </section>

    <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? notificationDetails[detail].title : "Préférence de notification"}>
      {detail ? <><p>{notificationDetails[detail].text}</p><div className="notice flex items-center justify-between gap-4"><span><strong>{prefs[detail] ? "Envoi activé" : "Envoi désactivé"}</strong><span className="small block muted">Vous pourrez revenir sur ce choix à tout moment.</span></span><Toggle checked={prefs[detail]} onChange={(value) => set(detail, value)} label={notificationDetails[detail].title} /></div><button className="btn w-full mt-4" onClick={() => setDetail(null)}>Mettre à jour mon choix</button></> : null}
    </Modal>
  </>;
}
