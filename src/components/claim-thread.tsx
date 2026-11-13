"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChefHat, FileImage, Send, UserRound } from "lucide-react";
import type { ClaimMessage } from "@/lib/portal";
import type { ClaimPhoto } from "@/db/schema";
import { formatDate, formatTime } from "@/lib/format";
import { LoadingLabel } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";

export function ClaimThread({ claimId, messages, photos, resolved }: { claimId: string; messages: ClaimMessage[]; photos: ClaimPhoto[]; resolved: boolean }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { notify, refresh } = usePortal();
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [messages.length]);

  async function send() {
    if (message.trim().length < 2) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/claims/${claimId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: message }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Envoi impossible.");
      setMessage("");
      notify(resolved ? "Message ajouté : le dossier est rouvert pour analyse." : "Votre message est ajouté au dossier.");
      refresh();
    } catch (error) { notify(error instanceof Error ? error.message : "Envoi impossible.", "error"); }
    finally { setBusy(false); }
  }

  return <section className="card">
    <div className="card-title"><h2>Fil de discussion avec l’atelier</h2><span className="chip">{messages.length} message{messages.length > 1 ? "s" : ""}</span></div>
    {resolved ? <p className="notice small">Ce dossier est résolu. Envoyer un nouveau message le rouvrira automatiquement pour analyse.</p> : null}
    <div className="scroll-area max-h-[560px] pr-2 py-2">
      <AnimatePresence initial={false}>
        {messages.map((entry) => {
          const isClient = entry.author === "client";
          const attachment = entry.attachment ? photos.find((photo) => photo.name === entry.attachment) : undefined;
          return <motion.article key={entry.id} className={`flex gap-2 mb-3 ${isClient ? "flex-row" : "flex-row-reverse"}`} initial={{ opacity: 0, y: 14, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
            <span className="grid place-items-center w-9 h-9 rounded-full bg-[#e8dfcc] shrink-0">{isClient ? <UserRound size={20} /> : <ChefHat size={20} />}</span>
            <div className={`max-w-[88%] rounded-lg px-4 py-3 ${isClient ? "bg-[#17264c] text-white rounded-tr-sm" : "bg-[#282824] text-[#fffaf0] rounded-tl-sm"}`}>
              <div className="text-xs opacity-65 mb-1">{isClient ? "Vous" : "Atelier de Sannois"} · {formatDate(entry.createdAt)} à {formatTime(entry.createdAt)}</div>
              <p className="m-0 whitespace-pre-wrap">{entry.body}</p>
              {entry.attachment ? <div className="flex items-center gap-2 bg-[#e9e6dc] text-[#2b211b] rounded px-2 py-1.5 mt-2">{attachment ? <img src={attachment.dataUrl} alt={entry.attachment} className="w-10 h-10 object-cover rounded" /> : <FileImage size={20} />}<span className="small">{entry.attachment}</span></div> : null}
            </div>
          </motion.article>;
        })}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
    <div className="border-t border-[#ddd5c4] pt-4 mt-2">
      <label className="label" htmlFor="claim-reply">Ajouter une précision</label>
      <textarea id="claim-reply" className="textarea min-h-20" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1500} placeholder="Une information sur la conservation, le lot ou la résolution…" onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") send(); }} />
      <div className="flex justify-between items-center gap-3 mt-2"><span className="small muted">{message.length}/1500 · Ctrl + Entrée pour envoyer</span><button className="btn" disabled={busy || message.trim().length < 2} onClick={send}>{busy ? <LoadingLabel>Envoi…</LoadingLabel> : <><Send size={15} />Envoyer</>}</button></div>
    </div>
  </section>;
}
