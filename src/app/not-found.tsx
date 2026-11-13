import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return <section className="card text-center py-12"><Search size={46} className="mx-auto muted mb-4" strokeWidth={1.3} /><span className="eyebrow muted">Erreur 404</span><h1 className="mt-2">Cette page n’est pas au comptoir</h1><p className="max-w-lg mx-auto">Le document ou la commande demandé est introuvable. Il a peut-être été déplacé ou son adresse est incomplète.</p><div className="actions justify-center"><Link href="/" className="btn"><ArrowLeft size={16} />Retour à votre maison</Link><Link href="/commandes" className="btn btn-outline">Voir vos commandes</Link></div></section>;
}
