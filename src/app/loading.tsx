export default function Loading() {
  return <div aria-label="Chargement de votre espace" aria-busy="true"><div className="skeleton h-10 w-2/3 rounded-md mb-3" /><div className="skeleton h-5 w-full max-w-xl rounded-md mb-6" /><div className="grid md:grid-cols-2 gap-4"><div className="skeleton h-64 rounded-lg md:col-span-2" /><div className="skeleton h-56 rounded-lg" /><div className="skeleton h-56 rounded-lg" /></div><span className="sr-only">Les informations de la boutique sont en cours de chargement.</span></div>;
}
