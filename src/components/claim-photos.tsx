"use client";

import { useState } from "react";
import { Expand, FileImage } from "lucide-react";
import type { ClaimPhoto } from "@/db/schema";
import { Modal } from "@/components/ui";

export function ClaimPhotos({ photos }: { photos: ClaimPhoto[] }) {
  const [selected, setSelected] = useState<ClaimPhoto | null>(null);
  if (!photos.length) return <p className="small muted">Aucune photo jointe à cette demande.</p>;
  return <>
    <div className="grid grid-cols-3 gap-2">{photos.map((photo, index) => <button type="button" className="relative border-0 p-0 bg-transparent rounded-md overflow-hidden group" key={`${photo.name}-${index}`} onClick={() => setSelected(photo)}><img src={photo.dataUrl} alt={photo.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform" /><span className="absolute inset-0 grid place-items-center bg-black/0 group-hover:bg-black/30 text-transparent group-hover:text-white transition-colors"><Expand size={24} /></span></button>)}</div>
    <p className="small muted mt-2 mb-0"><FileImage size={14} className="inline mr-1" />{photos.length} justificatif{photos.length > 1 ? "s" : ""} · cliquez pour agrandir</p>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name ?? "Photo jointe"} wide>{selected ? <div><img src={selected.dataUrl} alt={selected.name} className="max-h-[65vh] w-auto max-w-full mx-auto object-contain rounded-md" /><p className="small muted text-center mt-3 mb-0">{selected.type} · {(selected.size / 1024).toFixed(0)} Ko</p></div> : null}</Modal>
  </>;
}
