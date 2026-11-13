"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Search } from "lucide-react";
import { usePortal } from "@/components/portal-provider";
import { EmptyState, Modal } from "@/components/ui";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function SearchDialog() {
  const { searchOpen, setSearchOpen, searchIndex } = usePortal();
  const [query, setQuery] = useState("");
  const router = useRouter();
  useEffect(() => { if (!searchOpen) setQuery(""); }, [searchOpen]);
  const results = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return searchIndex.slice(0, 7);
    return searchIndex.filter((item) => normalize(`${item.title} ${item.subtitle} ${item.keywords}`).includes(needle)).slice(0, 10);
  }, [query, searchIndex]);

  function go(href: string) {
    setSearchOpen(false);
    router.push(href);
  }

  return (
    <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Rechercher dans votre maison" wide>
      <label className="relative block mb-4">
        <Search size={20} className="absolute left-3 top-3 muted" />
        <input autoFocus className="input pl-10 text-lg" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="CMD-2452, côte de bœuf, SAV-2026-042…" aria-label="Votre recherche" />
      </label>
      {!query ? <p className="eyebrow muted">Accès suggérés</p> : <p className="eyebrow muted">{results.length} résultat{results.length > 1 ? "s" : ""}</p>}
      {results.length === 0 ? <EmptyState title="Aucun résultat" text="Essayez un numéro de commande, un produit, un lot ou un motif de réclamation." /> : (
        <div className="grid gap-1">
          {results.map((result) => (
            <button key={`${result.kind}-${result.href}-${result.title}`} className="flex items-center gap-3 text-left w-full border-0 bg-transparent rounded-md px-3 py-3 hover:bg-[#eee6d5] transition-colors" onClick={() => go(result.href)}>
              <span className="status status-burgundy">{result.kind}</span>
              <span className="flex-1 min-w-0"><strong className="block">{result.title}</strong><span className="small muted block truncate">{result.subtitle}</span></span>
              <ArrowUpRight size={18} />
            </button>
          ))}
        </div>
      )}
      <p className="small muted mt-4 mb-0">Astuce : ouvrez cette recherche à tout moment avec Ctrl + K ou ⌘ + K.</p>
    </Modal>
  );
}
