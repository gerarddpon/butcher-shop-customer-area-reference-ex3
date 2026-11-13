"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Check, LockKeyhole, X } from "lucide-react";
import type { DetailedCartItem } from "@/lib/portal";
import { customer } from "@/lib/config";

export type SearchRecord = {
  kind: string;
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
};

type Toast = { id: number; message: string; tone: "success" | "error" };

type PortalContextValue = {
  cart: DetailedCartItem[];
  cartOpen: boolean;
  searchOpen: boolean;
  searchIndex: SearchRecord[];
  favorites: string[];
  comfort: boolean;
  locked: boolean;
  busy: boolean;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  addToCart: (productId: string, quantity?: number, cutNote?: string) => Promise<boolean>;
  updateCart: (productId: string, quantity: number, cutNote?: string) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  toggleFavorite: (productId: string) => Promise<void>;
  setComfort: (comfort: boolean) => Promise<void>;
  logout: () => void;
  unlock: () => void;
  notify: (message: string, tone?: "success" | "error") => void;
  refresh: () => void;
};

const PortalContext = createContext<PortalContextValue | null>(null);

async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Le service est momentanément indisponible.");
  return payload;
}

export function PortalProvider({ children, initialCart, initialComfort, initialFavorites, searchIndex }: {
  children: ReactNode;
  initialCart: DetailedCartItem[];
  initialComfort: boolean;
  initialFavorites: string[];
  searchIndex: SearchRecord[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [favorites, setFavorites] = useState(initialFavorites);
  const [comfort, setComfortState] = useState(initialComfort);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => setCart(initialCart), [initialCart]);
  useEffect(() => setFavorites(initialFavorites), [initialFavorites]);
  useEffect(() => setComfortState(initialComfort), [initialComfort]);
  useEffect(() => {
    document.body.classList.toggle("comfort-reading", comfort);
  }, [comfort]);
  useEffect(() => {
    setLocked(window.sessionStorage.getItem("annoix-locked") === "true");
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const notify = useCallback((message: string, tone: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4500);
  }, []);

  const mutateCart = useCallback(async (body: Record<string, unknown>, success?: string) => {
    setBusy(true);
    try {
      await api("/api/cart", { method: "POST", body: JSON.stringify(body) });
      router.refresh();
      if (success) notify(success);
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Une erreur est survenue.", "error");
      return false;
    } finally {
      setBusy(false);
    }
  }, [notify, router]);

  const value = useMemo<PortalContextValue>(() => ({
    cart,
    cartOpen,
    searchOpen,
    searchIndex,
    favorites,
    comfort,
    locked,
    busy,
    setCartOpen,
    setSearchOpen,
    addToCart: (productId, quantity = 1, cutNote = "") => mutateCart({ action: "add", productId, quantity, cutNote }, "Article ajouté au panier."),
    updateCart: (productId, quantity, cutNote) => mutateCart({ action: "update", productId, quantity, cutNote }),
    removeFromCart: (productId) => mutateCart({ action: "remove", productId }, "Article retiré du panier."),
    clearCart: () => mutateCart({ action: "clear" }, "Panier vidé."),
    toggleFavorite: async (productId) => {
      const next = favorites.includes(productId) ? favorites.filter((id) => id !== productId) : [...favorites, productId];
      setFavorites(next);
      try {
        await api("/api/preferences", { method: "PATCH", body: JSON.stringify({ favoriteProductIds: next }) });
        notify(next.includes(productId) ? "Ajouté à vos favoris." : "Retiré de vos favoris.");
      } catch (error) {
        setFavorites(favorites);
        notify(error instanceof Error ? error.message : "Préférence non enregistrée.", "error");
      }
    },
    setComfort: async (next) => {
      setComfortState(next);
      try {
        await api("/api/preferences", { method: "PATCH", body: JSON.stringify({ comfort: next }) });
        notify(next ? "Confort de lecture activé." : "Confort de lecture désactivé.");
      } catch (error) {
        setComfortState(!next);
        notify(error instanceof Error ? error.message : "Préférence non enregistrée.", "error");
      }
    },
    logout: () => {
      window.sessionStorage.setItem("annoix-locked", "true");
      setLocked(true);
      setCartOpen(false);
      setSearchOpen(false);
    },
    unlock: () => {
      window.sessionStorage.removeItem("annoix-locked");
      setLocked(false);
      notify("Session de démonstration rouverte.");
    },
    notify,
    refresh: () => router.refresh(),
  }), [cart, cartOpen, searchOpen, searchIndex, favorites, comfort, locked, busy, mutateCart, notify, router]);

  return (
    <PortalContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div key={toast.id} className="toast" initial={{ opacity: 0, x: 45, scale: .95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 30, scale: .96 }}>
              {toast.tone === "success" ? <Check size={20} /> : <AlertCircle size={20} />}
              <span className="flex-1">{toast.message}</span>
              <button className="border-0 bg-transparent text-white p-0" aria-label="Fermer la notification" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}><X size={17} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {locked ? (
          <motion.div className="fixed inset-0 z-[150] grid place-items-center p-6 bg-[#17090d] text-[#fff9ef]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="text-center max-w-md" initial={{ y: 25, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .15 }}>
              <LockKeyhole size={46} strokeWidth={1.2} className="mx-auto mb-5 text-[#d7bd87]" />
              <div className="serif text-4xl font-bold mb-3">MAISON ANNOIX</div>
              <h1 className="text-3xl">Espace verrouillé</h1>
              <p className="text-[#d9cfc2]">La session de démonstration de {customer.firstName} est verrouillée sur cet appareil. Aucune donnée n’a été supprimée.</p>
              <button className="btn bg-[#f1e3c4] text-[#2b0811] mt-4" onClick={value.unlock}>Rouvrir la session de démonstration</button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error("usePortal doit être utilisé dans PortalProvider");
  return context;
}
