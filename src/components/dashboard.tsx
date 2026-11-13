"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import {
  ArrowRight, BriefcaseBusiness, CalendarRange, ChefHat, ChevronRight, FileText,
  Maximize2, Phone, QrCode, ShoppingBag, WalletCards,
} from "lucide-react";
import type { DetailedOrder, PortalData } from "@/lib/portal";
import { activeVoucherTotal, loyaltyBalance } from "@/lib/portal-utils";
import { businessConfig } from "@/lib/config";
import { capitalize, cn, formatDateLong, formatMoney } from "@/lib/format";
import { Modal, PageHeader, Reveal, StatusBadge } from "@/components/ui";

export function Dashboard({ data, nextOrder, qrCode }: { data: PortalData; nextOrder?: DetailedOrder; qrCode?: string }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [qrOpen, setQrOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const { scrollYProgress: sceneProgress } = useScroll({ target: sceneRef, offset: ["start start", "end start"] });
  const sceneScale = useTransform(sceneProgress, [0, 1], [1, .94]);
  const sceneY = useTransform(sceneProgress, [0, 1], [0, 70]);
  const passRotate = useTransform(sceneProgress, [0, 1], [-1.5, 4]);
  const passScale = useTransform(sceneProgress, [0, 1], [1, .88]);
  const points = loyaltyBalance(data);
  const activeOrders = data.orders.filter((order) => !["Retirée", "Livrée", "Annulée"].includes(order.status));
  const totalBalance = activeOrders.reduce((sum, order) => sum + order.balanceCents, 0);
  const openClaims = data.claims.filter((claim) => !claim.status.includes("Résolu"));
  const quickLinks = [
    { href: "/commandes", title: "Mes commandes", icon: ShoppingBag, text: "Suivre, modifier, télécharger et recommander chaque pièce.", meta: `${activeOrders.length} en cours · ${data.orders.length - activeOrders.length} terminées` },
    { href: "/cagnotte", title: "Cagnotte", icon: WalletCards, text: "Points, bons d’achat et cartes-cadeaux, chacun avec son historique.", meta: `${points} points · ${formatMoney(points * 10)}` },
    { href: "/compte/factures", title: "Factures", icon: FileText, text: "Classez les justificatifs et téléchargez leur PDF.", meta: `${data.orders.length + data.claims.filter((claim) => claim.creditCents > 0).length} documents` },
    { href: "/compte/abonnements", title: "Abonnements", icon: CalendarRange, text: "Reprenez votre panier habituel et gardez la main sur sa cadence.", meta: `${data.subscriptions.filter((subscription) => subscription.status === "Actif").length} actif` },
    { href: "/compte/atelier", title: "Préférences d’atelier", icon: ChefHat, text: "Enregistrez tailles, règles de découpe et cuissons.", meta: `${data.settings.atelierPreferences.length} préférences actives` },
    { href: "/compte/professionnel", title: "Compte professionnel", icon: BriefcaseBusiness, text: "SIRET, adresse de facturation et mentions légales.", meta: data.settings.professional.siret ? "Compte professionnel" : "Compte particulier" },
  ];

  return (
    <>
      <motion.div className="fixed left-0 top-0 h-[3px] w-full origin-left bg-[#8b5b35] z-[100]" style={{ scaleX: scrollYProgress }} />
      <PageHeader title="Votre maison, Marie" description="Vos commandes, vos documents et vos préférences d’atelier. Tout ce que le comptoir sait de vous est ici, et rien d’autre." />

      <div ref={sceneRef} className="min-h-[390px] mb-6">
        <motion.section className="kraft p-4 md:p-5 origin-top" style={reduced ? undefined : { scale: sceneScale, y: sceneY }}>
          <div className="grid lg:grid-cols-[1.65fr_.8fr] gap-4 items-stretch">
            <div className="flex flex-col">
              {nextOrder ? (
                <>
                  <span className="eyebrow">Votre prochain retrait</span>
                  <h2 className="mt-2 mb-1 text-2xl md:text-3xl">{capitalize(formatDateLong(nextOrder.slotDate))} · {nextOrder.slotLabel}</h2>
                  <p className="mb-4">{nextOrder.shop} · Commande {nextOrder.id}</p>
                  <div className="bg-[rgba(255,254,248,.88)] border border-[#d5c6a6] rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start gap-3">
                      <div><strong className="text-3xl price">{formatMoney(nextOrder.balanceCents)}</strong> <span className="font-medium">à régler au retrait</span></div>
                      <StatusBadge status={nextOrder.status} />
                    </div>
                    <p className="small mt-2 mb-3">Acompte de {formatMoney(nextOrder.depositCents)} déjà encaissé. Le solde tient compte du poids réellement préparé. Vos préférences seront relues au comptoir le jour du retrait.</p>
                    <div className="actions">
                      <Link className="btn" href={`/commandes/${nextOrder.id}#actions`}>Payer ou suivre la commande</Link>
                      <Link className="btn btn-light" href={`/commandes/${nextOrder.id}#actions`}>Modifier le créneau</Link>
                    </div>
                  </div>
                  <div className="mt-auto pt-5">
                    <p className="font-semibold mb-3">Où en est la commande</p>
                    <div className="grid grid-cols-4 gap-1 relative">
                      <div className="absolute left-[8%] right-[8%] top-[11px] h-[2px] bg-[#b9a780]"><motion.div className="h-full bg-[#2b0811] origin-left" initial={{ scaleX: 0 }} animate={{ scaleX: .52 }} transition={{ duration: 1.1, delay: .35 }} /></div>
                      {["Reçue", "En préparation", "Prête", "Retirée"].map((step, index) => (
                        <div key={step} className="relative z-10 text-center small"><span className={cn("grid place-items-center mx-auto w-6 h-6 rounded-full border", index < 2 ? "bg-[#2b0811] text-white border-[#2b0811]" : "bg-[#dfcda6] border-[#a89570]")}>{index < 2 ? "✓" : index + 1}</span><span className="hidden sm:block mt-1">{index + 1}. {step}</span></div>
                      ))}
                    </div>
                  </div>
                </>
              ) : <div className="p-8"><h2>Aucun retrait programmé</h2><Link className="btn" href="/composer">Composer une commande</Link></div>}
            </div>
            {nextOrder && qrCode ? (
              <motion.div className="bg-[#fffdf7] rounded-lg p-4 text-center shadow-md origin-center" style={reduced ? undefined : { rotate: passRotate, scale: passScale }}>
                <h3 className="mb-1">Laissez-passer de retrait</h3>
                <p className="small">À présenter au comptoir libre et collecta, ou bien à gauche.</p>
                <img src={qrCode} alt={`QR code de retrait ${nextOrder.pickupCode}`} className="w-[150px] h-[150px] max-w-full mx-auto my-2" />
                <div className="bg-[#eee8d9] px-3 py-2 font-semibold tracking-widest">{nextOrder.pickupCode}</div>
                <button className="btn btn-light btn-sm mt-3" onClick={() => setQrOpen(true)}><Maximize2 size={14} />Agrandir le code</button>
              </motion.div>
            ) : null}
          </div>
        </motion.section>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Reveal><section className="card h-full m-0">
          <h2>Total cumulé des commandes en cours</h2>
          <div className="big-number mb-3">{formatMoney(totalBalance)}</div>
          {activeOrders.slice(0, 3).map((order) => <div key={order.id} className="flex justify-between gap-3 border-t border-[#e5ddce] py-2"><span><strong>{order.id}</strong><span className="small muted block">Solde à régler · {formatDateLong(order.slotDate)}</span></span><span className="price">{formatMoney(order.balanceCents)}</span></div>)}
          <div className="flex justify-between gap-3 border-t border-[#e5ddce] py-2"><span>Avoirs et bons disponibles</span><span className="status status-green">− {formatMoney(activeVoucherTotal(data))}</span></div>
          <Link href="/compte/avoirs" className="text-button inline-flex items-center gap-1 mt-1">Avoirs, consignes et acomptes <ArrowRight size={14} /></Link>
        </section></Reveal>
        <Reveal delay={.08}><section className="card h-full m-0">
          <h2>Vos documents</h2>
          {[["Factures disponibles", data.orders.length, "/compte/factures"], ["Avoirs ouverts", formatMoney(data.vouchers.filter((v) => v.kind === "Avoir" && v.status === "Actif").reduce((s, v) => s + v.valueCents, 0)), "/compte/avoirs"], ["Réclamations ouvertes", openClaims.length, "/reclamations"], ["Commandes depuis l’ouverture", data.orders.length, "/commandes"]].map(([label, value, href]) => (
            <Link href={String(href)} key={String(label)} className="flex justify-between items-center py-2.5 border-b border-[#e5ddce] hover:px-1 transition-all"><span>{label}</span><strong className="inline-flex items-center gap-2">{value}<ArrowRight size={14} /></strong></Link>
          ))}
          <Link href="/compte/factures" className="text-button inline-block mt-3">Ouvrir les documents récents →</Link>
        </section></Reveal>
        <Reveal><section className="card h-full m-0">
          <div className="card-title"><h2>Ce que le comptoir retient de vous</h2><Link href="/compte/atelier" className="text-button small">Modifier →</Link></div>
          <p className="small muted">L’Atelier prépare vos pièces en suivant ces indications. Le jour du retrait, votre boucher les confirme avec vous.</p>
          <ul className="pl-4 mb-0 space-y-1.5">{data.settings.atelierPreferences.slice(0, 4).map((preference) => <li key={preference}>{preference}</li>)}</ul>
        </section></Reveal>
        <Reveal delay={.08}><section className="card h-full m-0">
          <div className="card-title"><h2>Votre statut</h2><span className="status status-burgundy">CLIENT FIDÈLE</span></div>
          <p>Au comptoir, votre nom suffit pour retrouver une commande, une préférence ou un avoir déjà préparé.</p>
          <ul className="pl-4"><li><strong>{points} points</strong> dans votre cagnotte</li><li>Cliente depuis novembre 2024</li><li>Réponse atelier sous {businessConfig.claimResponseHours} h ouvrées</li></ul>
          <div className="notice small"><strong>Une question, un imprévu ?</strong><br />Le comptoir répond jusqu’à 19 h, du mardi au samedi.</div>
          <a href={businessConfig.phoneHref} className="btn btn-light mt-3"><Phone size={16} />Appeler le comptoir · {businessConfig.phone}</a>
        </section></Reveal>
      </div>

      <Reveal className="mt-7"><h2>Accès rapide</h2><div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {quickLinks.map((link) => { const Icon = link.icon; return <Link href={link.href} key={link.href} className="card m-0 group hover:-translate-y-1 transition-transform"><div className="flex justify-between items-start"><h3 className="inline-flex items-center gap-2">{link.title}<ChevronRight size={15} /></h3><Icon size={19} /></div><p className="small muted min-h-10">{link.text}</p><span className="chip">{link.meta}</span></Link>; })}
      </div></Reveal>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Votre laissez-passer de retrait">
        {nextOrder && qrCode ? <div className="text-center"><QrCode className="mx-auto mb-2 muted" size={22} /><img src={qrCode} alt={`QR code agrandi ${nextOrder.pickupCode}`} className="w-[300px] max-w-full mx-auto" /><h3>{nextOrder.pickupCode}</h3><p>{nextOrder.id} · {nextOrder.shop}<br />{capitalize(formatDateLong(nextOrder.slotDate))} · {nextOrder.slotLabel}</p><p className="notice small">Présentez ce code à votre arrivée. Il identifie uniquement cette commande et ne contient aucune donnée bancaire.</p></div> : null}
      </Modal>
    </>
  );
}
