"use client";

import { useRef, useState } from "react";
import { CalendarDays, FileText, Info, Paperclip, Send, X } from "lucide-react";
import type { DetailedOrder } from "@/lib/portal";
import type { OrderAttachment } from "@/db/schema";
import { businessConfig } from "@/lib/config";
import { formatDateLong } from "@/lib/format";
import { LoadingLabel, Modal } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";

const subjects = ["Modification de découpe", "Conditionnement spécifique", "Allergie non liée pesée", "Autre demande particulière"];

export function OrderMessageButton({ order }: { order: DetailedOrder }) {
  const [open, setOpen] = useState(false);
  return <>
    <button className="btn" onClick={() => setOpen(true)}>Envoyer un message à l’atelier</button>
    <AtelierMessageModal order={order} open={open} onClose={() => setOpen(false)} />
  </>;
}

export function AtelierMessageModal({ order, open, onClose }: { order: DetailedOrder; open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<OrderAttachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { notify, refresh } = usePortal();

  function reset() {
    setSelected([]); setMessage(""); setAttachment(null); setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function close() {
    if (busy) return;
    reset();
    onClose();
  }

  async function chooseFile(file?: File) {
    setError("");
    if (!file) return;
    const accepted = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!accepted.includes(file.type)) { setError("Joignez une image JPEG, PNG, WebP ou un PDF."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("La pièce jointe dépasse 5 Mo."); return; }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Lecture impossible"));
      reader.readAsDataURL(file);
    }).catch(() => "");
    if (!dataUrl) { setError("Cette pièce jointe n’a pas pu être lue."); return; }
    setAttachment({ name: file.name.slice(0, 120), type: file.type, size: file.size, dataUrl, kind: file.type.startsWith("image/") ? "image" : "document" });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send() {
    if (message.trim().length < 5) { setError("Précisez votre demande en quelques mots avant l’envoi."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", subject: selected.join(" · ").slice(0, 120), body: message, attachment }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Envoi impossible.");
      notify(`Message transmis à l’Atelier pour ${order.id}.`);
      reset();
      onClose();
      refresh();
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : "Envoi impossible.";
      setError(detail);
      notify(detail, "error");
    } finally { setBusy(false); }
  }

  return <Modal open={open} onClose={close} title="Envoyer un message à l’atelier">
    <div className="text-[#4e4338]">
      <p className="mb-4">Pour la commande <strong>{order.id}</strong> ({order.items.map((item) => `${item.quantityLabel} ${item.product.name}`).join(", ")}).</p>
      <fieldset>
        <legend className="font-semibold text-lg mb-2">Sujet de votre message</legend>
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => {
            const active = selected.includes(subject);
            return <button key={subject} type="button" className={`chip chip-button rounded-md px-3 py-1.5 ${active ? "bg-[#365f3c] text-white border-[#365f3c] hover:bg-[#2f5335]" : "bg-[#fbfaf6] border-[#c9bfab]"}`} aria-pressed={active} onClick={() => setSelected((current) => active ? current.filter((entry) => entry !== subject) : current.length >= 3 ? current : [...current, subject])}>{subject}</button>;
          })}
        </div>
      </fieldset>

      <div className="mt-5"><span className="font-semibold text-lg block mb-1">Date et créneau de retrait</span><span className="inline-flex items-center gap-2"><CalendarDays size={19} />{formatDateLong(order.slotDate)} · {order.slotLabel}</span></div>

      <label htmlFor="atelier-message" className="font-semibold text-lg block mt-5 mb-2">Votre message</label>
      <textarea id="atelier-message" className="textarea min-h-32 text-base" maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Précisez votre demande ici…" />
      <div className="text-right small muted">{message.length}/1000</div>

      <div className="mt-4">
        <span className="font-semibold text-lg block mb-2">Pièce jointe (facultatif)</span>
        {attachment ? <div className="flex items-center gap-2 flex-wrap mb-2"><div className="flex items-center gap-2 border border-[#cfc5b2] rounded-md bg-[#f4eedf] px-2 py-1.5 min-w-0 flex-1">{attachment.kind === "image" ? <img src={attachment.dataUrl} alt={attachment.name} className="w-9 h-9 rounded object-cover" /> : <FileText size={26} />}<span className="truncate text-sm">{attachment.name}</span><button type="button" className="close-button w-6 h-6 ml-auto" aria-label="Retirer la pièce jointe" onClick={() => setAttachment(null)}><X size={15} /></button></div></div> : null}
        <input ref={fileRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => chooseFile(event.target.files?.[0])} />
        <button type="button" className="btn bg-[#365f3c] hover:bg-[#2f5335]" onClick={() => fileRef.current?.click()}><Paperclip size={16} />Joindre un fichier</button>
        <span className="small muted ml-2">5 Mo maximum · image ou PDF</span>
      </div>

      <div className="mt-5"><p className="font-semibold text-lg m-0">Important</p><p className="italic text-[#4e4338] text-sm mt-1"><Info size={14} className="inline mr-1" />Votre demande sera transmise à l’atelier avant la préparation. Nous vous enverrons une confirmation par e-mail après validation par le boucher.</p></div>
      {error ? <p role="alert" className="notice border-[#b9867e] bg-[#f5e6df] text-[#702e27]">{error}</p> : null}
      <div className="flex gap-3 mt-5"><button type="button" className="btn btn-light flex-1" disabled={busy} onClick={close}>Annuler</button><button type="button" className="btn flex-[1.25]" disabled={busy || message.trim().length < 5} onClick={send}>{busy ? <LoadingLabel>Envoi…</LoadingLabel> : <><Send size={16} />Envoyer le message</>}</button></div>
      <p className="small muted text-center mt-3 mb-0">Message conservé dans l’historique de {order.id} · Atelier joignable au {businessConfig.phone}</p>
    </div>
  </Modal>;
}
