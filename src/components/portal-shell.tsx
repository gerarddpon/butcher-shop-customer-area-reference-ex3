"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell, BriefcaseBusiness, CalendarRange, CheckSquare2, ChefHat, ChevronDown,
  CreditCard, Eye, FileText, Gift, Heart, LayoutDashboard, LockKeyhole,
  MapPin, Menu, MessageSquareWarning, Phone, Plus, Search, ShieldCheck, ShoppingBag,
  SlidersHorizontal, Star, Tickets, WalletCards, X,
} from "lucide-react";
import { businessConfig, customer } from "@/lib/config";
import { cn } from "@/lib/format";
import { usePortal } from "@/components/portal-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { SearchDialog } from "@/components/search-dialog";
import { Toggle } from "@/components/ui";

const groups = [
  {
    title: "Vos commandes",
    links: [
      { href: "/", label: "Vue d’ensemble", icon: LayoutDashboard },
      { href: "/commandes", label: "Commandes", icon: ShoppingBag, count: true },
      { href: "/compte/abonnements", label: "Abonnements", icon: CalendarRange },
      { href: "/avis", label: "Mes avis", icon: Star },
    ],
  },
  {
    title: "Paiements et documents",
    links: [
      { href: "/compte/factures", label: "Factures", icon: FileText },
      { href: "/compte/paiements", label: "Paiements", icon: CreditCard },
      { href: "/compte/avoirs", label: "Avoirs & consignes", icon: Tickets },
      { href: "/cagnotte", label: "Cagnotte", icon: WalletCards },
    ],
  },
  {
    title: "Vos préférences",
    links: [
      { href: "/compte/preferences", label: "Préférences", icon: SlidersHorizontal },
      { href: "/compte/atelier", label: "Atelier", icon: ChefHat },
      { href: "/compte/favoris", label: "Favoris", icon: Heart },
      { href: "/compte/adresses", label: "Adresses", icon: MapPin },
      { href: "/compte/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Compte et aide",
    links: [
      { href: "/compte/securite", label: "Sécurité & accès", icon: ShieldCheck },
      { href: "/reclamations", label: "Réclamations", icon: MessageSquareWarning },
      { href: "/compte/professionnel", label: "Professionnel", icon: BriefcaseBusiness },
      { href: "/compte/confidentialite", label: "Vie privée", icon: Eye },
    ],
  },
];

export function PortalShell({ children, orderCount, notificationCount }: { children: ReactNode; orderCount: number; notificationCount: number }) {
  const pathname = usePathname();
  const { cart, setCartOpen, setSearchOpen, comfort, setComfort, logout } = usePortal();
  const [navOpen, setNavOpen] = useState(false);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <div className="topbar">
        <div className="portal-container topbar-inner">
          <span>Retrait en boutique · commandez jusqu’à 48 h avant</span>
          <span className="flex items-center gap-4"><a href={businessConfig.phoneHref} className="inline-flex items-center gap-1"><Phone size={11} />{businessConfig.phone}</a><span className="hidden sm:inline">Sannois · Val-d’Oise</span></span>
        </div>
      </div>
      <header className="site-header">
        <div className="portal-container header-main">
          <Link href="/" className="brand">MAISON ANNOIX</Link>
          <nav className="main-nav" aria-label="Navigation principale">
            <Link href="/composer" className="inline-flex items-center gap-1">Boutique <ChevronDown size={13} /></Link>
            <Link href="/commandes">Suivre</Link>
            <Link href="/compte/atelier">Atelier</Link>
            <Link href="/compte/maison">La maison</Link>
            <Link href="/compte/maison#a-propos">À propos</Link>
          </nav>
          <div className="header-tools">
            <button className="tool-button" onClick={() => setSearchOpen(true)} aria-label="Rechercher"><Search size={20} /></button>
            <Link href="/compte/preferences" className="tool-button relative p-0 overflow-hidden border border-[#d4c8b5] ml-1" aria-label="Mon compte"><Image src="/images/avatar-marie.jpg" alt="Marie Dupont" width={36} height={36} className="w-9 h-9 object-cover" /></Link>
            <Link href="/cagnotte" className="tool-button hide-mobile" aria-label="Cagnotte et cartes-cadeaux"><Gift size={20} /></Link>
            <Link href="/compte/notifications" className="tool-button relative hide-mobile" aria-label={`Notifications${notificationCount ? `, ${notificationCount} en attente` : ""}`}><Bell size={20} />{notificationCount > 0 ? <span className="count-badge bg-[#8e2f3e]">{notificationCount}</span> : null}</Link>
            <button className="tool-button relative hide-mobile" onClick={() => setCartOpen(true)} aria-label="Ouvrir le panier"><ShoppingBag size={20} />{cartCount > 0 ? <span className="count-badge">{cartCount}</span> : null}</button>
            <button className="btn btn-sm rounded-full" onClick={() => setCartOpen(true)}>Panier ({cartCount})</button>
          </div>
        </div>
      </header>

      <div className="portal-container client-bar">
        <div className="eyebrow">Espace client — Bonjour {customer.firstName} <span className="font-normal normal-case tracking-normal">({customer.email})</span></div>
        <div className="client-bar-actions">
          <span className="client-chip"><Plus size={13} />Confort de lecture <Toggle checked={comfort} onChange={setComfort} label="Confort de lecture" /></span>
          <Link href="/composer" className="client-chip"><Plus size={13} />Composer une commande</Link>
          <button className="client-chip" onClick={logout}><LockKeyhole size={13} />Se déconnecter</button>
        </div>
      </div>

      <div className="portal-container portal-grid">
        <aside className={cn("sidebar", navOpen && "sidebar-open")}>
          <button className="mobile-nav-toggle" onClick={() => setNavOpen((open) => !open)} aria-expanded={navOpen}><span className="inline-flex items-center gap-2"><Menu size={18} />Menu de l’espace client</span>{navOpen ? <X size={18} /> : <ChevronDown size={18} />}</button>
          <div className="sidebar-groups">
            {groups.map((group) => (
              <div className="sidebar-group" key={group.title}>
                <p className="sidebar-heading">{group.title}</p>
                <nav aria-label={group.title}>
                  {group.links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link key={link.href} href={link.href} onClick={() => setNavOpen(false)} className={cn("sidebar-link", isActive(link.href) && "sidebar-link-active")} aria-current={isActive(link.href) ? "page" : undefined}>
                        <Icon size={15} strokeWidth={1.8} />{link.label}{link.count ? <span className="sidebar-count">{orderCount}</span> : null}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </aside>
        <main className="portal-content" id="contenu">{children}</main>
      </div>

      <footer className="site-footer">
        <div className="portal-container footer-inner">
          <p><strong>Une question, un imprévu ?</strong> Les statuts affichés sont ceux enregistrés par la boutique. Les avoirs, consignes et acomptes restent consultables dix ans. En mode démonstration, les paiements sont simulés et aucun débit réel n’est effectué.</p>
          <div className="whitespace-nowrap"><Link href="/compte/confidentialite" className="text-button">Confidentialité</Link> · <a href={businessConfig.phoneHref} className="text-button">{businessConfig.phone}</a></div>
        </div>
      </footer>
      <CartDrawer />
      <SearchDialog />
    </>
  );
}
