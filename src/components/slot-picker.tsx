"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import type { DetailedOrder } from "@/lib/portal";
import { businessConfig } from "@/lib/config";
import { cn, formatDate, formatDateLong } from "@/lib/format";
import { dayInfo, PICKUP_TIMES, pickupDays, previousDayDeadline, SLOT_CAPACITY, slotCountKey, slotIsReserved } from "@/lib/slots";
import { LoadingLabel, Modal } from "@/components/ui";
import { usePortal } from "@/components/portal-provider";

export function PickupSlotModal({ order, open, occupancy, onClose }: {
  order: DetailedOrder;
  open: boolean;
  occupancy: Record<string, number>;
  onClose: () => void;
}) {
  const days = useMemo(() => pickupDays(businessConfig.businessDate, 7), []);
  const initialDay = days.find((day) => day.date === order.slotDate && !day.closed)?.date ?? days.find((day) => !day.closed)?.date ?? days[0].date;
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { notify, refresh } = usePortal();
  useEffect(() => {
    if (!open) return;
    setSelectedDay(days.find((entry) => entry.date === order.slotDate && !entry.closed)?.date ?? days.find((entry) => !entry.closed)?.date ?? days[0].date);
    setSelectedLabel("");
    setError("");
  }, [open, order.slotDate, days]);
  const day = dayInfo(selectedDay);
  const monthTitle = formatDate(selectedDay, { month: "long", year: "numeric" });
  const minimumRemaining = Math.min(...PICKUP_TIMES.filter((label) => !slotIsReserved(label)).map((label) => SLOT_CAPACITY - (occupancy[slotCountKey(selectedDay, label)] ?? 0)));

  async function save() {
    if (!selectedLabel) { setError("Choisissez un nouvel horaire disponible."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "slot", slotDate: selectedDay, slotLabel: selectedLabel }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Modification impossible.");
      notify(`Nouveau créneau enregistré : ${formatDateLong(selectedDay)}, ${selectedLabel}.`);
      onClose();
      refresh();
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : "Modification impossible.";
      setError(detail); notify(detail, "error");
    } finally { setBusy(false); }
  }

  return <Modal open={open} onClose={() => !busy && onClose()} title="Modifier votre créneau de retrait">
    <div>
      <h3 className="text-lg mb-2">Créneau actuel</h3>
      <p className="inline-flex items-center gap-2 text-lg mb-1"><CalendarDays size={20} />{formatDateLong(order.slotDate)} · {order.slotLabel}</p>
      <p className="inline-flex items-center gap-2"><MapPin size={19} />{order.shop}</p>
      <div className="divider" />
      <h3 className="text-lg mb-2">Nouveau créneau</h3>
      <div className="border border-[#c9bfab] rounded-md flex items-center justify-between px-3 py-2 mb-3 bg-white"><span className="capitalize">{monthTitle}</span><CalendarDays size={20} /></div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {days.map((entry) => {
          const active = entry.date === selectedDay;
          const current = entry.date === order.slotDate;
          return <button type="button" key={entry.date} disabled={entry.closed} onClick={() => { setSelectedDay(entry.date); setSelectedLabel(""); setError(""); }} className={cn("rounded-md border px-1 py-1.5 transition-colors", active ? "bg-[#343437] text-white border-[#343437]" : entry.closed ? "bg-[#ece7dc] text-[#9b9284] border-transparent cursor-not-allowed" : "bg-[#fffdf8] border-[#d7cdbb] hover:border-[#806536]", current && !active && "border-[#b58a55] bg-[#f3e8d2]")}>
            <span className="block text-[.68rem] uppercase opacity-75">{entry.dayLabel}</span><strong className="block text-lg tabular">{entry.dayNumber}</strong>
          </button>;
        })}
      </div>
      <p className="small mt-2 mb-3">{day.closed ? "Boutique fermée ce jour-là." : minimumRemaining <= 2 ? `Il reste ${Math.max(0, minimumRemaining)} place${minimumRemaining > 1 ? "s" : ""} sur certains créneaux.` : "Plusieurs créneaux restent disponibles."}</p>
      <p className="small font-medium mb-2">Note : modification possible jusqu’au {formatDate(previousDayDeadline(selectedDay))} à 22h00.</p>
      <div className="grid grid-cols-2 gap-2">
        {PICKUP_TIMES.map((label) => {
          const current = selectedDay === order.slotDate && label === order.slotLabel;
          const taken = occupancy[slotCountKey(selectedDay, label)] ?? 0;
          const full = taken >= SLOT_CAPACITY;
          const reserved = slotIsReserved(label);
          const unavailable = day.closed || full || reserved;
          const active = selectedLabel === label;
          return <button type="button" key={label} disabled={current || unavailable} onClick={() => { setSelectedLabel(label); setError(""); }} className={cn("border rounded-md px-2 py-2 flex items-center justify-between gap-2 text-left transition-colors", active ? "border-[#365f3c] bg-[#eef2e8] ring-1 ring-[#8da283]" : current ? "border-[#b58a55] bg-[#f3e8d2] text-[#776b59] cursor-not-allowed" : unavailable ? "border-transparent bg-[#ece7dc] text-[#a59b8c]" : "bg-[#fffdf8] border-[#d7cdbb] hover:border-[#806536]")}>
            <strong className="text-sm">[{label}]</strong>
            <span className="text-xs">{current ? "créneau actuel" : reserved ? "réservé" : full ? "complet" : day.closed ? "fermé" : "libre"}</span>
          </button>;
        })}
      </div>
      {error ? <p role="alert" className="notice border-[#b9867e] bg-[#f5e6df] text-[#702e27] mt-3">{error}</p> : null}
      <p className="small mt-3">Nous vous enverrons une confirmation par e-mail après validation.</p>
      <div className="flex gap-3 mt-4"><button type="button" className="btn btn-light flex-1" disabled={busy} onClick={onClose}>Annuler</button><button type="button" className="btn flex-1" disabled={busy || !selectedLabel} onClick={save}>{busy ? <LoadingLabel>Validation…</LoadingLabel> : "Valider le nouveau créneau"}</button></div>
    </div>
  </Modal>;
}
