"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, Download, KeyRound, Laptop, LockKeyhole, Mail, MonitorSmartphone, Pause, Phone, RotateCcw, ShieldCheck, ShieldQuestion, Smartphone, Trash2, X } from "lucide-react";
import type { PortalData } from "@/lib/portal";
import { activeVoucherTotal } from "@/lib/portal-utils";
import type { AccountState, SecuritySettings } from "@/db/schema";
import { customer } from "@/lib/config";
import { formatDate, formatTime } from "@/lib/format";
import { saveSettings } from "@/lib/client-api";
import { LoadingLabel, Modal, StatusBadge, Toggle } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";

const defaultSecurity: SecuritySettings = {
  twoFactor: false,
  method: "sms",
  passwordUpdatedAt: "2026-07-29T09:00:00.000Z",
  sessions: [],
  recoveryGeneratedAt: null,
};
const defaultAccount: AccountState = { paused: false, pausedAt: null, deletionRequestedAt: null };

export function SecurityPanel({ data }: { data: PortalData }) {
  const initialChannels = data.settings.channels ?? { phone: "06 12 34 56 78", email: customer.email };
  const [security, setSecurity] = useState<SecuritySettings>(data.settings.security ?? defaultSecurity);
  const [account, setAccount] = useState<AccountState>(data.settings.accountState ?? defaultAccount);
  const [channels, setChannels] = useState(initialChannels);
  const [modal, setModal] = useState<"email" | "phone" | "password" | "recovery" | "delete" | null>(null);
  const [draft, setDraft] = useState("");
  const [passwordDraft, setPasswordDraft] = useState({ current: "", next: "", confirm: "" });
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConsent, setDeleteConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const { notify, refresh } = usePortal();

  const activeOrders = data.orders.filter((order) => !["Retirée", "Livrée", "Annulée"].includes(order.status));
  const credits = activeVoucherTotal(data);
  const maskedPhone = channels.phone.replace(/\d(?=\d{2})/g, "•");
  const currentSession = security.sessions.find((session) => session.current);
  const lastVerification = currentSession?.lastActive ?? security.passwordUpdatedAt;

  async function commitSecurity(next: SecuritySettings, success: string) {
    setBusy(true); setMessage("");
    try {
      await saveSettings({ security: next });
      setSecurity(next);
      notify(success);
      refresh();
      return true;
    } catch (error) { const text = error instanceof Error ? error.message : "Enregistrement impossible."; setMessage(text); notify(text, "error"); return false; }
    finally { setBusy(false); }
  }

  async function updateChannels(email: string, phone: string, success: string) {
    setBusy(true); setMessage("");
    try {
      await saveSettings({ channels: { email, phone } });
      setChannels({ email, phone });
      notify(success); setModal(null); setDraft(""); refresh();
    } catch (error) { const text = error instanceof Error ? error.message : "Enregistrement impossible."; setMessage(text); notify(text, "error"); }
    finally { setBusy(false); }
  }

  const formattedVerification = `${formatDate(lastVerification)} à ${formatTime(lastVerification)}`;

  function openRecovery() {
    const codes = Array.from({ length: 8 }, (_, index) => {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const block = (salt: number) => Array.from({ length: 4 }, (_, charIndex) => alphabet[(index * 17 + charIndex * 7 + salt) % alphabet.length]).join("");
      return `${block(3)}-${block(11)}`;
    });
    setRecoveryCodes(codes);
    setModal("recovery");
    void commitSecurity({ ...security, recoveryGeneratedAt: new Date().toISOString() }, "Nouveaux codes de récupération générés. Ils ne seront plus affichés.");
  }

  async function toggleTwoFactor(value: boolean) {
    await commitSecurity({ ...security, twoFactor: value }, value ? "Double authentification activée." : "Double authentification désactivée.");
  }

  async function setMethod(method: SecuritySettings["method"]) {
    await commitSecurity({ ...security, method }, "Méthode de double authentification mise à jour.");
  }

  async function disconnect(id: string) {
    await commitSecurity({ ...security, sessions: security.sessions.filter((session) => session.id !== id) }, "Appareil déconnecté.");
  }

  async function disconnectAll() {
    await commitSecurity({ ...security, sessions: security.sessions.filter((session) => session.current) }, "Tous les autres appareils ont été déconnectés.");
  }

  async function togglePause() {
    const paused = !account.paused;
    setBusy(true);
    try {
      const next = { ...account, paused, pausedAt: paused ? new Date().toISOString() : null };
      await saveSettings({ accountState: next });
      setAccount(next);
      notify(paused ? "Compte mis en pause. Aucun e-mail non essentiel ne sera envoyé." : "Compte réactivé.");
      refresh();
    } catch (error) { notify(error instanceof Error ? error.message : "Action impossible.", "error"); }
    finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!deleteConsent || deletePassword.length < 6) return;
    setBusy(true);
    try {
      const next = { ...account, deletionRequestedAt: new Date().toISOString() };
      await saveSettings({ accountState: next, privacyRequestAt: new Date().toISOString() });
      setAccount(next);
      notify("Demande de suppression enregistrée. Un e-mail de confirmation vous a été adressé.");
      setModal(null); setDeletePassword(""); setDeleteConsent(false); refresh();
    } catch (error) { notify(error instanceof Error ? error.message : "Demande impossible.", "error"); }
    finally { setBusy(false); }
  }

  async function cancelDeletion() {
    setBusy(true);
    try {
      const next = { ...account, deletionRequestedAt: null };
      await saveSettings({ accountState: next });
      setAccount(next); notify("La demande de suppression a été annulée."); refresh();
    } catch (error) { notify(error instanceof Error ? error.message : "Annulation impossible.", "error"); }
    finally { setBusy(false); }
  }

  function downloadRecoveryCodes() {
    const blob = new Blob([`MAISON ANNOIX — codes de récupération\nCompte : ${customer.email}\nGénérés le ${formatDate(new Date().toISOString())}\n\n${recoveryCodes.join("\n")}\n\nConservez ce fichier hors ligne. Chaque code ne peut être utilisé qu’une fois.`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "maison-annoix-codes-recuperation.txt"; link.click();
    URL.revokeObjectURL(url);
  }

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (passwordDraft.next.length >= 10) score += 1;
    if (/[A-Z]/.test(passwordDraft.next)) score += 1;
    if (/\d/.test(passwordDraft.next)) score += 1;
    if (/[^A-Za-z0-9]/.test(passwordDraft.next)) score += 1;
    return score;
  }, [passwordDraft.next]);

  return <>
    <div className="flex items-center gap-2 flex-wrap mb-4"><span className="status status-green"><ShieldCheck size={14} />Compte protégé · Dernière vérification {formattedVerification}</span>{account.paused ? <StatusBadge status="Compte en pause" /> : null}{account.deletionRequestedAt ? <StatusBadge status="Clôture planifiée" /> : null}</div>
    {message ? <p role="alert" className="notice border-[#b9867e] bg-[#f5e6df] text-[#702e27]">{message}</p> : null}
    {account.deletionRequestedAt ? <div className="notice mb-4"><strong>Une demande de suppression est enregistrée.</strong><p className="small m-0">Elle sera effective après le délai de vérification. Vos commandes en cours restent accessibles et les obligations comptables sont conservées. <button className="text-button" onClick={cancelDeletion}>Annuler la demande</button></p></div> : null}

    <section className="card">
      <h2>Identifiants de connexion</h2>
      <div className="flex justify-between items-center gap-3 flex-wrap border-b border-[#e5ddce] py-3"><div><span className="muted">Adresse e-mail</span><p className="m-0 text-lg">{channels.email} <span className="status status-green ml-1"><Check size={12} />Vérifiée</span></p></div><button className="btn btn-outline btn-sm" onClick={() => { setDraft(channels.email); setModal("email"); }}>Modifier</button></div>
      <div className="flex justify-between items-center gap-3 flex-wrap border-b border-[#e5ddce] py-3"><div><span className="muted">Numéro de téléphone mobile</span><p className="m-0 text-lg">{maskedPhone}</p></div><button className="btn btn-outline btn-sm" onClick={() => { setDraft(channels.phone); setModal("phone"); }}>Modifier</button></div>
      <div className="flex justify-between items-center gap-3 flex-wrap py-3"><div><span className="muted">Mot de passe</span><p className="m-0 text-lg tracking-[.2em]">••••••••••</p></div><span className="small muted">Modifié le {formatDate(security.passwordUpdatedAt)}</span><button className="btn btn-outline btn-sm" onClick={() => { setPasswordDraft({ current: "", next: "", confirm: "" }); setModal("password"); }}>Changer le mot de passe</button></div>
    </section>

    <div className="grid lg:grid-cols-2 gap-4 mt-4">
      <section className="card m-0"><div className="flex justify-between items-start gap-3"><div><h2>Double authentification (2FA)</h2><p className="small muted">Une seconde preuve est demandée lors d’une connexion depuis un appareil inconnu.</p></div><MonitorSmartphone size={38} strokeWidth={1.3} /></div><div className="flex items-center gap-3 mt-2"><Toggle checked={security.twoFactor} onChange={toggleTwoFactor} label="Activer la double authentification" /><span className="font-medium">{security.twoFactor ? "Activée" : "Désactivée"}</span>{busy ? <span className="small muted">Enregistrement…</span> : null}</div>
        <div className="mt-3 space-y-2">{[{ id: "app" as const, label: "Application d’authentification", icon: Smartphone }, { id: "sms" as const, label: "Code par SMS", icon: Phone }, { id: "email" as const, label: "E-mail de secours", icon: Mail }].map((entry) => { const Icon = entry.icon; return <button key={entry.id} disabled={!security.twoFactor} onClick={() => setMethod(entry.id)} className={`w-full flex items-center gap-2 border rounded-md px-3 py-2 text-left ${security.twoFactor && security.method === entry.id ? "bg-[#eadfc8] border-[#82683f]" : "border-[#ddd5c4] bg-[#fffdf8]"}`}><Icon size={19} /><span className="flex-1">{entry.label}</span>{security.twoFactor && security.method === entry.id ? <Check size={18} className="text-[#365f3c]" /> : null}</button>; })}</div>
        <button className="btn btn-outline w-full mt-3" disabled={!security.twoFactor || busy} onClick={openRecovery}><KeyRound size={16} />Générer des codes de récupération</button>
        <p className="small muted mt-2 mb-0">{security.recoveryGeneratedAt ? `Derniers codes générés le ${formatDate(security.recoveryGeneratedAt)}.` : "Aucun code de secours généré."}</p>
      </section>
      <section className="card m-0"><h2>Appareils connectés & historique d’activité</h2><div className="rounded-md bg-[#365f3c] text-white p-3 my-3"><strong>Session actuelle</strong><p className="m-0 small">{security.sessions.find((session) => session.current)?.label ?? "Chrome sur Windows"} · {security.sessions.find((session) => session.current)?.location ?? "Sannois, France"}<br />Cet appareil</p></div><h3>Autres sessions actives</h3>{security.sessions.filter((session) => !session.current).length ? security.sessions.filter((session) => !session.current).map((session) => <div className="flex justify-between items-center gap-2 border-b border-[#e5ddce] py-2" key={session.id}><div><strong>{session.label}</strong><span className="small muted block">{session.location} · dernière activité le {formatDate(session.lastActive)}</span></div><button className="btn btn-outline btn-sm" disabled={busy} onClick={() => disconnect(session.id)}>Déconnecter</button></div>) : <p className="small muted">Aucun autre appareil actif.</p>}<button className="btn w-full mt-3" disabled={busy || security.sessions.filter((session) => !session.current).length === 0} onClick={disconnectAll}>Déconnecter tous les autres appareils</button></section>
    </div>

    <section className="card mt-4"><h2>Données personnelles & gestion du compte</h2><p className="small">Téléchargez une copie de vos commandes, réclamations, avis, mouvements de fidélité et préférences. Les justificatifs comptables sont conservés selon les obligations légales.</p><div className="actions"><a className="btn btn-light" href="/api/export"><Download size={16} />Télécharger mes données personnelles</a><button className="btn btn-light" disabled={busy} onClick={togglePause}><Pause size={16} />{account.paused ? "Réactiver mon compte" : "Mettre le compte en pause"}</button><button className="btn btn-outline" onClick={() => setModal("delete")}><Trash2 size={16} />Supprimer mon compte</button></div><p className="small muted mt-2 mb-0">{account.paused ? `Compte en pause depuis le ${account.pausedAt ? formatDate(account.pausedAt) : "—"}. Les commandes restent consultables, les communications marketing sont arrêtées.` : "La mise en pause suspend uniquement les communications non essentielles et la personnalisation."}</p></section>

    <Modal open={modal === "email"} onClose={() => !busy && setModal(null)} title="Modifier mon adresse e-mail"><label className="label" htmlFor="account-email">Nouvelle adresse e-mail</label><input id="account-email" type="email" className="input" value={draft} onChange={(event) => setDraft(event.target.value)} /><p className="small muted mt-2">Un lien de vérification sera envoyé. L’adresse actuelle reste active jusqu’à confirmation.</p><div className="actions mt-4"><button className="btn" disabled={busy || !/^\S+@\S+\.\S+$/.test(draft)} onClick={() => updateChannels(draft, channels.phone, "Adresse e-mail mise à jour.")}>{busy ? <LoadingLabel>Enregistrement…</LoadingLabel> : "Enregistrer et vérifier"}</button><button className="btn btn-outline" onClick={() => setModal(null)}>Annuler</button></div></Modal>
    <Modal open={modal === "phone"} onClose={() => !busy && setModal(null)} title="Modifier mon numéro mobile"><label className="label" htmlFor="account-phone">Numéro de téléphone mobile</label><input id="account-phone" className="input" inputMode="tel" value={draft} onChange={(event) => setDraft(event.target.value.replace(/[^\d+ ]/g, "").slice(0, 24))} /><p className="small muted mt-2">Utilisé pour les alertes de retrait et la double authentification. Aucun démarchage commercial.</p><div className="actions mt-4"><button className="btn" disabled={busy || draft.replace(/\D/g, "").length < 10} onClick={() => updateChannels(channels.email, draft, "Numéro mobile mis à jour.")}>{busy ? <LoadingLabel>Enregistrement…</LoadingLabel> : "Enregistrer le numéro"}</button><button className="btn btn-outline" onClick={() => setModal(null)}>Annuler</button></div></Modal>
    <Modal open={modal === "password"} onClose={() => !busy && setModal(null)} title="Changer le mot de passe"><div className="notice small mb-3"><ShieldQuestion size={16} className="inline mr-1" />Environnement de démonstration : aucun mot de passe n’est stocké. La date de modification est mise à jour pour illustrer le parcours complet.</div><label className="label">Mot de passe actuel</label><input type="password" className="input mb-3" value={passwordDraft.current} onChange={(event) => setPasswordDraft({ ...passwordDraft, current: event.target.value })} /><label className="label">Nouveau mot de passe</label><input type="password" className="input" value={passwordDraft.next} onChange={(event) => setPasswordDraft({ ...passwordDraft, next: event.target.value })} /><div className="flex gap-1 mt-2">{[0, 1, 2, 3].map((index) => <span key={index} className={`h-1.5 flex-1 rounded ${index < passwordStrength ? "bg-[#365f3c]" : "bg-[#d8d0c1]"}`} />)}</div><p className="small muted">10 caractères minimum, avec majuscule, chiffre et caractère spécial recommandés.</p><label className="label">Confirmer le nouveau mot de passe</label><input type="password" className="input" value={passwordDraft.confirm} onChange={(event) => setPasswordDraft({ ...passwordDraft, confirm: event.target.value })} />{passwordDraft.confirm && passwordDraft.next !== passwordDraft.confirm ? <p className="small text-[#702e27] mt-2">Les deux mots de passe ne correspondent pas.</p> : null}<button className="btn w-full mt-4" disabled={busy || passwordDraft.current.length < 6 || passwordDraft.next.length < 10 || passwordDraft.next !== passwordDraft.confirm} onClick={() => commitSecurity({ ...security, passwordUpdatedAt: new Date().toISOString() }, "Mot de passe modifié. Les autres sessions devraient être revérifiées.").then((ok) => { if (ok) setModal(null); })}>{busy ? <LoadingLabel>Modification…</LoadingLabel> : "Enregistrer le nouveau mot de passe"}</button></Modal>
    <Modal open={modal === "recovery"} onClose={() => setModal(null)} title="Codes de récupération"><p>Conservez ces codes hors ligne. Chacun ne peut être utilisé qu’une seule fois si vous perdez votre second facteur.</p><div className="grid grid-cols-2 gap-2 font-mono text-lg bg-[#eadfc8] rounded-md p-4">{recoveryCodes.map((code) => <span key={code} className="tracking-wider">{code}</span>)}</div><p className="small mt-2">Ces codes ne seront plus affichés après fermeture.</p><div className="actions"><button className="btn" onClick={downloadRecoveryCodes}><Download size={16} />Télécharger les codes</button><button className="btn btn-outline" onClick={() => setModal(null)}>J’ai conservé mes codes</button></div></Modal>
    <Modal open={modal === "delete"} onClose={() => !busy && setModal(null)} title="Supprimer définitivement votre compte"><div className="text-center mb-3"><Trash2 size={38} className="mx-auto text-[#702e27]" strokeWidth={1.4} /></div><p>Cette action est irréversible à l’issue du délai de vérification et effacera votre historique ainsi que vos préférences d’atelier.</p><div className="notice notice-green"><strong>Vérification avant clôture</strong><ul className="mt-1 mb-0 pl-5"><li>{activeOrders.length} commande{activeOrders.length > 1 ? "s" : ""} en cours{activeOrders.length ? ` : ${activeOrders.slice(0, 2).map((order) => order.id).join(", ")}` : ""}</li><li>Avoirs et cagnotte non consommés : {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(credits / 100)}</li></ul><button className="text-button small mt-1" onClick={() => setModal(null)}>Utiliser ou demander le remboursement avant clôture</button></div><label className="label mt-3" htmlFor="delete-password">Saisissez votre mot de passe pour confirmer</label><input id="delete-password" type="password" className="input" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} autoComplete="current-password" /><p className="small muted">(champ de démonstration, 6 caractères minimum)</p><label className="check-row mt-2"><input type="checkbox" checked={deleteConsent} onChange={(event) => setDeleteConsent(event.target.checked)} /><span>Je comprends que la suppression de mon compte Maison Annoix est définitive après le délai de vérification.</span></label><div className="flex gap-3 mt-4"><button className="btn btn-outline flex-1" disabled={busy} onClick={() => setModal(null)}>Annuler</button><button className="btn flex-1" disabled={busy || deletePassword.length < 6 || !deleteConsent} onClick={confirmDelete}>{busy ? <LoadingLabel>Enregistrement…</LoadingLabel> : "Confirmer la suppression"}</button></div></Modal>
  </>;
}
