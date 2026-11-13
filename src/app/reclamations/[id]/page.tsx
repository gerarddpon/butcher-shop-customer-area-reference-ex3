import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Camera, Check, Download, FileCheck2, RotateCcw, ShieldCheck } from "lucide-react";
import { getPortalData } from "@/lib/portal";
import { businessConfig } from "@/lib/config";
import { cn, formatDate, formatMoney } from "@/lib/format";
import { BackLink, PageHeader, ProductThumb, Reveal, StatusBadge } from "@/components/ui";
import { ClaimThread } from "@/components/claim-thread";
import { ClaimPhotos } from "@/components/claim-photos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dossier de réclamation" };

export default async function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPortalData();
  const claim = data.claims.find((entry) => entry.id === decodeURIComponent(id));
  if (!claim) notFound();
  const resolved = claim.status.includes("Résolu");
  const analysisDone = claim.status !== "Dossier reçu";
  const solutionDone = claim.creditCents > 0 || resolved || claim.resolution.includes("Conseil");
  const timeline = [
    { title: "Dossier reçu", subtitle: formatDate(claim.createdAt), done: true, current: false, icon: Check },
    { title: "Analyse de l’Atelier", subtitle: analysisDone ? `${formatDate(claim.updatedAt)} · ${!solutionDone && !resolved ? "étape en cours" : "analyse effectuée"}` : "Prise en charge sous 24 h ouvrées", done: analysisDone, current: !resolved && !solutionDone, icon: Camera },
    { title: "Solution proposée", subtitle: solutionDone ? claim.resolution : "En attente de l’analyse", done: solutionDone, current: !resolved && solutionDone, icon: FileCheck2 },
    { title: "Clôture du dossier", subtitle: resolved ? formatDate(claim.updatedAt) : "Après validation de la solution", done: resolved, current: false, icon: RotateCcw },
  ];
  const expiry = new Date(claim.updatedAt); expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);

  return <>
    <BackLink href="/reclamations">Retour aux réclamations</BackLink>
    <PageHeader title={<div className="flex items-end gap-3 flex-wrap"><h1 className="m-0">Dossier de réclamation : {claim.id}</h1><StatusBadge status={claim.status} /></div>} description={<span className="block text-right sm:text-left">Dernière mise à jour : {formatDate(claim.updatedAt)}</span>} />
    <Link href={`/commandes/${claim.orderId}`} className="block bg-[#17264c] text-white rounded-lg px-5 py-4 mb-4 hover:bg-[#223560] transition-colors"><span className="inline-flex items-center gap-1 text-sm"><ArrowLeft size={14} />Retour à la commande</span><span className="block text-2xl font-semibold">Commande : {claim.orderId} · {formatDate(claim.order.slotDate, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span></Link>
    <div className="grid xl:grid-cols-[1.7fr_1fr] gap-4 items-start">
      <div>
        <Reveal><section className="card m-0"><div className="card-title"><h2>Détail de la demande <span className="text-base muted">({claim.orderId})</span></h2><span className="chip">{claim.motif}</span></div><div className="product-row"><ProductThumb src={claim.item.product.image} alt={claim.item.product.name} size={82} /><div><h3 className="m-0">{claim.item.product.name} · {claim.item.quantityLabel}</h3><p className="m-0">Lot : {claim.item.lot} | DLC : {formatDate(claim.item.dlc)}</p><p className="small muted">Quantité concernée : {claim.quantity}</p></div></div><div className="divider" /><h3>Description détaillée :</h3><p className="whitespace-pre-wrap">{claim.description}</p><div className="divider" /><h3>Photos et justificatifs</h3><ClaimPhotos photos={claim.photos} /></section></Reveal>
        <div className="mt-4"><ClaimThread claimId={claim.id} messages={claim.messages} photos={claim.photos} resolved={resolved} /></div>
      </div>
      <aside>
        <Reveal delay={.05}><section className="kraft p-5"><h2>Suivi de statut <span className="text-base">({claim.id})</span></h2><div className="timeline mt-4">{timeline.map((entry) => { const Icon = entry.icon; return <div className={cn("timeline-item min-h-[84px]", entry.done && "timeline-done", entry.current && "timeline-current")} key={entry.title}><span className="timeline-dot"><Icon size={16} /></span><div><h3 className={cn("m-0", !entry.done && "text-[#887c68] font-normal")}>{entry.title}</h3><p className="small mb-0">{entry.subtitle}</p></div></div>; })}</div></section></Reveal>
        <Reveal delay={.08}><section className="kraft p-5 mt-4"><h2>Carte de résolution</h2><dl className="space-y-1.5"><div><dt className="inline font-medium">Résolution : </dt><dd className="inline">{claim.resolution}</dd></div><div><dt className="inline font-medium">Avoir émis : </dt><dd className="inline">{formatMoney(claim.creditCents)}</dd></div><div><dt className="inline font-medium">Date de validité : </dt><dd className="inline">{claim.creditCents > 0 ? formatDate(expiry.toISOString()) : "J+12 mois après émission"}</dd></div></dl>{claim.creditCents > 0 ? <a className="btn btn-dark w-full mt-4" href={`/api/documents/${claim.orderId}/avoir-${claim.id}`}><Download size={16} />{resolved ? "Télécharger mon avoir PDF" : "Télécharger la proposition PDF"}</a> : <button className="btn btn-dark w-full mt-4" disabled>Aucun avoir à télécharger</button>}</section></Reveal>
        <Reveal delay={.1}><section className="kraft p-5 mt-4"><h2>{claim.creditCents > 0 ? resolved ? "Avoir émis" : "Avoir proposé" : "Résolution en attente"}</h2><p>{claim.creditCents > 0 ? "Montant proposé par l’Atelier :" : "Aucun montant crédité automatiquement."}</p><div className="big-number">{formatMoney(claim.creditCents)}</div><p>Date de validité : {claim.creditCents > 0 ? formatDate(expiry.toISOString()) : "[J+12 mois]"}</p><Link href="/compte/maison#garantie" className="text-button inline-flex items-center gap-2"><ShieldCheck size={17} />Garantie fraîcheur</Link></section></Reveal>
        <p className="small mt-4">Les éléments détaillés de votre réclamation sont analysés par l’Atelier. Une réponse vous est apportée dans la messagerie sous {businessConfig.claimResponseHours} h ouvrées. En cas d’écart, la traçabilité des lots et les justificatifs sont indispensables. <BadgeCheck size={15} className="inline ml-1" /></p>
      </aside>
    </div>
  </>;
}
