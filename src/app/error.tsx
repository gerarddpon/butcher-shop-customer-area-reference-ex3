"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="card text-center py-12"><AlertCircle size={48} className="mx-auto text-[#7a3e32] mb-4" strokeWidth={1.3} /><h1>Le comptoir numérique ne répond pas</h1><p className="max-w-lg mx-auto">Vos données sont conservées. Rechargez cette vue ou contactez la boutique si le problème persiste.</p><button className="btn" onClick={reset}><RotateCcw size={16} />Recharger les informations</button><a className="btn btn-outline ml-2" href="tel:0139471222">Appeler le 01 39 47 12 22</a></section>;
}
