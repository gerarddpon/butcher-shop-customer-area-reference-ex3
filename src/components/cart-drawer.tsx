"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { usePortal } from "@/components/portal-provider";
import { EmptyState, ProductThumb } from "@/components/ui";
import { cartLineTotal, cartQuantityLabel } from "@/lib/cart";
import { formatMoney } from "@/lib/format";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateCart, removeFromCart, busy } = usePortal();
  const total = cart.reduce((sum, item) => sum + cartLineTotal(item.product, item.quantity), 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence>
      {cartOpen ? (
        <>
          <motion.button className="modal-backdrop border-0" aria-label="Fermer le panier" onClick={() => setCartOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside className="drawer flex flex-col" role="dialog" aria-modal="true" aria-label="Votre panier" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }}>
            <div className="drawer-head">
              <div><span className="eyebrow muted">Votre prochain retrait</span><h2>Panier · {count} article{count > 1 ? "s" : ""}</h2></div>
              <button className="close-button" onClick={() => setCartOpen(false)} aria-label="Fermer"><X size={24} /></button>
            </div>
            <div className="drawer-body flex-1">
              {cart.length === 0 ? (
                <EmptyState title="Votre panier est vide" text="Composez votre commande au poids et précisez vos découpes à l’Atelier." action={<Link href="/composer" onClick={() => setCartOpen(false)} className="btn mt-3">Découvrir l’étal <ArrowRight size={16} /></Link>} />
              ) : cart.map((item) => (
                <motion.div layout key={item.productId} className="product-row" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }}>
                  <ProductThumb src={item.product.image} alt={item.product.name} size={66} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2"><strong>{item.product.name}</strong><span className="price">{formatMoney(cartLineTotal(item.product, item.quantity))}</span></div>
                    <span className="small muted">{cartQuantityLabel(item.product, item.quantity)}{item.product.unit === "kg" ? " · portions de 500 g" : ""}</span>
                    {item.cutNote ? <p className="small mb-1 mt-1">« {item.cutNote} »</p> : null}
                    <div className="flex items-center justify-between mt-2">
                      <div className="inline-flex items-center border border-[#cfc5b2] rounded-md bg-white">
                        <button className="p-1.5 border-0 bg-transparent" disabled={busy} onClick={() => updateCart(item.productId, item.quantity - 1)} aria-label="Diminuer"><Minus size={15} /></button>
                        <span className="w-7 text-center tabular">{item.quantity}</span>
                        <button className="p-1.5 border-0 bg-transparent" disabled={busy || item.quantity >= 12} onClick={() => updateCart(item.productId, item.quantity + 1)} aria-label="Augmenter"><Plus size={15} /></button>
                      </div>
                      <button className="text-button inline-flex items-center gap-1" disabled={busy} onClick={() => removeFromCart(item.productId)}><Trash2 size={14} />Retirer</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {cart.length > 0 ? (
              <div className="drawer-footer">
                <div className="flex justify-between items-end mb-3"><span>Total estimé TTC</span><strong className="text-2xl price">{formatMoney(total)}</strong></div>
                <p className="small muted">Le montant définitif est confirmé après la pesée au comptoir. Aucun débit à cette étape.</p>
                <Link href="/composer#validation" onClick={() => setCartOpen(false)} className="btn btn-lg w-full">Choisir mon retrait <ArrowRight size={17} /></Link>
                <Link href="/composer" onClick={() => setCartOpen(false)} className="btn btn-outline w-full mt-2">Modifier la composition</Link>
              </div>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
